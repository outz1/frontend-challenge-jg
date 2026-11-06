import type { NftListQuery } from '@/api/contracts'

export const SORTS: { id: NftListQuery['sort']; label: string }[] = [
  { id: 'recent', label: 'Listados recentemente' },
  { id: 'price_asc', label: 'Menor preço' },
  { id: 'price_desc', label: 'Maior preço' },
  { id: 'name_asc', label: 'Nome (A-Z)' },
]
