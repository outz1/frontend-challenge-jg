import { useSyncExternalStore } from 'react'

/** Assina uma media query. Permite renderizar uma árvore só (mobile ou desktop) quando os frames diferem. */
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
