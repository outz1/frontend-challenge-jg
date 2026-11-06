import { http, HttpResponse } from 'msw'
import {
  API_BASE,
  connectWalletRequestSchema,
  createWalletRequestSchema,
  endpoints,
  routePatterns,
  updateWalletRequestSchema,
  walletAddressValid,
  type Wallet,
} from '../../src/api/contracts'
import { authenticate, isError } from '../auth'
import { db, persist } from '../db'
import { applyNetwork, currentScenario, errorResponse, setScenario } from '../network'

function validation(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  const fieldErrors: Record<string, string[]> = {}
  for (const issue of error.issues) (fieldErrors[String(issue.path[0] ?? 'form')] ??= []).push(issue.message)
  return errorResponse('validation_error', 'Revise os campos informados.', { fieldErrors })
}

/** Carteira do usuário; `forbidden` se for de outro, `not_found` se não existir (sem vazar dados). */
function ownWallet(userId: string, id: string): Wallet | Response {
  const own = (db.wallets[userId] ?? []).find((w) => w.id === id)
  if (own) return own
  const exists = Object.values(db.wallets).some((list) => list.some((w) => w.id === id))
  return exists ? errorResponse('forbidden', 'Esta carteira pertence a outro usuário.') : errorResponse('not_found', 'Carteira não encontrada.')
}

export const walletHandlers = [
  http.get(`${API_BASE}${endpoints.wallets}`, async ({ request }) => {
    const failure = await applyNetwork(request)
    if (failure) return failure
    const auth = authenticate(request)
    if (isError(auth)) return auth
    return HttpResponse.json({ items: db.wallets[auth.user.id] ?? [] })
  }),

  http.post(`${API_BASE}${endpoints.wallets}`, async ({ request }) => {
    const failure = await applyNetwork(request)
    if (failure) return failure
    const auth = authenticate(request)
    if (isError(auth)) return auth
    const parsed = createWalletRequestSchema.safeParse(await request.json().catch(() => ({})))
    if (!parsed.success) return validation(parsed.error)

    const mine = (db.wallets[auth.user.id] ??= [])
    if (mine.some((w) => w.kind === parsed.data.kind)) {
      const label = parsed.data.kind === 'primary' ? 'principal' : 'secundária'
      return errorResponse('wallet_kind_taken', `Você já tem uma carteira ${label}.`, { fieldErrors: { kind: [`Já existe uma carteira ${label}.`] } })
    }
    if (mine.some((w) => w.address.toLowerCase() === parsed.data.address.toLowerCase())) {
      return errorResponse('validation_error', 'Este endereço já está cadastrado.', { fieldErrors: { address: ['Este endereço já está cadastrado.'] } })
    }
    const wallet: Wallet = {
      id: `wallet-${crypto.randomUUID().slice(0, 8)}`,
      kind: parsed.data.kind,
      network: parsed.data.network,
      address: parsed.data.address,
      label: parsed.data.label || null,
      connection: { status: 'disconnected', network: null, connectedAt: null },
    }
    mine.push(wallet)
    persist()
    return HttpResponse.json(wallet, { status: 201 })
  }),

  http.patch(`${API_BASE}${routePatterns.wallet}`, async ({ request, params }) => {
    const failure = await applyNetwork(request)
    if (failure) return failure
    const auth = authenticate(request)
    if (isError(auth)) return auth
    const wallet = ownWallet(auth.user.id, String(params.id))
    if (wallet instanceof Response) return wallet
    const parsed = updateWalletRequestSchema.safeParse(await request.json().catch(() => ({})))
    if (!parsed.success) return validation(parsed.error)

    const network = parsed.data.network ?? wallet.network
    const address = parsed.data.address ?? wallet.address
    if (!walletAddressValid(network, address)) {
      return errorResponse('validation_error', 'Endereço inválido para a rede selecionada.', {
        fieldErrors: { address: ['Endereço inválido para a rede selecionada'] },
      })
    }
    wallet.network = network
    wallet.address = address
    if (parsed.data.label !== undefined) wallet.label = parsed.data.label || null
    // Mudar rede ou endereço derruba a conexão: precisa reconectar.
    if (parsed.data.network || parsed.data.address) wallet.connection = { status: 'disconnected', network: null, connectedAt: null }
    persist()
    return HttpResponse.json(wallet)
  }),

  // Conexão simulada no servidor: sobrevive a refresh e não vive em componente (§6).
  http.post(`${API_BASE}${routePatterns.walletConnect}`, async ({ request, params }) => {
    const failure = await applyNetwork(request)
    if (failure) return failure
    const auth = authenticate(request)
    if (isError(auth)) return auth
    const wallet = ownWallet(auth.user.id, String(params.id))
    if (wallet instanceof Response) return wallet
    const parsed = connectWalletRequestSchema.safeParse(await request.json().catch(() => ({})))
    if (!parsed.success) return validation(parsed.error)

    // Cenário `wallet-rejected`: o usuário recusa a conexão (uma vez), para o fluxo de recusa.
    if (currentScenario() === 'wallet-rejected') {
      setScenario('default')
      return errorResponse('wallet_rejected', 'A conexão foi recusada na carteira.')
    }
    wallet.connection = { status: 'connected', network: parsed.data.network, connectedAt: new Date().toISOString() }
    persist()
    return HttpResponse.json(wallet)
  }),

  http.post(`${API_BASE}${routePatterns.walletDisconnect}`, async ({ request, params }) => {
    const failure = await applyNetwork(request)
    if (failure) return failure
    const auth = authenticate(request)
    if (isError(auth)) return auth
    const wallet = ownWallet(auth.user.id, String(params.id))
    if (wallet instanceof Response) return wallet
    wallet.connection = { status: 'disconnected', network: null, connectedAt: null }
    persist()
    return HttpResponse.json(wallet)
  }),
]
