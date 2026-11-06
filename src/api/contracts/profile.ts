import { z } from 'zod'
import { passwordSchema } from './auth'

export const profileSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  avatarUrl: z.string().nullable(),
})
export type Profile = z.infer<typeof profileSchema>

/** Campos do formulário de perfil (a refinar com o frame 9:1238). */
export const updateProfileRequestSchema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome').optional(),
  email: z.email('E-mail inválido').optional(),
})
export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>

export const changePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1, 'Informe a senha atual'),
  newPassword: passwordSchema,
})
export type ChangePasswordRequest = z.infer<typeof changePasswordRequestSchema>

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024
export const AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const
