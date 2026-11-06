import { http, HttpResponse } from 'msw'
import {
  API_BASE,
  endpoints,
  loginRequestSchema,
  signupRequestSchema,
  type AuthResponse,
  type Session,
} from '../../src/api/contracts'
import { authenticate, createSession, hashPassword, isError, newSalt } from '../auth'
import { mergeGuestCart } from '../cart'
import { db, persist } from '../db'
import type { UserRecord } from '../fixtures/users'
import { applyNetwork, errorResponse } from '../network'

/** Usuário inicial derivado do e-mail: só letras, números e `_`, de 3 a 20 caracteres. */
function defaultUsername(email: string) {
  const base = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 20)
  return base.length >= 3 ? base : `${base}_user`.slice(0, 20)
}

const toUser = (u: UserRecord) => ({ id: u.id, name: u.name, email: u.email, avatarUrl: u.avatarUrl })

function fieldErrors(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  const out: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form')
    ;(out[key] ??= []).push(issue.message)
  }
  return out
}

export const authHandlers = [
  http.post(`${API_BASE}${endpoints.signup}`, async ({ request }) => {
    const failure = await applyNetwork(request)
    if (failure) return failure

    const parsed = signupRequestSchema.safeParse(await request.json().catch(() => ({})))
    if (!parsed.success) {
      return errorResponse('validation_error', 'Revise os campos informados.', { fieldErrors: fieldErrors(parsed.error) })
    }
    const email = parsed.data.email.toLowerCase()
    if (db.users.some((u) => u.email === email)) {
      return errorResponse('email_taken', 'Este e-mail já está em uso.', {
        fieldErrors: { email: ['Este e-mail já está em uso.'] },
      })
    }
    const salt = newSalt()
    const user: UserRecord = {
      id: `user-${crypto.randomUUID().slice(0, 8)}`,
      name: parsed.data.name,
      email,
      salt,
      passwordHash: await hashPassword(salt, parsed.data.password),
      username: defaultUsername(email),
      ensName: null,
      walletAlias: null,
      avatarUrl: null,
    }
    db.users.push(user)
    const session = createSession(user.id)
    mergeGuestCart(parsed.data.guestCartId, user.id)
    persist()
    return HttpResponse.json<AuthResponse>(
      { user: toUser(user), token: session.token, expiresAt: session.expiresAt },
      { status: 201 },
    )
  }),

  http.post(`${API_BASE}${endpoints.login}`, async ({ request }) => {
    const failure = await applyNetwork(request)
    if (failure) return failure

    const parsed = loginRequestSchema.safeParse(await request.json().catch(() => ({})))
    if (!parsed.success) {
      return errorResponse('validation_error', 'Revise os campos informados.', { fieldErrors: fieldErrors(parsed.error) })
    }
    const user = db.users.find((u) => u.email === parsed.data.email.toLowerCase())
    // Mesma resposta para e-mail desconhecido e senha errada: não revela quais e-mails existem.
    const valid = user && (await hashPassword(user.salt, parsed.data.password)) === user.passwordHash
    if (!user || !valid) return errorResponse('invalid_credentials', 'E-mail ou senha incorretos.')

    const session = createSession(user.id)
    // O carrinho do visitante é fundido na mesma resposta, sem passo extra que possa falhar no meio.
    mergeGuestCart(parsed.data.guestCartId, user.id)
    return HttpResponse.json<AuthResponse>({ user: toUser(user), token: session.token, expiresAt: session.expiresAt })
  }),

  http.get(`${API_BASE}${endpoints.session}`, async ({ request }) => {
    const failure = await applyNetwork(request)
    if (failure) return failure
    const auth = authenticate(request)
    if (isError(auth)) return auth
    return HttpResponse.json<Session>({ user: toUser(auth.user), expiresAt: auth.session.expiresAt })
  }),

  http.post(`${API_BASE}${endpoints.logout}`, async ({ request }) => {
    const failure = await applyNetwork(request)
    if (failure) return failure
    const token = (request.headers.get('Authorization') ?? '').replace('Bearer ', '')
    const session = db.sessions.find((s) => s.token === token)
    if (session) {
      session.expired = true
      persist()
    }
    return new HttpResponse(null, { status: 204 })
  }),
]
