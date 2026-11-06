import Big from 'big.js'
import { delay, http, HttpResponse } from 'msw'
import {
  API_BASE,
  IDEMPOTENCY_HEADER,
  IDEMPOTENT_REPLAY_HEADER,
  createOrderRequestSchema,
  endpoints,
  idempotencyKeySchema,
  orderListResponseSchema,
  paginationQuerySchema,
  routePatterns,
  type Quote,
} from '../../src/api/contracts'
import { authenticate, isError } from '../auth'
import { findEdition, getCart } from '../cart'
import { db, persist, type OrderRecord } from '../db'
import { mutateNft } from '../nftState'
import { applyNetwork, currentScenario, errorResponse, setScenario } from '../network'
import { SETTLE_MS, SETTLE_SLOW_MS, publicOrder, scheduleSettlement, settleIfDue } from '../orders'
import { buildQuote, quoteFingerprint, rememberQuote } from './quotes'

/** Cenários de "durante a compra" (§6): rodam uma vez, no próximo pedido, e voltam ao padrão. */
function applyPurchaseScenario(ownerKey: string) {
  const scenario = currentScenario()
  if (scenario !== 'price-changed' && scenario !== 'sold-out-during-purchase') return
  setScenario('default')
  const first = getCart(ownerKey).items[0]
  const found = first && findEdition(first.nftId, first.editionId)
  if (!found) return
  if (scenario === 'price-changed') {
    mutateNft(found.nft.id, { [found.edition.id]: { priceEth: new Big(found.edition.priceEth).plus('0.05').toFixed(2) } })
  } else {
    mutateNft(found.nft.id, { [found.edition.id]: { available: 0 } })
  }
}

