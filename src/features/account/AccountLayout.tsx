import { useState, type ReactNode } from 'react'
import { Link, useRouter, useRouterState } from '@tanstack/react-router'
import { useLogout } from '@/api/queries/session'
import activityIcon from '@/assets/icons/account-activity.svg'
import downloadIcon from '@/assets/icons/account-download.svg'
import heartIcon from '@/assets/icons/account-heart.svg'
import locationIcon from '@/assets/icons/account-location.svg'
import logoutIcon from '@/assets/icons/account-logout.svg'
import shoppingIcon from '@/assets/icons/account-shopping.svg'
import supportIcon from '@/assets/icons/account-support.svg'
import userIcon from '@/assets/icons/account-user.svg'
import backArrow from '@/assets/icons/m-back-arrow.svg'
import { cn } from '@/lib/utils'

const ROW = 'flex w-full items-center px-4 text-left text-[15px] leading-[45px] text-text-accent'

/** Itens fora do escopo (§3): visíveis como no Figma, sem fingir uma ação concluída. */
const OUT_OF_SCOPE = [
  { label: 'Atividade', icon: shoppingIcon, size: 18 },
  { label: 'Lista de interesse', icon: heartIcon, size: 16 },
  { label: 'Ofertas', icon: activityIcon, size: 18 },
  { label: 'Arquivos baixados', icon: downloadIcon, size: 18 },
  { label: 'Suporte', icon: supportIcon, size: 18 },
]

/**
 * Casca das telas de conta (Figma 70420:4536 e 70386:239/70390:239). No desktop, sidebar de 310 px e formulário;
 * no mobile não há frame (§3): cabeçalho com voltar, abas das duas telas disponíveis e o formulário em coluna.
 */
export function AccountLayout({ title, showTitleOnDesktop = true, children }: { title: string; /** O frame de Carteiras (9:1670) começa direto na seção; o título segue no DOM para leitores de tela. */ showTitleOnDesktop?: boolean; children: ReactNode }) {
  return (
    <section aria-labelledby="account-title" className="mx-auto w-full max-w-page px-4 pt-8 pb-16 md:pt-8 min-[1240px]:px-0">
      <div className="mb-5 flex items-center gap-6 md:hidden">
        <Link to="/" aria-label="Voltar ao início" className="grid size-[35px] shrink-0 place-items-center rounded-full border border-line bg-[#2f1d15]">
          <img src={backArrow} alt="" width={13} height={7} className="block rotate-90" />
        </Link>
        <h1 id="account-title" className="text-[20px] leading-4 font-bold text-text-foreground">
          {title}
        </h1>
      </div>
      <div className="flex flex-col gap-7 md:flex-row md:items-start">
        <AccountNav />
        <div className="flex min-w-0 flex-1 flex-col gap-8">
          <h1 className={cn('text-[16px] leading-4 font-bold text-text-foreground max-md:hidden', !showTitleOnDesktop && 'sr-only')}>{title}</h1>
          {children}
        </div>
      </div>
    </section>
  )
}

function AccountNav() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const router = useRouter()
  const logout = useLogout()
  const [notice, setNotice] = useState<string | null>(null)

  const link = (to: '/profile' | '/wallets', label: string, icon: string, size: number) => {
    const active = pathname === to
    return (
      <Link
        to={to}
        aria-current={active ? 'page' : undefined}
        className={cn(ROW, 'gap-4 max-md:h-[45px] max-md:leading-none', active ? 'border-l-[6px] border-brand pl-[10px]' : 'pl-4')}
      >
        <img src={icon} alt="" width={size} height={size} className="block shrink-0" />
        {label}
      </Link>
    )
  }

  return (
    <nav aria-label="Conta" className="flex w-full shrink-0 flex-col bg-surface-card py-2 md:w-[310px]">
      <p className="self-start p-[10px] text-[18px] leading-4 font-bold text-text-foreground max-md:hidden">Meu perfil</p>
      {link('/profile', 'Dados do perfil', userIcon, 18)}
      {link('/wallets', 'Carteiras', locationIcon, 20)}
      <div className="max-md:hidden">
        {OUT_OF_SCOPE.map(({ label, icon, size }) => (
          <button key={label} type="button" onClick={() => setNotice(`${label}: indisponível nesta demonstração.`)} className={cn(ROW, 'gap-3')}>
            <img src={icon} alt="" width={size} height={size} className="block shrink-0" />
            {label}
          </button>
        ))}
      </div>
      <div className="mt-0 border-t border-line-soft">
        <button
          type="button"
          aria-disabled={logout.isPending}
          onClick={() => {
            if (logout.isPending) return
            logout.mutate()
            void router.navigate({ to: '/', replace: true })
          }}
          className="flex h-10 w-full items-center gap-2 px-4 text-left text-[15px] leading-[15px] font-bold text-text-accent"
        >
          <img src={logoutIcon} alt="" width={20} height={20} className="block shrink-0" />
          Sair
        </button>
      </div>
      {notice && (
        <p role="status" className="px-4 pt-2 text-[13px] leading-5 text-text-secondary">
          {notice}
        </p>
      )}
    </nav>
  )
}
