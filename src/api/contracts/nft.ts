import { z } from 'zod'
import { collectionSchema, ethSchema, isoDateSchema, networkSchema, paginated } from './common'

export const editionKindSchema = z.enum(['unique', 'limited', 'open'])

/** Edição do NFT: 1/1, 1/10, 1/50 ou ABERTA (Figma 70342:2696). */
export const editionSchema = z.object({
  id: z.string(),
  label: z.string(),
  kind: editionKindSchema,
  /** Tiragem total; null em edição aberta. */
  supply: z.number().int().positive().nullable(),
  /** Unidades disponíveis agora; null quando ilimitada. */
  available: z.number().int().nonnegative().nullable(),
  /** Limite de unidades por pedido. */
  maxPerOrder: z.number().int().positive(),
  priceEth: ethSchema,
})
export type Edition = z.infer<typeof editionSchema>

export const nftImageSchema = z.object({
  url: z.string(),
  alt: z.string(),
})

export const nftSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  creator: z.string(),
  collection: collectionSchema,
  network: networkSchema,
  image: nftImageSchema,
  /** Menor preço entre as edições disponíveis. */
  priceEth: ethSchema,
  /** Preço de referência riscado no card, quando há. */
  compareAtEth: ethSchema.nullable(),
  soldOut: z.boolean(),
  createdAt: isoDateSchema,
  version: z.number().int().nonnegative(),
})
export type NftSummary = z.infer<typeof nftSummarySchema>

export const nftSchema = nftSummarySchema.extend({
  description: z.string(),
  gallery: z.array(nftImageSchema).min(1),
  editions: z.array(editionSchema).min(1),
  attributes: z.array(z.object({ name: z.string(), value: z.string() })),
})
export type Nft = z.infer<typeof nftSchema>

export const nftTabSchema = z.enum(['all', 'new', 'trending'])
export const nftSortSchema = z.enum(['recent', 'price_asc', 'price_desc', 'name_asc'])

/** Parâmetros da listagem. Também é o schema dos search params da rota Início. */
export const nftListQuerySchema = z.object({
  q: z.string().trim().max(80).optional(),
  tab: nftTabSchema.default('all'),
  collection: z.array(collectionSchema).default([]),
  network: z.array(networkSchema).default([]),
  minPrice: ethSchema.optional(),
  maxPrice: ethSchema.optional(),
  sort: nftSortSchema.default('recent'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(60).default(9),
})
export type NftListQuery = z.infer<typeof nftListQuerySchema>

export const facetSchema = z.object({ id: z.string(), label: z.string(), count: z.number().int() })

export const nftListResponseSchema = paginated(nftSummarySchema).extend({
  facets: z.object({
    collections: z.array(facetSchema),
    networks: z.array(facetSchema),
    priceRange: z.object({ min: ethSchema, max: ethSchema }),
  }),
})
export type NftListResponse = z.infer<typeof nftListResponseSchema>

export const featuredResponseSchema = z.object({
  hero: nftSummarySchema,
  spotlight: nftSummarySchema,
})
export type FeaturedResponse = z.infer<typeof featuredResponseSchema>

/** Lê arrays separados por vírgula da query string da API. */
export function parseNftListQuery(params: URLSearchParams): NftListQuery {
  const csv = (key: string) => params.get(key)?.split(',').filter(Boolean) ?? []
  return nftListQuerySchema.parse({
    q: params.get('q') ?? undefined,
    tab: params.get('tab') ?? undefined,
    collection: csv('collection'),
    network: csv('network'),
    minPrice: params.get('minPrice') ?? undefined,
    maxPrice: params.get('maxPrice') ?? undefined,
    sort: params.get('sort') ?? undefined,
    page: params.get('page') ?? undefined,
    pageSize: params.get('pageSize') ?? undefined,
  })
}
