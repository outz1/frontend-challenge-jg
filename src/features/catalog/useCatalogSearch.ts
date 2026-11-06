import { getRouteApi } from '@tanstack/react-router'
import { compactSearch, withFilterChange, type CatalogSearch } from './search'

const route = getRouteApi('/')

/** Lê e escreve o estado do catálogo na URL. Filtro, busca, aba e ordem reiniciam a página (§3). */
export function useCatalogSearch() {
  const search = route.useSearch()
  const navigate = route.useNavigate()

  return {
    search,
    /** `replace` evita empilhar uma entrada de histórico por tecla digitada na busca. */
    update(change: Partial<CatalogSearch>, options?: { replace?: boolean }) {
      void navigate({ search: compactSearch(withFilterChange(search, change)), replace: options?.replace })
    },
    clearFilters() {
      void navigate({ search: compactSearch({ ...search, q: undefined, collection: [], network: [], minPrice: undefined, maxPrice: undefined, page: 1 }) })
    },
  }
}