export const orderHandlers = [
  http.post(`${API_BASE}${endpoints.orders}`, async ({ request }) => {
    const failure = await applyNetwork(request)
    if (failure) return failure
    const auth = authenticate(request)
    if (isError(auth)) return auth
    const userId = auth.user.id

    const key = idempotencyKeySchema.safeParse(request.headers.get(IDEMPOTENCY_HEADER))
    if (!key.success) {
      return errorResponse('validation_error', 'Chave de idempotência obrigatória.', { fieldErrors: { [IDEMPOTENCY_HEADER]: ['Informe a chave de idempotência'] } })
    }
    const parsed = createOrderRequestSchema.safeParse(await request.json().catch(() => ({})))
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {}
      for (const issue of parsed.error.issues) (fieldErrors[issue.path.join('.') || 'form'] ??= []).push(issue.message)
      return errorResponse('validation_error', 'Revise os campos informados.', { fieldErrors })
    }

    // Idempotência: mesma chave e mesmo conteúdo devolve o mesmo pedido; conteúdo diferente é conflito.
    const fingerprint = JSON.stringify(parsed.data)
    const stored = db.idempotency[`${userId}:${key.data}`]
    if (stored) {
      if (stored.fingerprint !== fingerprint) {
        return errorResponse('idempotency_conflict', 'Esta chave já foi usada com outro conteúdo.')
      }
      const existing = db.orders.find((o) => o.id === stored.orderId)!
      settleIfDue(existing)
      return HttpResponse.json(publicOrder(existing), { status: 200, headers: { [IDEMPOTENT_REPLAY_HEADER]: 'true' } })
    }

    const wallet = (db.wallets[userId] ?? []).find((w) => w.id === parsed.data.walletId)
    if (!wallet) return errorResponse('not_found', 'Carteira não encontrada.')
    if (wallet.connection.status !== 'connected' || wallet.connection.network !== parsed.data.network) {
      return errorResponse('wallet_not_connected', 'Conecte a carteira na rede escolhida para continuar.')
    }

    const submitted = db.quotes[parsed.data.quoteId]
    if (!submitted || submitted.ownerKey !== userId) return errorResponse('not_found', 'Cotação não encontrada.')

    applyPurchaseScenario(userId)

    // Revalidação: preço, disponibilidade, cupom e taxa são recalculados agora (§3, §7).
    const fresh: Quote = buildQuote(userId, parsed.data.network)
    if (fresh.lines.length === 0 || fresh.issues.some((i) => i.kind === 'unavailable')) {
      return errorResponse('availability_conflict', 'Algum item não está mais disponível.', { details: { quote: rememberQuote(userId, fresh) } })
    }
    const expired = Date.parse(submitted.quote.expiresAt) <= Date.now()
    if (expired || quoteFingerprint(submitted.quote) !== quoteFingerprint(fresh)) {
      // Mudança exige nova confirmação: devolve a cotação nova e não cria pedido.
      return errorResponse('quote_stale', 'Os valores mudaram. Revise a nova cotação para continuar.', {
        details: { quote: rememberQuote(userId, fresh) },
      })
    }

    const cart = getCart(userId)
    const now = new Date()
    const wait = currentScenario() === 'payment-slow' ? SETTLE_SLOW_MS : SETTLE_MS
    const declined = currentScenario() === 'payment-declined'
    const timeoutAfterCreate = currentScenario() === 'order-timeout'
    if (declined || timeoutAfterCreate) setScenario('default')

    const order: OrderRecord = {
      id: `ord_${crypto.randomUUID().slice(0, 8)}`,
      status: 'pending',
      version: 1,
      network: parsed.data.network,
      walletAddress: wallet.address,
      // Recibo: snapshot imutável do que o usuário confirmou.
      lines: fresh.lines.map((l) => {
        const nft = db.nfts.find((n) => n.id === l.nftId)!
        return {
          nftId: l.nftId,
          title: l.title,
          editionLabel: l.editionLabel,
          imageUrl: nft.image.url,
          quantity: l.quantity,
          unitPriceEth: l.unitPriceEth,
          lineTotalEth: l.lineTotalEth,
        }
      }),
      subtotalEth: fresh.subtotalEth,
      discountEth: fresh.discountEth,
      networkFeeEth: fresh.networkFeeEth,
      totalEth: fresh.totalEth,
      couponCode: fresh.coupon?.code ?? cart.couponCode ?? null,
      collector: parsed.data.collector,
      txHash: null,
      explorerUrl: null,
      rejectionReason: null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      settledAt: null,
      userId,
      settleAt: new Date(now.getTime() + wait).toISOString(),
      outcome: declined ? 'rejected' : 'confirmed',
      purchased: fresh.lines.map((l) => ({ nftId: l.nftId, editionId: l.editionId, quantity: l.quantity })),
    }
    db.orders.unshift(order)
    db.idempotency[`${userId}:${key.data}`] = { fingerprint, orderId: order.id }
    persist()
    scheduleSettlement(order)

    // Timeout após criar: o pedido já existe, mas a resposta demora além do timeout do cliente.
    // A recuperação é repetir a mesma chave (resposta acima) e receber o mesmo pedido (§6).
    if (timeoutAfterCreate) await delay(15_000)

    return HttpResponse.json(publicOrder(order), { status: 201 })
  }),

  http.get(`${API_BASE}${endpoints.orders}`, async ({ request }) => {
    const failure = await applyNetwork(request)
    if (failure) return failure
    const auth = authenticate(request)
    if (isError(auth)) return auth
    const query = paginationQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams))
    const mine = db.orders.filter((o) => o.userId === auth.user.id)
    mine.forEach(settleIfDue)
    const start = (query.page - 1) * query.pageSize
    return HttpResponse.json(
      orderListResponseSchema.parse({
        items: mine.slice(start, start + query.pageSize).map(publicOrder),
        page: query.page,
        pageSize: query.pageSize,
        total: mine.length,
        totalPages: Math.ceil(mine.length / query.pageSize),
      }),
    )
  }),

  http.get(`${API_BASE}${routePatterns.order}`, async ({ request, params }) => {
    const failure = await applyNetwork(request)
    if (failure) return failure
    const auth = authenticate(request)
    if (isError(auth)) return auth
    const order = db.orders.find((o) => o.id === params.id)
    if (!order) return errorResponse('not_found', 'Pedido não encontrado.')
    // Pedido de outro usuário nunca é exposto (§11, eliminatório).
    if (order.userId !== auth.user.id) return errorResponse('forbidden', 'Este pedido pertence a outro usuário.')
    settleIfDue(order)
    return HttpResponse.json(publicOrder(order))
  }),
]

