import { errorResponse, currentScenario, setScenario } from './network'
import { db, persist, type SessionRecord } from './db'
import type { UserRecord } from './fixtures/users'

/** TTL curto o bastante para a expiração real aparecer numa demonstração longa. */
export const SESSION_TTL_MS = 30 * 60 * 1000

export async function hashPassword(salt: string, password: string): Promise<string> {
  const bytes = new TextEncoder().encode(`${salt}:${password}`)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function newSalt() {
  return `salt-${crypto.randomUUID()}`
}

export function createSession(userId: string): SessionRecord {
  const session: SessionRecord = {
    token: `tok_${crypto.randomUUID()}`,
    userId,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
    expired: false,
  }
  // Uma sessão ativa por usuário por vez nesta demonstração; sessões antigas viram `expired`.
  db.sessions = db.sessions.filter((s) => s.userId !== userId || s.expired)
  db.sessions.push(session)
  persist()
  return session
}

export type Authed = { user: UserRecord; session: SessionRecord }

/**
 * Autentica pelo Bearer. Devolve o usuário, ou a resposta de erro adequada:
 * `unauthenticated` (sem token ou desconhecido) e `session_expired` (token que expirou).
 * O cenário `session-expired` derruba a sessão atual uma única vez e volta ao padrão, para o login seguinte funcionar.
 */
export function authenticate(request: Request): Authed | Response {
  const header = request.headers.get('Authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  const session = token ? db.sessions.find((s) => s.token === token) : undefined
  if (!session) return errorResponse('unauthenticated', 'Faça login para continuar.')

  if (currentScenario() === 'session-expired') {
    session.expired = true
    persist()
    setScenario('default')
  }
  if (session.expired || Date.parse(session.expiresAt) <= Date.now()) {
    session.expired = true
    persist()
    return errorResponse('session_expired', 'Sua sessão expirou. Entre novamente para continuar.')
  }
  const user = db.users.find((u) => u.id === session.userId)
  if (!user) return errorResponse('unauthenticated', 'Faça login para continuar.')
  return { user, session }
}

export const isError = (value: Authed | Response): value is Response => value instanceof Response
