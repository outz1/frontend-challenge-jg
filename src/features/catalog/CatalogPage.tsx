import { useQuery } from '@tanstack/react-query'
import { nftListOptions } from '@/api/queries/nfts'
import { EmptyState, ErrorState, NftGrid, NftGridSkeleton } from './NftGrid'
import { FeaturedBanner } from './FeaturedBanner'
import { FiltersPanel } from './FiltersPanel'
import { MobileHero } from './MobileHero'
import { MobileSearchBar } from './MobileSearchBar'
import { Pagination } from './Pagination'
import { Toolbar } from './Toolbar'
import { PAGE_SIZE, toListQuery } from './search'
import { useCatalogSearch } from './useCatalogSearch'

export function CatalogPage() {
  const { search, update, clearFilters } = useCatalogSearch()
  const query = useQuery(nftListOptions(toListQuery(search)))
  const { data, isPending, isError, isPlaceholderData } = query

  const hasFilters =
    Boolean(search.q) || search.collection.length > 0 || search.network.length > 0 || Boolean(search.minPrice || search.maxPrice)

  return (
    <section
      id="catalogo"
      aria-labelledby="catalogo-titulo"
      className="mx-auto mt-4 grid w-full max-w-page gap-6 px-6 md:mt-8 md:px-4 lg:grid-cols-[310px_minmax(0,1fr)] lg:gap-x-12 min-[1240px]:px-0"
    >
      <h2 id="catalogo-titulo" className="sr-only">
        Catálogo de NFTs
      </h2>

      <aside aria-label="Filtros" className="hidden flex-col gap-6 lg:flex">
        <FiltersPanel search={search} facets={data?.facets} onChange={update} />
        <FeaturedBanner />
      </aside>

      <div className="flex min-w-0 flex-col gap-6 lg:gap-8">
        <MobileSearchBar search={search} facets={data?.facets} onChange={update} />
        <MobileHero />
        <Toolbar search={search} onSortChange={(sort) => update({ sort })} />

        {/* Região viva: leitores de tela ouvem o resultado de busca e filtros (§8). */}
        <p role="status" className="sr-only">
          {isPending ? 'Carregando NFTs' : data ? `${data.total} NFTs encontrados` : ''}
        </p>

        <div aria-busy={isPending || isPlaceholderData} className={isPlaceholderData ? 'opacity-60 transition-opacity' : undefined}>
          {isPending ? (
            <NftGridSkeleton count={PAGE_SIZE} />
          ) : isError ? (
            <ErrorState error={query.error} onRetry={() => void query.refetch()} />
          ) : data.items.length === 0 ? (
            <EmptyState filtered={hasFilters} onClear={clearFilters} />
          ) : (
            <NftGrid items={data.items} />
          )}
        </div>

        {data && data.totalPages > 1 && (
          <div className="lg:mt-12">
            <Pagination search={search} totalPages={data.totalPages} />
          </div>
        )}
      </div>
    </section>
  )
}
