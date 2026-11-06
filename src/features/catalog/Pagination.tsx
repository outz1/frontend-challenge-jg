import { Link } from '@tanstack/react-router'
import pageArrow from '@/assets/icons/page-next.svg'
import { cn } from '@/lib/utils'
import { compactSearch, type CatalogSearch } from './search'

const BOX = 'grid size-[35px] place-items-center rounded-[4px] border border-line text-[18px] leading-4 text-text-foreground'

/** Números da paginação: todas as páginas até 7; acima disso, janela ao redor da atual com reticências. */
function pageItems(page: number, totalPages: number): (number | 'gap-start' | 'gap-end')[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
  const items: (number | 'gap-start' | 'gap-end')[] = [1]
  const from = Math.max(2, page - 1)
  const to = Math.min(totalPages - 1, page + 1)
  if (from > 2) items.push('gap-start')
  for (let n = from; n <= to; n++) items.push(n)
  if (to < totalPages - 1) items.push('gap-end')
  items.push(totalPages)
  return items
}

export function Pagination({ search, totalPages }: { search: CatalogSearch; totalPages: number }) {
  if (totalPages <= 1) return null
  const page = Math.min(search.page, totalPages)
  const to = (n: number) => compactSearch({ ...search, page: n })

  return (
    <nav aria-label="Paginação" className="flex justify-end">
      <ul className="flex items-center gap-2">
        {page > 1 && (
          <li>
            <Link to="/" search={to(page - 1)} aria-label="Página anterior" className={BOX}>
              <img src={pageArrow} alt="" width={12} height={7} className="rotate-90" />
            </Link>
          </li>
        )}
        {pageItems(page, totalPages).map((item) =>
          typeof item === 'string' ? (
            <li key={item} aria-hidden="true" className="grid size-[35px] place-items-center text-text-secondary">
              …
            </li>
          ) : (
            <li key={item}>
              <Link
                to="/"
                search={to(item)}
                aria-label={`Página ${item}`}
                aria-current={item === page ? 'page' : undefined}
                className={cn(BOX, item === page && 'border-brand bg-brand font-bold text-ink')}
              >
                {item}
              </Link>
            </li>
          ),
        )}
        {page < totalPages && (
          <li>
            <Link to="/" search={to(page + 1)} aria-label="Próxima página" className={BOX}>
              <img src={pageArrow} alt="" width={12} height={7} className="-rotate-90" />
            </Link>
          </li>
        )}
      </ul>
    </nav>
  )
}
