import { z } from 'zod'
import { ethSchema, isoDateSchema, networkSchema, paginated, quantitySchema } from './common'

export const orderStatusSchema = z.enum(['pending', 'confirmed', 'rejected'])
export type OrderStatus = z.infer<typeof orderStatusSchema>

/** Confirmado e recusado são terminais. */
export const isTerminalOrderStatus = (status: OrderStatus) => status !== 'pending'

/** Campos do formulário de Pagamento (a refinar com o frame 11:2862). */
export const collectorSchema = z.object({
  fullName: z.string().trim().min(2, 'Informe o nome completo'),
  email: z.email('E-mail inválido'),
})
export type Collector = z.infer<typeof collectorSchema>

export const createOrderRequestSchema = z.object({
  quoteId: z.string(),
  walletId: z.string(),
  network: networkSchema,
  collector: collectorSchema,
})
export type CreateOrderRequest = z.infer<typeof createOrderRequestSchema>

export const idempotencyKeySchema = z.string().min(8).max(128)
export const IDEMPOTENCY_HEADER = 'Idempotency-Key'
export const IDEMPOTENT_REPLAY_HEADER = 'Idempotent-Replayed'

export const orderLineSchema = z.object({
  nftId: z.string(),
  title: z.string(),
  editionLabel: z.string(),
  imageUrl: z.string(),
  quantity: quantitySchema,
  unitPriceEth: ethSchema,
  lineTotalEth: ethSchema,
})

/** O pedido confirmado é o recibo: snapshot imutável de linhas e valores. */
export const orderSchema = z.object({
  id: z.string(),
  status: orderStatusSchema,
  version: z.number().int().nonnegative(),
  network: networkSchema,
  walletAddress: z.string(),
  lines: z.array(orderLineSchema),
  subtotalEth: ethSchema,
  discountEth: ethSchema,
  networkFeeEth: ethSchema,
  totalEth: ethSchema,
  couponCode: z.string().nullable(),
  collector: collectorSchema,
  txHash: z.string().nullable(),
  explorerUrl: z.string().nullable(),
  rejectionReason: z.string().nullable(),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
  settledAt: isoDateSchema.nullable(),
})
export type Order = z.infer<typeof orderSchema>

export const orderListResponseSchema = paginated(orderSchema)
export type OrderListResponse = z.infer<typeof orderListResponseSchema>
