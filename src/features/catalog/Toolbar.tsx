import { lazy, Suspense, useId } from 'react'
import { Link } from '@tanstack/react-router'
import type { NftListQuery } from '@/api/contracts'
import { MD_UP, useMediaQuery } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'
import { compactSearch, withFilterChange, type CatalogSearch } from './search'
import { SORTS } from './sorts'

const SortSelect = lazy(() => import('./SortSelect').then((m) => ({ default: m.SortSelect })))

const TABS: { id: NftListQuery['tab']; label: string }[] = [
  { id: 'all', label: 'Todos os NFTs' },
  { id: 'new', label: 'Novos lançamentos' },
  { id: 'trending', label: 'Em alta' },
]

export function Toolbar({
  search,
  onSortChange,
}: {
  search: CatalogSearch
  onSortChange: (sort: NftListQuery['sort']) => void
}) {
  const labelId = useId()
  // A ordenação não existe no frame mobile: o Select (Radix) só é montado, e baixado, a partir de `md`.
  const md = useMediaQuery(MD_UP)
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
      <nav aria-label="Seções do catálogo">
        <ul className="flex flex-wrap gap-x-3 gap-y-2 text-[14px] leading-4 whitespace-nowrap md:gap-5 md:text-[15px]">
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

      {md && (
        <div className="hidden w-[320px] items-center md:flex">
          <span id={labelId} className="w-[110px] text-[15px] leading-[18px] whitespace-nowrap text-text-foreground">
            Ordenar por:
          </span>
          {/* Enquanto o chunk chega, o mesmo texto na mesma caixa: sem layout shift. */}
          <Suspense
            fallback={
              <span className="block w-[210px] text-[15px] leading-[18px] whitespace-nowrap text-text-foreground">
                {SORTS.find((sort) => sort.id === search.sort)?.label}
              </span>
            }
          >
            <SortSelect labelId={labelId} value={search.sort} onChange={onSortChange} />
          </Suspense>
        </div>
      )}
    </div>
  )
}
