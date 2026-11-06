import { z } from 'zod'
import { ethSchema, isoDateSchema, networkSchema, paginated, quantitySchema } from './common'
import { walletProviderSchema } from './wallet'

export const orderStatusSchema = z.enum(['pending', 'confirmed', 'rejected'])
export type OrderStatus = z.infer<typeof orderStatusSchema>

/** Confirmado e recusado são terminais. */
export const isTerminalOrderStatus = (status: OrderStatus) => status !== 'pending'

/** Endereço 0x ou nome ENS (`nome.eth`) para a carteira de entrega alternativa. */
const ENS_NAME = /^[a-z0-9-]{3,63}\.eth$/i
const EVM_ADDRESS = /^0x[a-fA-F0-9]{40}$/
export const secondaryWalletValid = (value: string) => EVM_ADDRESS.test(value) || ENS_NAME.test(value)

const optionalText = (schema: z.ZodString) =>
  z.preprocess((v) => (typeof v === 'string' && v.trim() === '' ? undefined : v), schema.optional())

/** Campos do formulário de Pagamento (Figma 11:2862, "Perfil do colecionador"). */
export const collectorSchema = z.object({
  displayName: z.string().trim().min(2, 'Informe o nome de exibição').max(60),
  username: z
    .string()
    .trim()
    .regex(/^[a-z0-9_]{3,20}$/i, 'Use de 3 a 20 letras, números ou _'),
  profileName: z.string().trim().min(2, 'Informe o nome do perfil').max(60),
  email: z.email('E-mail inválido'),
  referralCode: optionalText(z.string().trim().regex(/^[A-Z0-9-]{4,16}$/i, 'Código inválido (4 a 16 letras, números ou -)')),
  /** Endereço 0x ou nome `.eth`; preenchido só quando o colecionador escolhe "Usar outra carteira?". */
  secondaryWallet: optionalText(z.string().trim().refine(secondaryWalletValid, 'Informe um endereço 0x ou um nome .eth')),
  note: optionalText(z.string().trim().max(280, 'Máximo de 280 caracteres')),
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
  /** `#0042`, como no recibo do Figma ("ID do token"). */
  tokenId: z.string(),
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
  /** Carteira com a qual a compra foi feita ("Carteira: MetaMask" no recibo). */
  walletProvider: walletProviderSchema,
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
