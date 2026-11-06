import { z } from 'zod'
import { isoDateSchema } from './common'

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  avatarUrl: z.string().nullable(),
})
export type User = z.infer<typeof userSchema>

const passwordSchema = z.string().min(8, 'Mínimo de 8 caracteres')

export const signupRequestSchema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome'),
  email: z.email('E-mail inválido'),
  password: passwordSchema,
  guestCartId: z.uuid().optional(),
})
export type SignupRequest = z.infer<typeof signupRequestSchema>

export const loginRequestSchema = z.object({
  email: z.email('E-mail inválido'),
  password: z.string().min(1, 'Informe a senha'),
  guestCartId: z.uuid().optional(),
})
export type LoginRequest = z.infer<typeof loginRequestSchema>

export const sessionSchema = z.object({
  user: userSchema,
  expiresAt: isoDateSchema,
})
export type Session = z.infer<typeof sessionSchema>

export const authResponseSchema = sessionSchema.extend({
  token: z.string(),
})
export type AuthResponse = z.infer<typeof authResponseSchema>

export { passwordSchema }
