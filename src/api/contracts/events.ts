import { z } from 'zod'
import { ethSchema, isoDateSchema } from './common'
import { orderStatusSchema } from './order'

/** Eventos Socket.IO (docs/decisoes/0002-contratos.md). */
export const SOCKET_EVENTS = {
  nftUpdated: 'nft.updated',
  orderUpdated: 'order.updated',
  subscribe: 'subscribe',
  unsubscribe: 'unsubscribe',
} as const

const envelope = <T extends string, R extends string, D extends z.ZodType>(
  type: T,
  resource: R,
  data: D,
) =>
  z.object({
    /** Estável: a reentrega do mesmo evento traz o mesmo id. */
    eventId: z.string(),
    type: z.literal(type),
    resource: z.object({ type: z.literal(resource), id: z.string() }),
    /** Versão do recurso após a mudança; só aplica se maior que a do cache. */
    version: z.number().int().nonnegative(),
    occurredAt: isoDateSchema,
    /** Dono do evento, quando privado. O cliente descarta se não for o usuário atual. */
    userId: z.string().optional(),
    data,
  })

export const nftUpdatedEventSchema = envelope(
  'nft.updated',
  'nft',
  z.object({
    priceEth: ethSchema,
    compareAtEth: ethSchema.nullable(),
    soldOut: z.boolean(),
    editions: z.array(
      z.object({
        editionId: z.string(),
        priceEth: ethSchema,
        available: z.number().int().nonnegative().nullable(),
      }),
    ),
  }),
)
export type NftUpdatedEvent = z.infer<typeof nftUpdatedEventSchema>

export const orderUpdatedEventSchema = envelope(
  'order.updated',
  'order',
  z.object({
    status: orderStatusSchema,
    txHash: z.string().nullable(),
    explorerUrl: z.string().nullable(),
    rejectionReason: z.string().nullable(),
  }),
)
export type OrderUpdatedEvent = z.infer<typeof orderUpdatedEventSchema>

export const subscribeRequestSchema = z.object({
  resources: z.array(z.object({ type: z.literal('nft'), id: z.string() })).max(50),
})
export type SubscribeRequest = z.infer<typeof subscribeRequestSchema>

export const subscribeAckSchema = z.object({ ok: z.boolean() })

export type ServerToClientEvents = {
  'nft.updated': (event: NftUpdatedEvent) => void
  'order.updated': (event: OrderUpdatedEvent) => void
}

export type ClientToServerEvents = {
  subscribe: (req: SubscribeRequest, ack: (res: z.infer<typeof subscribeAckSchema>) => void) => void
  unsubscribe: (req: SubscribeRequest, ack: (res: z.infer<typeof subscribeAckSchema>) => void) => void
}
