import { useState } from 'react'
import type { Collection, Network, NftListResponse } from '@/api/contracts'
import { Skeleton } from '@/components/ui/skeleton'
import { Slider } from '@/components/ui/slider'
import { centsToEth, ethToCents, formatEthRange } from '@/lib/eth'
import { cn } from '@/lib/utils'
import type { CatalogSearch } from './search'

type Facets = NftListResponse['facets']

type Props = {
  search: CatalogSearch
  facets: Facets | undefined
  onChange: (change: Partial<CatalogSearch>) => void
}

const HEADING = 'text-[18px] leading-4 font-bold text-text-foreground'

/** Sidebar de filtros (Figma 70485:382). Também é o conteúdo do drawer no mobile. */
export function FiltersPanel({ search, facets, onChange }: Props) {
  return (
    <div className="flex w-full flex-col gap-10 bg-surface-card p-5">
      <FacetList
        title="Coleções"
        facets={facets?.collections}
        selected={search.collection}
        onToggle={(id) => onChange({ collection: toggle(search.collection, id as Collection) })}
        rows={9}
        highlightSelected
      />
      {facets ? (
        <PriceFilter
          // Remonta ao mudar a URL (ex.: botão voltar) para o slider refletir o valor aplicado.
          key={`${search.minPrice ?? ''}-${search.maxPrice ?? ''}-${facets.priceRange.min}-${facets.priceRange.max}`}
          range={facets.priceRange}
          minPrice={search.minPrice}
          maxPrice={search.maxPrice}
          onApply={(minPrice, maxPrice) => onChange({ minPrice, maxPrice })}
        />
      ) : (
        <PriceSkeleton />
      )}
      <FacetList
        title="Rede"
        facets={facets?.networks}
        selected={search.network}
        onToggle={(id) => onChange({ network: toggle(search.network, id as Network) })}
        rows={3}
      />
    </div>
  )
}

function toggle<T extends string>(list: T[], id: T): T[] {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id]
}

function FacetList({
  title,
  facets,
  selected,
  onToggle,
  rows,
  highlightSelected,
}: {
  title: string
  facets: Facets['collections'] | undefined
  selected: string[]
  onToggle: (id: string) => void
  rows: number
  highlightSelected?: boolean
}) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-3">
      <legend className={cn(HEADING, 'mb-3')}>{title}</legend>
      <ul className="flex flex-col px-3">
        {facets
          ? facets.map((facet) => {
              const checked = selected.includes(facet.id)
              return (
                <li key={facet.id}>
                  <label
                    className={cn(
                      'flex h-10 cursor-pointer items-center justify-between text-[15px] text-text-secondary has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-text-accent',
                      checked && 'text-text-accent',
                    )}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      onChange={() => onToggle(facet.id)}
                    />
                    {/* Selecionado: cor de destaque + sublinhado, para o estado não depender só de cor (§8). */}
                    <span className={cn(checked && 'underline underline-offset-4')}>{facet.label}</span>
                    <span className={cn(highlightSelected && 'font-bold')}>
                      <span className="sr-only">, </span>({facet.count})
                    </span>
                  </label>
                </li>
              )
            })
          : Array.from({ length: rows }, (_, i) => (
              <li key={i} className="flex h-10 items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-8" />
              </li>
            ))}
      </ul>
    </fieldset>
  )
}

function PriceFilter({
  range,
  minPrice,
  maxPrice,
  onApply,
}: {
  range: Facets['priceRange']
  minPrice: string | undefined
  maxPrice: string | undefined
  onApply: (minPrice: string | undefined, maxPrice: string | undefined) => void
}) {
  const lo = ethToCents(range.min)
  const hi = ethToCents(range.max)
  const [[from, to], setValue] = useState<[number, number]>([
    minPrice ? ethToCents(minPrice) : lo,
    maxPrice ? ethToCents(maxPrice) : hi,
  ])

  return (
    <fieldset className="flex min-w-0 flex-col gap-3">
      <legend className={cn(HEADING, 'mb-3')}>Faixa de preço</legend>
      <div className="flex flex-col gap-3 pl-3">
        <Slider
          min={lo}
          max={hi}
          step={1}
          minStepsBetweenThumbs={0}
          value={[from, to]}
          onValueChange={(next) => setValue([next[0], next[1]])}
          thumbLabels={['Preço mínimo em ETH', 'Preço máximo em ETH']}
        />
        <p className="text-[15px] text-text-foreground" aria-live="polite">
          {formatEthRange(centsToEth(from), centsToEth(to))}
        </p>
        <button
          type="button"
          onClick={() =>
            onApply(from === lo ? undefined : centsToEth(from), to === hi ? undefined : centsToEth(to))
          }
          className="w-fit rounded-[6px] bg-brand px-3 py-2 text-[16px] leading-5 font-bold text-ink"
        >
          Aplicar
        </button>
      </div>
    </fieldset>
  )
}

function PriceSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-4 w-36" />
      <div className="flex flex-col gap-3 pl-3">
        <Skeleton className="h-[15px] w-full" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-9 w-[75px]" />
      </div>
    </div>
  )
}
