import type { SearchSchemaInput } from '@tanstack/react-router'
import { z } from 'zod'
import {
  collectionSchema,
  ethSchema,
  networkSchema,
  nftSortSchema,
  nftTabSchema,
  type NftListQuery,
} from '@/api/contracts'

export const PAGE_SIZE = 9

/**
 * Search params da rota Início: busca, filtros, ordenação e página vivem na URL (§3).
 * `.catch` descarta valor inválido digitado na barra de endereço em vez de quebrar a rota.
 */
export const catalogSearchSchema = z.object({
  q: z.string().trim().max(80).optional().catch(undefined),
  tab: nftTabSchema.catch('all'),
  collection: z.array(collectionSchema).catch([]),
  network: z.array(networkSchema).catch([]),
  minPrice: ethSchema.optional().catch(undefined),
  maxPrice: ethSchema.optional().catch(undefined),
  sort: nftSortSchema.catch('recent'),
  page: z.coerce.number().int().min(1).catch(1),
})
export type CatalogSearch = z.infer<typeof catalogSearchSchema>
/** O que links e navegação podem informar: tudo opcional, o padrão é preenchido na validação. */
export type CatalogSearchInput = Partial<CatalogSearch>

/** Validador da rota. Função em vez do schema direto para os tipos de navegação aceitarem campos omitidos. */
export function validateCatalogSearch(raw: CatalogSearchInput & SearchSchemaInput): CatalogSearch {
  return catalogSearchSchema.parse(raw)
}

export const CATALOG_SEARCH_DEFAULTS: CatalogSearchInput = {
  tab: 'all',
  collection: [],
  network: [],
  sort: 'recent',
  page: 1,
}

export function toListQuery(search: CatalogSearch): NftListQuery {
  return { ...search, pageSize: PAGE_SIZE }
}

/** Tira o que é padrão para a URL ficar limpa (`/` em vez de `/?tab=all&page=1`). */
export function compactSearch(search: CatalogSearch) {
  return {
    q: search.q || undefined,
    tab: search.tab === 'all' ? undefined : search.tab,
    collection: search.collection.length ? search.collection : undefined,
    network: search.network.length ? search.network : undefined,
    minPrice: search.minPrice,
    maxPrice: search.maxPrice,
    sort: search.sort === 'recent' ? undefined : search.sort,
    page: search.page > 1 ? search.page : undefined,
  }
}

/** Qualquer mudança de filtro, busca, aba ou ordenação reinicia a paginação (§3). */
export function withFilterChange(search: CatalogSearch, change: Partial<CatalogSearch>): CatalogSearch {
  return { ...search, ...change, page: 1 }
}
