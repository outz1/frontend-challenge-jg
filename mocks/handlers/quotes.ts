import Big from 'big.js'
import { http, HttpResponse } from 'msw'
import {
  API_BASE,
  endpoints,
  quoteRequestSchema,
  type Network,
  type Quote,
} from '../../src/api/contracts'
import { eth, findEdition, getCart, maxFor, ownerOf } from '../cart'
import { findCoupon } from '../fixtures/coupons'
import { applyNetwork, errorResponse } from '../network'

/** Taxa de rede por pedido, em ETH. */
export const NETWORK_FEE: Record<Network, string> = { ethereum: '0.0120', polygon: '0.0004', solana: '0.0001' }
export const QUOTE_TTL_MS = 5 * 60 * 1000

/** Calcula a cotação autoritativa do carrinho atual. Reaproveitada pela criação de pedido para detectar `quote_stale`. */
export function buildQuote(ownerKey: string, network: Network): Quote {
  const cart = getCart(ownerKey)
  const lines: Quote['lines'] = []
  const issues: Quote['issues'] = []
  let subtotal = new Big(0)

  for (const line of cart.items) {
    const found = findEdition(line.nftId, line.editionId)
    if (!found) continue
    const max = maxFor(found.edition)
    if (max === 0) {
      issues.push({ kind: 'unavailable', itemId: line.id, message: `${found.nft.title} (${found.edition.label}) está esgotado.` })
      continue
    }
    // Quantidade acima do permitido: a cotação usa o máximo e avisa.
    const quantity = Math.min(line.quantity, max)
    if (quantity < line.quantity) {
      issues.push({
        kind: 'quantity_reduced',
        itemId: line.id,
        message: `${found.nft.title}: quantidade ajustada para ${quantity} pela disponibilidade.`,
      })
    }
    const lineTotal = new Big(found.edition.priceEth).times(quantity)
    subtotal = subtotal.plus(lineTotal)
    lines.push({
      itemId: line.id,
      nftId: line.nftId,
      editionId: line.editionId,
      title: found.nft.title,
      editionLabel: found.edition.label,
      quantity,
      unitPriceEth: found.edition.priceEth,
      lineTotalEth: eth(lineTotal),
    })
  }

  let coupon: Quote['coupon'] = null
  let discount = new Big(0)
  if (cart.couponCode) {
    const record = findCoupon(cart.couponCode)
    if (record && !record.expired) {
      discount = subtotal.times(record.percent).div(100)
      coupon = { code: record.code, discountEth: eth(discount) }
    } else {
      issues.push({ kind: 'coupon_invalid', message: 'O cupom aplicado não é mais válido.' })
    }
  }

  const fee = lines.length > 0 ? new Big(NETWORK_FEE[network]) : new Big(0)
  const total = subtotal.minus(discount).plus(fee)
  const now = Date.now()
  return {
    id: `quote-${crypto.randomUUID().slice(0, 8)}`,
    network,
    cartVersion: cart.version,
    lines,
    subtotalEth: eth(subtotal),
    discountEth: eth(discount),
    networkFeeEth: eth(fee),
    totalEth: eth(total),
    coupon,
    issues,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + QUOTE_TTL_MS).toISOString(),
  }
}

export const quoteHandlers = [
  http.post(`${API_BASE}${endpoints.quotes}`, async ({ request }) => {
    const failure = await applyNetwork(request)
    if (failure) return failure
    const owner = ownerOf(request)
    if (owner instanceof Response) return owner
    const parsed = quoteRequestSchema.safeParse(await request.json().catch(() => ({})))
    if (!parsed.success) return errorResponse('validation_error', 'Rede inválida.', { fieldErrors: { network: ['Rede inválida.'] } })
    return HttpResponse.json(buildQuote(owner.key, parsed.data.network))
  }),
]
