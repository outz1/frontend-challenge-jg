import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { Hero } from '@/features/catalog/Hero'
import { CatalogPage } from '@/features/catalog/CatalogPage'
import { Journal, Promos } from '@/features/catalog/HomeSections'
import { CATALOG_SEARCH_DEFAULTS, validateCatalogSearch } from '@/features/catalog/search'

export const Route = createFileRoute('/')({
  validateSearch: validateCatalogSearch,
  // Valores padrão não vão para a URL: `/` em vez de `/?tab=all&sort=recent&page=1`.
  search: { middlewares: [stripSearchParams(CATALOG_SEARCH_DEFAULTS)] },
  component: HomePage,
})

function HomePage() {
  return (
    <>
      <Hero />
      <CatalogPage />
      {/* Figma 2:2: 96 px entre o catálogo, as promoções e o diário, e 120 px até o rodapé. */}
      <div className="mt-24 flex flex-col gap-24 pb-14">
        <Promos />
        <Journal />
      </div>
    </>
  )
}
