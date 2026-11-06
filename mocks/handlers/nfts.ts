import { http, HttpResponse } from 'msw'
import Big from 'big.js'
import {
  API_BASE,
  endpoints,
  parseNftListQuery,
  routePatterns,
  type Collection,
  type FeaturedResponse,
  type Network,
  type NftListQuery,
  type NftListResponse,
  type NftSummary,
} from '../../src/api/contracts'
import { db } from '../db'
import type { NftRecord } from '../fixtures/nfts'
import { applyNetwork, currentScenario, errorResponse } from '../network'

const COLLECTION_LABELS: Record<Collection, string> = {
  'arte-digital': 'Arte digital',
  fotografia: 'Fotografia',
  musica: 'Música',
  'arte-3d': 'Arte 3D',
  colecionaveis: 'Colecionáveis',
  generativa: 'Generativa',
  jogos: 'Jogos',
  assinaturas: 'Assinaturas',
  utilidade: 'Utilidade',
}
const NETWORK_LABELS: Record<Network, string> = { ethereum: 'Ethereum', polygon: 'Polygon', solana: 'Solana' }

/** A aba "Novos lançamentos" lista os NFTs mais recentes; "Em alta" usa a pontuação interna. */
const NEW_TAB_SIZE = 12
const TRENDING_TAB_SIZE = 12

const normalize = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

function toSummary(record: NftRecord): NftSummary {
  return {
    id: record.id,
    title: record.title,
    creator: record.creator,
    collection: record.collection,
    network: record.network,
    image: record.image,
    priceEth: record.priceEth,
    compareAtEth: record.compareAtEth,
    soldOut: record.soldOut,
    rare: record.rare,
    createdAt: record.createdAt,
    version: record.version,
  }
}

type Dimension = 'collection' | 'network'

/** Aplica os filtros da consulta; `skip` ignora uma dimensão para calcular as contagens das facetas. */
function filterNfts(source: NftRecord[], query: NftListQuery, skip?: Dimension): NftRecord[] {
  const needle = query.q ? normalize(query.q) : ''
  return source.filter((nft) => {
    if (needle && !normalize(`${nft.title} ${nft.creator}`).includes(needle)) return false
    if (skip !== 'collection' && query.collection.length > 0 && !query.collection.includes(nft.collection)) return false
    if (skip !== 'network' && query.network.length > 0 && !query.network.includes(nft.network)) return false
    if (query.minPrice && new Big(nft.priceEth).lt(query.minPrice)) return false
    if (query.maxPrice && new Big(nft.priceEth).gt(query.maxPrice)) return false
    return true
  })
}

function tabSource(tab: NftListQuery['tab']): NftRecord[] {
  const byRecent = [...db.nfts].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  if (tab === 'new') return byRecent.slice(0, NEW_TAB_SIZE)
  if (tab === 'trending') return [...db.nfts].sort((a, b) => b.trendingScore - a.trendingScore).slice(0, TRENDING_TAB_SIZE)
  return byRecent
}

function sortNfts(items: NftRecord[], sort: NftListQuery['sort']): NftRecord[] {
  const sorted = [...items]
  switch (sort) {
    case 'price_asc':
      return sorted.sort((a, b) => new Big(a.priceEth).cmp(b.priceEth) || a.id.localeCompare(b.id))
    case 'price_desc':
      return sorted.sort((a, b) => new Big(b.priceEth).cmp(a.priceEth) || a.id.localeCompare(b.id))
    case 'name_asc':
      return sorted.sort((a, b) => a.title.localeCompare(b.title, 'pt-BR') || a.id.localeCompare(b.id))
    default:
      return sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }
}

function priceRange(items: NftRecord[]) {
  if (items.length === 0) return { min: '0', max: '0' }
  const prices = items.map((nft) => new Big(nft.priceEth))
  const min = prices.reduce((a, b) => (b.lt(a) ? b : a))
  const max = prices.reduce((a, b) => (b.gt(a) ? b : a))
  return { min: min.toFixed(2), max: max.toFixed(2) }
}

function buildList(query: NftListQuery): NftListResponse {
  const base = tabSource(query.tab)
  const filtered = sortNfts(filterNfts(base, query), query.sort)
  const total = filtered.length
  const totalPages = Math.ceil(total / query.pageSize)
  // Página além do fim devolve lista vazia com o total real, para a UI se corrigir.
  const start = (query.page - 1) * query.pageSize
  const items = filtered.slice(start, start + query.pageSize).map(toSummary)

  const collectionPool = filterNfts(base, query, 'collection')
  const networkPool = filterNfts(base, query, 'network')

  return {
    items,
    page: query.page,
    pageSize: query.pageSize,
    total,
    totalPages,
    facets: {
      collections: (Object.keys(COLLECTION_LABELS) as Collection[]).map((id) => ({
        id,
        label: COLLECTION_LABELS[id],
        count: collectionPool.filter((nft) => nft.collection === id).length,
      })),
      networks: (Object.keys(NETWORK_LABELS) as Network[]).map((id) => ({
        id,
        label: NETWORK_LABELS[id],
        count: networkPool.filter((nft) => nft.network === id).length,
      })),
      priceRange: priceRange(db.nfts),
    },
  }
}

export const nftHandlers = [
  http.get(`${API_BASE}${endpoints.nfts}`, async ({ request }) => {
    const failure = await applyNetwork(request)
    if (failure) return failure

    const params = new URL(request.url).searchParams
    let query: NftListQuery
    try {
      query = parseNftListQuery(params)
    } catch {
      return errorResponse('validation_error', 'Parâmetros de listagem inválidos.')
    }

    if (currentScenario() === 'empty') {
      return HttpResponse.json<NftListResponse>({
        items: [],
        page: query.page,
        pageSize: query.pageSize,
        total: 0,
        totalPages: 0,
        facets: {
          collections: (Object.keys(COLLECTION_LABELS) as Collection[]).map((id) => ({ id, label: COLLECTION_LABELS[id], count: 0 })),
          networks: (Object.keys(NETWORK_LABELS) as Network[]).map((id) => ({ id, label: NETWORK_LABELS[id], count: 0 })),
          priceRange: { min: '0', max: '0' },
        },
      })
    }
    return HttpResponse.json(buildList(query))
  }),

  // Antes de `/nfts/:id`, senão "featured" seria lido como identificador.
  http.get(`${API_BASE}${endpoints.featured}`, async ({ request }) => {
    const failure = await applyNetwork(request)
    if (failure) return failure
    const [hero, spotlight] = [db.nfts[0], db.nfts[1]]
    return HttpResponse.json<FeaturedResponse>({ hero: toSummary(hero), spotlight: toSummary(spotlight) })
  }),

  http.get(`${API_BASE}${routePatterns.nft}`, async ({ request, params }) => {
    const failure = await applyNetwork(request)
    if (failure) return failure
    const record = db.nfts.find((item) => item.id === params.id)
    if (!record) return errorResponse('not_found', 'NFT não encontrado.')
    // `trendingScore` é interno do mock e não faz parte do contrato.
    const { trendingScore, ...publicNft } = record
    void trendingScore
    return HttpResponse.json(publicNft)
  }),
]
