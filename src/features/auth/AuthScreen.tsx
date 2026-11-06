import type { ReactNode } from 'react'
import { Link, useCanGoBack, useRouter } from '@tanstack/react-router'
import closeIcon from '@/assets/icons/order-close.svg'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { Hero } from '@/features/catalog/Hero'
import { safeRedirect } from '@/auth/guard'
import { cn } from '@/lib/utils'

type Props = {
  mode: 'login' | 'signup'
  title: string
  description: string
  redirect?: string
  children: ReactNode
}

const TAB = 'text-[20px] leading-4 font-medium'

/**
 * Login e cadastro: modal sobre a página no desktop e tela cheia no mobile (Figma 9:115, 9:1022, 16:1022, 16:1228).
 * No desktop, as abas "Entrar | Criar conta" trocam de tela sem perder o retorno ao fluxo; fechar volta ao
 * fluxo anterior, ou ao Início quando não há histórico.
 */
export function AuthScreen({ mode, title, description, redirect, children }: Props) {
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
      {/* Fundo: a página por trás do modal. O catálogo não entra aqui: ele depende dos parâmetros da rota `/`. */}
      <div aria-hidden="true" inert>
        <Hero />
      </div>
      <Sheet open onOpenChange={(open) => !open && close()}>
        <SheetContent className={cn('inset-0 m-auto h-fit max-h-[94dvh] w-[500px] max-w-[94vw] gap-0 overflow-hidden rounded-[8px] bg-surface-card p-0 pb-[34px]', mode === 'login' ? 'min-h-[600px]' : 'min-h-[656px]')}>
          <SheetTitle className="sr-only">{title}</SheetTitle>
          <div className="flex flex-col items-center gap-10 px-12 pt-[49px]">
            <nav aria-label="Entrar ou criar conta" className="flex items-center gap-2">
              <Link to="/login" search={{ redirect }} replace aria-current={mode === 'login' ? 'page' : undefined} className={cn(TAB, mode === 'login' ? 'text-text-accent' : 'text-text-foreground')}>
                Entrar
              </Link>
              <span aria-hidden="true" className="h-4 w-px bg-coral" />
              <Link to="/signup" search={{ redirect }} replace aria-current={mode === 'signup' ? 'page' : undefined} className={cn(TAB, mode === 'signup' ? 'text-text-accent' : 'text-text-foreground')}>
                Criar conta
              </Link>
            </nav>
            <SheetDescription className="mt-[3px] w-full text-center text-[13px] leading-4 text-text-foreground">{description}</SheetDescription>
          </div>
          {children}
          <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[10px] bg-brand" />
          <button type="button" onClick={close} aria-label="Fechar" className="absolute top-[11px] right-3 grid size-[18px] place-items-center before:absolute before:-inset-3 before:content-['']">
            <img src={closeIcon} alt="" width={18} height={17} className="block" />
          </button>
        </SheetContent>
      </Sheet>
    </>
  )
}
