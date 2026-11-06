import { z } from 'zod'
import { passwordSchema } from './auth'

/** Nome ENS sem o sufixo: o Figma fixa `.eth` num seletor ao lado do campo (9:1587). */
export const ENS_LABEL = /^[a-z0-9-]{3,63}$/i
export const USERNAME = /^[a-z0-9_]{3,20}$/i

/** Campos de "Perfil do colecionador" no Figma 9:1238. */
export const profileSchema = z.object({
  id: z.string(),
  /** "Nome de exibição". */
  name: z.string(),
  username: z.string(),
  email: z.email(),
  ensName: z.string().nullable(),
  /** "Apelido da carteira". */
  walletAlias: z.string().nullable(),
  avatarUrl: z.string().nullable(),
})
export type Profile = z.infer<typeof profileSchema>

/** Nome de exibição, usuário, e-mail e apelido são obrigatórios; o ENS é opcional (decisão 0007). */
export const updateProfileRequestSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome de exibição').max(60, 'Máximo de 60 caracteres'),
  username: z.string().trim().regex(USERNAME, 'Use de 3 a 20 letras, números ou _'),
  email: z.email('E-mail inválido'),
  ensName: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? null : v),
    z.string().trim().regex(ENS_LABEL, 'Use de 3 a 63 letras, números ou -').nullable(),
  ),
  walletAlias: z.string().trim().min(2, 'Informe o apelido da carteira').max(40, 'Máximo de 40 caracteres'),
})
export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>

export const changePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1, 'Informe a senha atual'),
  newPassword: passwordSchema,
})
export type ChangePasswordRequest = z.infer<typeof changePasswordRequestSchema>

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024
export const AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const
