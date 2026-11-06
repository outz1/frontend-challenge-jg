import { buildNftFixtures, type NftRecord } from '../fixtures/nfts'
import type { Order, Quote, Wallet } from '../../src/api/contracts'
import { buildUserFixtures, type UserRecord } from '../fixtures/users'
import { buildWalletFixtures } from '../fixtures/wallets'

export type SessionRecord = {
  token: string
  userId: string
  expiresAt: string
  /** Sessão invalidada pelo servidor (expiração simulada ou logout): continua guardada para responder `session_expired`. */
  expired: boolean
}

export type CartLine = { id: string; nftId: string; editionId: string; quantity: number }

export type CartRecord = {
  items: CartLine[]
  couponCode: string | null
  /** Sobe a cada mudança do carrinho; a cotação guarda a versão que viu. */
  version: number
  updatedAt: string
}

/** Pedido do mock: o contrato público mais o que só o servidor sabe (dono, quando e como termina). */
export type OrderRecord = Order & {
  userId: string
  /** Quando a simulação decide o pedido. */
  settleAt: string
  outcome: 'confirmed' | 'rejected'
  /** Itens e quantidades comprados: só eles saem do carrinho na confirmação (§3). */
  purchased: { nftId: string; editionId: string; quantity: number }[]
}

export type StoredQuote = { ownerKey: string; quote: Quote }

/** Mudanças em NFTs sobre as fixtures (preço e estoque por edição), para REST e eventos concordarem após refresh. */
export type NftState = Record<string, { version: number; editions: Record<string, { available: number | null; priceEth: string }> }>

/** O que sobrevive a refresh (localStorage). O catálogo é recriado das fixtures a cada carga. */
type Persisted = {
  users: UserRecord[]
  sessions: SessionRecord[]
  /** nftIds favoritados, por usuário. */
  favorites: Record<string, string[]>
  /** Carrinhos por dono: `user-<id>` ou `guest:<uuid>` do visitante. */
  carts: Record<string, CartRecord>
  wallets: Record<string, Wallet[]>
  orders: OrderRecord[]
  /** `${userId}:${Idempotency-Key}` para o pedido criado e a impressão digital do conteúdo. */
  idempotency: Record<string, { fingerprint: string; orderId: string }>
  quotes: Record<string, StoredQuote>
  nftState: NftState
}

const STORAGE_KEY = 'kurio:mock-db'
const SCHEMA = 6

function seed(): Persisted {
  return {
    users: buildUserFixtures(),
    sessions: [],
    favorites: {},
    carts: {},
    wallets: buildWalletFixtures(),
    orders: [],
    idempotency: {},
    quotes: {},
    nftState: {},
  }
}

function load(): Persisted {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seed()
    const parsed = JSON.parse(raw) as { schema: number; data: Persisted }
    return parsed.schema === SCHEMA ? parsed.data : seed()
  } catch {
    return seed()
  }
}

/**
 * Estado em memória do mock. REST e eventos leem daqui, então uma mudança aparece nos dois (§6).
 * Chame `persist()` depois de cada mutação para sobreviver a refresh.
 */
/** Catálogo = fixtures + mudanças persistidas (estoque, preço, versão). */
function buildNfts(state: NftState): NftRecord[] {
  return buildNftFixtures().map((nft) => {
    const saved = state[nft.id]
    if (!saved) return nft
    nft.version = saved.version
    for (const edition of nft.editions) {
      const change = saved.editions[edition.id]
      if (change) Object.assign(edition, change)
    }
    return nft
  })
}

const initial = load()
export const db: Persisted & { nfts: NftRecord[] } = { ...initial, nfts: buildNfts(initial.nftState) }

export function persist() {
  try {
    const data: Persisted = {
      users: db.users,
      sessions: db.sessions,
      favorites: db.favorites,
      carts: db.carts,
      wallets: db.wallets,
      orders: db.orders,
      idempotency: db.idempotency,
      quotes: db.quotes,
      nftState: db.nftState,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ schema: SCHEMA, data }))
  } catch {
    // Sem storage (modo privado ou cota cheia): o mock segue só em memória.
  }
}

/** Restaura o cenário conhecido: usuários das fixtures, sem sessões, favoritos nem pedidos. */
export function resetDb() {
  Object.assign(db, seed(), { nfts: buildNftFixtures() })
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ver `persist`
  }
}
