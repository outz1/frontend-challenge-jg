import { lazy, Suspense } from 'react'
import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { Hero } from '@/features/catalog/Hero'
import { CatalogPage } from '@/features/catalog/CatalogPage'
import { CATALOG_SEARCH_DEFAULTS, validateCatalogSearch } from '@/features/catalog/search'
import { LG_UP, MD_UP, useMediaQuery } from '@/hooks/useMediaQuery'

export const Route = createFileRoute('/')({
  validateSearch: validateCatalogSearch,
  // Valores padrão não vão para a URL: `/` em vez de `/?tab=all&sort=recent&page=1`.
  search: { middlewares: [stripSearchParams(CATALOG_SEARCH_DEFAULTS)] },
  component: HomePage,
})

/** Promoções e diário só existem no desktop (abaixo da dobra): o chunk nem é pedido no mobile. */
const DesktopSections = lazy(() => import('@/features/catalog/HomeSections').then((m) => ({ default: m.DesktopSections })))

function HomePage() {
  // Só a composição do viewport atual é montada: no mobile o hero, as promoções e o diário do desktop
  // não baixam imagens nem executam JS (o banner compacto do mobile fica no `CatalogPage`).
  const md = useMediaQuery(MD_UP)
  const lg = useMediaQuery(LG_UP)
  return (
    <>
      {md && <Hero />}
      <CatalogPage />
      {/* Figma 2:2: 96 px entre o catálogo, as promoções e o diário, e 120 px até o rodapé. */}
      <div className="mt-24 flex flex-col gap-24 pb-14">
        {lg && (
          <Suspense fallback={null}>
            <DesktopSections />
          </Suspense>
        )}
      </div>
    </>
  )
}
