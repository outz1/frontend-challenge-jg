import { http, HttpResponse } from 'msw'
import {
  API_BASE,
  connectWalletRequestSchema,
  copyPrimaryWalletRequestSchema,
  createWalletRequestSchema,
  endpoints,
  routePatterns,
  updateWalletRequestSchema,
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
    const body = await request.json().catch(() => ({}))
    const mine = (db.wallets[auth.user.id] ??= [])
    const kindTaken = (kind: 'primary' | 'secondary') => {
      const label = kind === 'primary' ? 'principal' : 'secundária'
      return errorResponse('wallet_kind_taken', `Você já tem uma carteira ${label}.`, { fieldErrors: { kind: [`Já existe uma carteira ${label}.`] } })
    }

    // "Igual à carteira principal": copia os dados da principal da própria conta (Figma 9:1866). Só aqui o endereço se repete.
    const copy = copyPrimaryWalletRequestSchema.safeParse(body)
    if (copy.success) {
      const primary = mine.find((w) => w.kind === 'primary')
      if (!primary) return errorResponse('validation_error', 'Cadastre a carteira principal antes.', { fieldErrors: { kind: ['Cadastre a carteira principal antes'] } })
      if (mine.some((w) => w.kind === 'secondary')) return kindTaken('secondary')
      const wallet: Wallet = {
        ...primary,
        id: `wallet-${crypto.randomUUID().slice(0, 8)}`,
        kind: 'secondary',
        connection: { status: 'disconnected', network: null, provider: null, connectedAt: null },
      }
      mine.push(wallet)
      persist()
      return HttpResponse.json(wallet, { status: 201 })
    }

    const parsed = createWalletRequestSchema.safeParse(body)
    if (!parsed.success) return validation(parsed.error)
    if (mine.some((w) => w.kind === parsed.data.kind)) return kindTaken(parsed.data.kind)
    if (mine.some((w) => w.address.toLowerCase() === parsed.data.address.toLowerCase())) {
      return errorResponse('validation_error', 'Este endereço já está cadastrado.', { fieldErrors: { address: ['Este endereço já está cadastrado.'] } })
    }
    const wallet: Wallet = {
      id: `wallet-${crypto.randomUUID().slice(0, 8)}`,
      ...parsed.data,
      connection: { status: 'disconnected', network: null, provider: null, connectedAt: null },
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

    const { network, address, ...rest } = parsed.data
    const mine = db.wallets[auth.user.id] ?? []
    // Uma secundária copiada da principal mantém o mesmo endereço; só um endereço novo precisa ser inédito.
    if (address !== wallet.address && mine.some((w) => w.id !== wallet.id && w.address.toLowerCase() === address.toLowerCase())) {
      return errorResponse('validation_error', 'Este endereço já está cadastrado.', { fieldErrors: { address: ['Este endereço já está cadastrado.'] } })
    }
    // Mudar rede ou endereço derruba a conexão: precisa reconectar.
    if (network !== wallet.network || address !== wallet.address) {
      wallet.connection = { status: 'disconnected', network: null, provider: null, connectedAt: null }
    }
    Object.assign(wallet, { network, address, ...rest })
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
    wallet.connection = { status: 'connected', network: parsed.data.network, provider: parsed.data.provider, connectedAt: new Date().toISOString() }
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
    wallet.connection = { status: 'disconnected', network: null, provider: null, connectedAt: null }
    persist()
    return HttpResponse.json(wallet)
  }),
]
