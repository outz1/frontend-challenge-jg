import { z } from 'zod'
import { ethSchema, isoDateSchema, networkSchema, quantitySchema } from './common'

export const quoteIssueSchema = z.object({
  kind: z.enum(['price_changed', 'unavailable', 'quantity_reduced', 'coupon_invalid']),
  itemId: z.string().optional(),
  message: z.string(),
})

export const quoteLineSchema = z.object({
  itemId: z.string(),
  nftId: z.string(),
  editionId: z.string(),
  title: z.string(),
  editionLabel: z.string(),
  quantity: quantitySchema,
  unitPriceEth: ethSchema,
  lineTotalEth: ethSchema,
})

/** Cotação autoritativa: o cliente nunca calcula totais para fechar pedido. */
export const quoteSchema = z.object({
  id: z.string(),
  network: networkSchema,
  cartVersion: z.number().int().nonnegative(),
  lines: z.array(quoteLineSchema),
  subtotalEth: ethSchema,
  discountEth: ethSchema,
  networkFeeEth: ethSchema,
  totalEth: ethSchema,
  coupon: z.object({ code: z.string(), discountEth: ethSchema }).nullable(),
  issues: z.array(quoteIssueSchema),
  createdAt: isoDateSchema,
  expiresAt: isoDateSchema,
})
export type Quote = z.infer<typeof quoteSchema>

export const quoteRequestSchema = z.object({ network: networkSchema })
export type QuoteRequest = z.infer<typeof quoteRequestSchema>
