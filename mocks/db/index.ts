import { buildNftFixtures, type NftRecord } from '../fixtures/nfts'
import { buildUserFixtures, type UserRecord } from '../fixtures/users'

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

/** O que sobrevive a refresh (localStorage). O catálogo é recriado das fixtures a cada carga. */
type Persisted = {
  users: UserRecord[]
  sessions: SessionRecord[]
  /** nftIds favoritados, por usuário. */
  favorites: Record<string, string[]>
  /** Carrinhos por dono: `user-<id>` ou `guest:<uuid>` do visitante. */
  carts: Record<string, CartRecord>
}

const STORAGE_KEY = 'kurio:mock-db'
const SCHEMA = 2

function seed(): Persisted {
  return { users: buildUserFixtures(), sessions: [], favorites: {}, carts: {} }
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
export const db: Persisted & { nfts: NftRecord[] } = { ...load(), nfts: buildNftFixtures() }

export function persist() {
  try {
    const data: Persisted = { users: db.users, sessions: db.sessions, favorites: db.favorites, carts: db.carts }
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
