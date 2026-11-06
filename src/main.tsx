import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import '@fontsource/roboto-mono/400.css'
import '@fontsource/roboto-mono/500.css'
import '@fontsource/roboto-mono/700.css'
import './styles/globals.css'
import { routeTree } from './routeTree.gen'
import { createQueryClient } from './api/queryClient'
import { dropPrivateCache, sessionKeys } from './api/queries/session'
import { onSessionLost } from './auth/events'
import { safeRedirect } from './auth/guard'

const queryClient = createQueryClient()

const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
})

/**
 * Sessão perdida (expirou ou foi invalidada): descarta o cache privado e leva ao login guardando o contexto
 * (`redirect`) para retomar de onde parou depois de entrar de novo (§3).
 */
onSessionLost((reason) => {
  queryClient.setQueryData(sessionKeys.current, null)
  dropPrivateCache(queryClient)
  const { pathname, href } = router.state.location
  if (pathname === '/login' || pathname === '/signup') return
  void router.navigate({
    to: '/login',
    search: { redirect: safeRedirect(href), reason: reason === 'expired' ? 'expired' : undefined },
    replace: true,
  })
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

/** Mocks só na camada de rede: o worker do MSW intercepta o fetch/XHR do Axios. */
async function enableMocking() {
  if (import.meta.env.VITE_ENABLE_MOCKS !== 'true') return
  const { worker, applyScenarioFromUrl } = await import('../mocks/browser')
  applyScenarioFromUrl()
  await worker.start({ onUnhandledRequest: 'bypass', quiet: true })
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  )
})
