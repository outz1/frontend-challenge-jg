import { http, HttpResponse } from 'msw'
import {
  API_BASE,
  AVATAR_MAX_BYTES,
  AVATAR_TYPES,
  changePasswordRequestSchema,
  endpoints,
  updateProfileRequestSchema,
  type Profile,
} from '../../src/api/contracts'
import { authenticate, hashPassword, isError, newSalt } from '../auth'
import { db, persist } from '../db'
import type { UserRecord } from '../fixtures/users'
import { applyNetwork, errorResponse } from '../network'

const toProfile = (u: UserRecord): Profile => ({
  id: u.id,
  name: u.name,
  username: u.username,
  email: u.email,
  ensName: u.ensName,
  walletAlias: u.walletAlias,
  avatarUrl: u.avatarUrl,
})

function validation(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  const fieldErrors: Record<string, string[]> = {}
  for (const issue of error.issues) (fieldErrors[String(issue.path[0] ?? 'form')] ??= []).push(issue.message)
  return errorResponse('validation_error', 'Revise os campos informados.', { fieldErrors })
}

function toBase64(bytes: Uint8Array) {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(binary)
}

export const profileHandlers = [
  http.get(`${API_BASE}${endpoints.profile}`, async ({ request }) => {
    const failure = await applyNetwork(request)
    if (failure) return failure
    const auth = authenticate(request)
    if (isError(auth)) return auth
    return HttpResponse.json(toProfile(auth.user))
  }),

  http.patch(`${API_BASE}${endpoints.profile}`, async ({ request }) => {
    const failure = await applyNetwork(request)
    if (failure) return failure
    const auth = authenticate(request)
    if (isError(auth)) return auth
    const parsed = updateProfileRequestSchema.safeParse(await request.json().catch(() => ({})))
    if (!parsed.success) return validation(parsed.error)

    const email = parsed.data.email.toLowerCase()
    if (db.users.some((u) => u.email === email && u.id !== auth.user.id)) {
      return errorResponse('email_taken', 'Este e-mail já está em uso.', { fieldErrors: { email: ['Este e-mail já está em uso.'] } })
    }
    const username = parsed.data.username.toLowerCase()
    if (db.users.some((u) => u.username.toLowerCase() === username && u.id !== auth.user.id)) {
      return errorResponse('validation_error', 'Este nome de usuário já está em uso.', {
        fieldErrors: { username: ['Este nome de usuário já está em uso.'] },
      })
    }
    auth.user.name = parsed.data.name
    auth.user.username = parsed.data.username
    auth.user.email = email
    auth.user.ensName = parsed.data.ensName
    auth.user.walletAlias = parsed.data.walletAlias
    persist()
    return HttpResponse.json(toProfile(auth.user))
  }),

  http.put(`${API_BASE}${endpoints.profileAvatar}`, async ({ request }) => {
    const failure = await applyNetwork(request)
    if (failure) return failure
    const auth = authenticate(request)
    if (isError(auth)) return auth
    const form = await request.formData().catch(() => null)
    const file = form?.get('file')
    if (!(file instanceof File)) {
      return errorResponse('validation_error', 'Envie uma imagem.', { fieldErrors: { file: ['Selecione uma imagem'] } })
    }
    if (!(AVATAR_TYPES as readonly string[]).includes(file.type)) {
      return errorResponse('validation_error', 'Formato inválido.', { fieldErrors: { file: ['Use PNG, JPEG ou WebP'] } })
    }
    if (file.size > AVATAR_MAX_BYTES) {
      return errorResponse('validation_error', 'Arquivo grande demais.', { fieldErrors: { file: ['O arquivo deve ter até 2 MB'] } })
    }
    // O mock guarda o arquivo como data URL no estado persistido (decisão 0002).
    auth.user.avatarUrl = `data:${file.type};base64,${toBase64(new Uint8Array(await file.arrayBuffer()))}`
    persist()
    return HttpResponse.json(toProfile(auth.user))
  }),

  http.delete(`${API_BASE}${endpoints.profileAvatar}`, async ({ request }) => {
    const failure = await applyNetwork(request)
    if (failure) return failure
    const auth = authenticate(request)
    if (isError(auth)) return auth
    auth.user.avatarUrl = null
    persist()
    return HttpResponse.json(toProfile(auth.user))
  }),

  http.put(`${API_BASE}${endpoints.profilePassword}`, async ({ request }) => {
    const failure = await applyNetwork(request)
    if (failure) return failure
    const auth = authenticate(request)
    if (isError(auth)) return auth
    const parsed = changePasswordRequestSchema.safeParse(await request.json().catch(() => ({})))
    if (!parsed.success) return validation(parsed.error)

    const currentOk = (await hashPassword(auth.user.salt, parsed.data.currentPassword)) === auth.user.passwordHash
    if (!currentOk) {
      return errorResponse('validation_error', 'Senha atual incorreta.', { fieldErrors: { currentPassword: ['Senha atual incorreta'] } })
    }
    if (parsed.data.newPassword === parsed.data.currentPassword) {
      return errorResponse('validation_error', 'A nova senha deve ser diferente.', {
        fieldErrors: { newPassword: ['A nova senha deve ser diferente da atual'] },
      })
    }
    auth.user.salt = newSalt()
    auth.user.passwordHash = await hashPassword(auth.user.salt, parsed.data.newPassword)
    persist()
    return new HttpResponse(null, { status: 204 })
  }),
]
