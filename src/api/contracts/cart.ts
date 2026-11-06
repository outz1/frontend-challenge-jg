import { z } from 'zod'
import { ethSchema, isoDateSchema, quantitySchema } from './common'
import { nftImageSchema } from './nft'

export const cartItemSchema = z.object({
  id: z.string(),
  nftId: z.string(),
  editionId: z.string(),
  title: z.string(),
  editionLabel: z.string(),
  image: nftImageSchema,
  quantity: quantitySchema,
  /** Preço atual da edição; muda com nft.updated. */
  unitPriceEth: ethSchema,
  /** Unidades ainda disponíveis; null quando ilimitada. */
  available: z.number().int().nonnegative().nullable(),
  maxPerOrder: z.number().int().positive(),
})
export type CartItem = z.infer<typeof cartItemSchema>

export const cartSchema = z.object({
  items: z.array(cartItemSchema),
  couponCode: z.string().nullable(),
  version: z.number().int().nonnegative(),
  updatedAt: isoDateSchema,
})
export type Cart = z.infer<typeof cartSchema>

export const addCartItemRequestSchema = z.object({
  nftId: z.string(),
  editionId: z.string(),
  quantity: quantitySchema,
})
export type AddCartItemRequest = z.infer<typeof addCartItemRequestSchema>

export const updateCartItemRequestSchema = z.object({ quantity: quantitySchema })
export type UpdateCartItemRequest = z.infer<typeof updateCartItemRequestSchema>

export const couponRequestSchema = z.object({
  code: z.string().trim().min(1, 'Informe o cupom').max(32),
})
export type CouponRequest = z.infer<typeof couponRequestSchema>
