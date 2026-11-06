import { createRootRouteWithContext, Link, Outlet, useRouterState } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { TabBar } from '@/components/layout/TabBar'

export type RouterContext = {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFound,
})

function RootLayout() {
  // Na tela de detalhe o mobile usa a buy bar no lugar da tab bar (Figma 15:5536).
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const showTabBar = !pathname.startsWith('/nft/')
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="pt-6 max-md:hidden">
        <Header />
      </div>
      <main id="conteudo" className={`flex-1 md:pb-0 ${showTabBar ? 'pb-[126px]' : ''}`}>
        <Outlet />
      </main>
      <div className="max-md:hidden">
        <Footer />
      </div>
      {showTabBar && <TabBar />}
    </div>
  )
}

function NotFound() {
  return (
    <section className="mx-auto flex max-w-page flex-col items-center gap-4 px-4 py-24 text-center">
      <p className="text-[14px] tracking-[0.1em] text-text-accent">ERRO 404</p>
      <h1 className="text-heading font-bold">Página não encontrada</h1>
      <p className="text-body text-text-secondary">O endereço acessado não existe ou foi movido.</p>
      <Link to="/" className="rounded-[6px] bg-brand px-7 py-[10px] text-[16px] font-bold text-ink">
        Voltar ao início
      </Link>
    </section>
  )
}
