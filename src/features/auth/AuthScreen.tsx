import type { ReactNode } from 'react'
import { Link, useCanGoBack, useRouter } from '@tanstack/react-router'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { Hero } from '@/features/catalog/Hero'
import { safeRedirect } from '@/auth/guard'

type Props = { title: string; description: string; redirect?: string; children: ReactNode }

/**
 * Login e cadastro: modal sobre a página no desktop e tela cheia no mobile (Figma 9:115, 16:1022).
 * Fechar o modal volta ao fluxo anterior; sem histórico, vai ao Início.
 */
export function AuthScreen({ title, description, redirect, children }: Props) {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const router = useRouter()
  const canGoBack = useCanGoBack()

  function close() {
    const target = safeRedirect(redirect)
    if (canGoBack) router.history.back()
    else router.history.replace(target ?? '/')
  }

  if (!isDesktop) {
    return (
      <section aria-labelledby="auth-title" className="flex min-h-dvh flex-col gap-10 px-7 pt-20 pb-6">
        <div className="flex h-[136px] items-center justify-center">
          <Link to="/" aria-label="Kurio, página inicial" className="text-[32px] font-bold tracking-[0.1em] text-text-foreground">
            KURIO
          </Link>
        </div>
        <h1 id="auth-title" className="text-center text-[20px] leading-4 font-bold text-text-foreground">
          {title}
        </h1>
        <p className="sr-only">{description}</p>
        {children}
      </section>
    )
  }

  return (
    <>
      {/* Fundo: a página por trás do modal. O catálogo não entra aqui para a tela de login não disparar consultas. */}
      <div aria-hidden="true" inert>
        <Hero />
      </div>
      <Sheet open onOpenChange={(open) => !open && close()}>
        <SheetContent className="inset-0 m-auto h-fit max-h-[94dvh] w-[500px] max-w-[94vw] gap-8 rounded-[12px] bg-surface-card px-[80px] py-10">
          <p className="text-center text-[32px] leading-none font-bold tracking-[0.1em] text-text-foreground">KURIO</p>
          <SheetTitle className="text-center text-[20px] leading-4 font-bold text-text-foreground">{title}</SheetTitle>
          <SheetDescription className="sr-only">{description}</SheetDescription>
          {children}
          <button
            type="button"
            onClick={close}
            aria-label="Fechar"
            className="absolute top-4 right-4 grid size-8 place-items-center rounded-full text-[20px] text-text-secondary"
          >
            ×
          </button>
        </SheetContent>
      </Sheet>
    </>
  )
}
