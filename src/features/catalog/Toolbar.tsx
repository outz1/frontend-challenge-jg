import { useId } from 'react'
import { Link } from '@tanstack/react-router'
import type { NftListQuery } from '@/api/contracts'
import { Select, SelectContent, SelectItem, SelectValue, SelectTrigger } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { compactSearch, withFilterChange, type CatalogSearch } from './search'

const TABS: { id: NftListQuery['tab']; label: string }[] = [
  { id: 'all', label: 'Todos os NFTs' },
  { id: 'new', label: 'Novos lançamentos' },
  { id: 'trending', label: 'Em alta' },
]

const SORTS: { id: NftListQuery['sort']; label: string }[] = [
  { id: 'recent', label: 'Listados recentemente' },
  { id: 'price_asc', label: 'Menor preço' },
  { id: 'price_desc', label: 'Maior preço' },
  { id: 'name_asc', label: 'Nome (A-Z)' },
]

export function Toolbar({
  search,
  onSortChange,
}: {
  search: CatalogSearch
  onSortChange: (sort: NftListQuery['sort']) => void
}) {
  const labelId = useId()
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
      <nav aria-label="Seções do catálogo">
        <ul className="flex gap-4 text-[14px] leading-4 whitespace-nowrap md:gap-5 md:text-[15px]">
          {TABS.map((tab) => {
            const active = search.tab === tab.id
            return (
              <li key={tab.id}>
                <Link
                  to="/"
                  search={compactSearch(withFilterChange(search, { tab: tab.id }))}
                  aria-current={active ? 'true' : undefined}
                  className={cn(
                    'block pb-1 font-normal text-text-foreground md:font-medium',
                    active && 'border-b-2 border-brand font-bold text-text-accent',
                  )}
                >
                  {tab.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="hidden w-[320px] items-center md:flex">
        <span id={labelId} className="w-[110px] text-[15px] leading-[18px] whitespace-nowrap text-text-foreground">
          Ordenar por:
        </span>
        <Select value={search.sort} onValueChange={(value) => onSortChange(value as NftListQuery['sort'])}>
          <SelectTrigger aria-labelledby={labelId} className="w-[210px] justify-between whitespace-nowrap [&>span:first-child]:text-left">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORTS.map((sort) => (
              <SelectItem key={sort.id} value={sort.id}>
                {sort.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
