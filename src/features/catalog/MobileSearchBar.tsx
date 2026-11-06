import { useEffect, useState } from 'react'
import filterIcon from '@/assets/icons/filter.svg'
import searchIcon from '@/assets/icons/search.svg'
import { Sheet, SheetContent, SheetClose, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { FiltersPanel } from './FiltersPanel'
import type { CatalogSearch } from './search'
import type { NftListResponse } from '@/api/contracts'

type Props = {
  search: CatalogSearch
  facets: NftListResponse['facets'] | undefined
  onChange: (change: Partial<CatalogSearch>, options?: { replace?: boolean }) => void
}

/** Barra de busca e botão de filtros do mobile e tablet (Figma 70395:239). */
export function MobileSearchBar({ search, facets, onChange }: Props) {
  const [text, setText] = useState(search.q ?? '')

  // Mantém o campo coerente com a URL (voltar no histórico, "limpar filtros"): ajuste durante a renderização.
  const [lastQ, setLastQ] = useState(search.q)
  if (search.q !== lastQ) {
    setLastQ(search.q)
    setText(search.q ?? '')
  }

  // Busca com debounce: grava na URL sem empilhar uma entrada de histórico por tecla.
  useEffect(() => {
    const value = text.trim()
    if (value === (search.q ?? '')) return
    const id = setTimeout(() => onChange({ q: value || undefined }, { replace: true }), 350)
    return () => clearTimeout(id)
  }, [text, search.q, onChange])

  return (
    <div className="flex items-center gap-2 lg:hidden">
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault()
          onChange({ q: text.trim() || undefined })
        }}
        className="flex h-[45px] min-w-0 flex-1 items-center gap-2 rounded-[10px] bg-surface-card px-3"
      >
        <img src={searchIcon} alt="" width={22} height={22} className="block shrink-0" />
        <label htmlFor="mobile-search" className="sr-only">
          Buscar NFTs ou criadores
        </label>
        <input
          id="mobile-search"
          type="search"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Explorar coleções"
          maxLength={80}
          className="min-w-0 flex-1 bg-transparent text-[14px] leading-4 font-bold text-text-foreground placeholder:text-brand-secondary focus-visible:outline-none"
        />
      </form>

      <Sheet>
        <SheetTrigger
          aria-label="Abrir filtros"
          className="grid size-[45px] shrink-0 place-items-center rounded-[14px] bg-[linear-gradient(137deg,rgba(210,138,76,0.45)_24.6%,#d28a4c_100%)]"
        >
          <img src={filterIcon} alt="" width={22} height={22} className="block" />
        </SheetTrigger>
        <SheetContent>
          <div className="flex items-center justify-between px-5 pt-5">
            <SheetTitle className="text-heading font-bold text-text-foreground">Filtros</SheetTitle>
            <SheetClose className="rounded-[6px] px-3 py-2 text-[16px] font-bold text-text-accent">Fechar</SheetClose>
          </div>
          <SheetDescription className="sr-only">Filtre o catálogo por coleção, preço e rede.</SheetDescription>
          <div className="p-5">
            <FiltersPanel search={search} facets={facets} onChange={onChange} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
