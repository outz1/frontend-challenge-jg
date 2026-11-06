import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { http } from '../client'
import {
  endpoints,
  featuredResponseSchema,
  nftListResponseSchema,
  nftSchema,
  type NftListQuery,
} from '../contracts'

export const nftKeys = {
  all: ['nfts'] as const,
  lists: () => [...nftKeys.all, 'list'] as const,
  list: (query: NftListQuery) => [...nftKeys.lists(), query] as const,
  featured: () => [...nftKeys.all, 'featured'] as const,
  detail: (id: string) => [...nftKeys.all, 'detail', id] as const,
}

/** Arrays vão separados por vírgula e valores vazios ou padrão ficam de fora (contrato 0002). */
function toParams(query: NftListQuery) {
  return {
    q: query.q || undefined,
    tab: query.tab,
    collection: query.collection.length ? query.collection.join(',') : undefined,
    network: query.network.length ? query.network.join(',') : undefined,
    minPrice: query.minPrice,
    maxPrice: query.maxPrice,
    sort: query.sort,
    page: query.page,
    pageSize: query.pageSize,
  }
}

export const nftListOptions = (query: NftListQuery) =>
  queryOptions({
    queryKey: nftKeys.list(query),
    // `signal` cancela a requisição obsoleta quando a consulta muda (§4).
    queryFn: async ({ signal }) => {
      const { data } = await http.get(endpoints.nfts, { params: toParams(query), signal })
      return nftListResponseSchema.parse(data)
    },
    // Mantém a página anterior na tela enquanto a nova carrega, sem piscar skeleton.
    placeholderData: keepPreviousData,
  })

export const featuredOptions = () =>
  queryOptions({
    queryKey: nftKeys.featured(),
    queryFn: async ({ signal }) => {
      const { data } = await http.get(endpoints.featured, { signal })
      return featuredResponseSchema.parse(data)
    },
  })

export const nftDetailOptions = (id: string) =>
  queryOptions({
    queryKey: nftKeys.detail(id),
    queryFn: async ({ signal }) => {
      const { data } = await http.get(endpoints.nft(id), { signal })
      return nftSchema.parse(data)
    },
  })
