import { useSyncExternalStore } from 'react'

/** Breakpoints do Tailwind usados para escolher a composição: `md` (tablet e desktop) e `lg` (desktop largo). */
export const MD_UP = '(min-width: 768px)'
export const LG_UP = '(min-width: 1024px)'

/**
 * Assina uma media query. Permite renderizar uma árvore só (mobile ou desktop) quando os frames diferem:
 * a árvore escondida por CSS ainda baixaria imagens e executaria JS no viewport errado.
 * O app só roda no cliente (`createRoot`), então a primeira renderização já usa o valor real.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (notify) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', notify)
      return () => list.removeEventListener('change', notify)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}
