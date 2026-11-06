import { z } from 'zod'

/** ETH como string decimal, sem number/float (CLAUDE.md, invariantes). */
export const ethSchema = z.string().regex(/^\d+(\.\d{1,18})?$/, 'Valor em ETH inválido')
export type Eth = z.infer<typeof ethSchema>

export const isoDateSchema = z.iso.datetime()
export const quantitySchema = z.number().int().min(1)

export const networkSchema = z.enum(['ethereum', 'polygon', 'solana'])
export type Network = z.infer<typeof networkSchema>

export const collectionSchema = z.enum([
  'arte-digital',
  'fotografia',
  'musica',
  'arte-3d',
  'colecionaveis',
  'generativa',
  'jogos',
  'assinaturas',
  'utilidade',
])
export type Collection = z.infer<typeof collectionSchema>

export const errorCodeSchema = z.enum([
  'unauthenticated',
  'invalid_credentials',
  'session_expired',
  'forbidden',
  'not_found',
  'email_taken',
  'availability_conflict',
  'quote_stale',
  'idempotency_conflict',
  'wallet_kind_taken',
  'wallet_not_connected',
  'validation_error',
  'coupon_invalid',
  'coupon_expired',
  'wallet_rejected',
  'transient_error',
])
export type ErrorCode = z.infer<typeof errorCodeSchema>

export const apiErrorSchema = z.object({
  error: z.object({
    code: errorCodeSchema,
    message: z.string(),
    fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
    retryAfterMs: z.number().int().nonnegative().optional(),
    details: z.record(z.string(), z.unknown()).optional(),
  }),
})
export type ApiError = z.infer<typeof apiErrorSchema>

/** Status HTTP esperado para cada código de erro. */
export const errorStatus: Record<ErrorCode, number> = {
  unauthenticated: 401,
  invalid_credentials: 401,
  session_expired: 401,
  forbidden: 403,
  not_found: 404,
  email_taken: 409,
  availability_conflict: 409,
  quote_stale: 409,
  idempotency_conflict: 409,
  wallet_kind_taken: 409,
  wallet_not_connected: 409,
  validation_error: 422,
  coupon_invalid: 422,
  coupon_expired: 422,
  wallet_rejected: 422,
  transient_error: 503,
}

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(60).default(9),
})

export const paginated = <T extends z.ZodType>(item: T) =>
  z.object({
    items: z.array(item),
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  })

export const idParamSchema = z.object({ id: z.string().min(1) })
