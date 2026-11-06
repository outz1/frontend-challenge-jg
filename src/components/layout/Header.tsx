import { Link, useRouterState } from '@tanstack/react-router'
import { SearchDialog } from './SearchDialog'
import cartIcon from '@/assets/icons/cart.svg'
import cartBadge from '@/assets/icons/cart-badge.svg'
import loginIcon from '@/assets/icons/login.svg'
import navUnderline from '@/assets/icons/nav-underline.svg'
import headerDivider from '@/assets/icons/header-divider.svg'

type HeaderProps = {
  /** Quantidade de itens do carrinho; o selo some quando é zero. */
  cartCount?: number
}

/** Seções fora do escopo (§3): visíveis como no layout, sem navegação. */
const outOfScopeNav = ['Mercado', 'Criadores', 'Aprenda']

export function Header({ cartCount = 0 }: HeaderProps) {
  // Figma: nas telas do fluxo de compra o item ativo do menu é "Mercado", não "Início".
  const inMarketFlow = useRouterState({ select: (state) => /^\/(nft|cart|checkout)(\/|$)/.test(state.location.pathname) })
  return (
    <header className="mx-auto w-full max-w-page px-4 min-[1240px]:px-0">
      <div className="flex h-11 items-start justify-between">
        <Link
          to="/"
          aria-label="Kurio, página inicial"
          className="flex h-[34px] w-40 items-center text-[14px] font-bold tracking-[0.1em] text-text-foreground"
        >
          KURIO
        </Link>

        <nav aria-label="Principal" className="hidden items-start gap-5 md:flex lg:gap-10">
          <Link
            to="/"
            activeOptions={{ exact: true, includeSearch: false }}
            className="relative h-11 text-[16px] font-normal text-text-foreground data-[status=active]:font-bold data-[status=active]:text-text-accent"
          >
            {({ isActive }) => (
              <>
                <span>Início</span>
                {isActive && (
                  <img
                    src={navUnderline}
                    alt=""
                    className="absolute bottom-0 left-0 block h-[3px] w-full max-w-none"
                  />
                )}
              </>
            )}
          </Link>
          {outOfScopeNav.map((label) => {
            const active = inMarketFlow && label === 'Mercado'
            return (
              <button
                key={label}
                type="button"
                aria-disabled="true"
                aria-current={active ? 'page' : undefined}
                title="Indisponível nesta demonstração"
                className={`relative h-11 cursor-default text-[16px] ${active ? 'font-bold text-text-accent' : 'font-normal text-text-foreground'}`}
              >
                {label}
                {active && (
                  <img src={navUnderline} alt="" className="absolute bottom-0 left-0 block h-[3px] w-full max-w-none" />
                )}
              </button>
            )
          })}
        </nav>

        <div className="flex items-center gap-7">
          <SearchDialog />

          <Link to="/cart" aria-label={`Carrinho, ${cartCount} itens`} className="relative block size-6 shrink-0">
            <img src={cartIcon} alt="" className="block size-full" />
            {cartCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute top-0 left-[15px] grid size-4 place-items-center"
              >
                <img src={cartBadge} alt="" className="absolute inset-[-12.5%] block size-[125%] max-w-none" />
                <span className="relative text-[10px] font-medium text-ink">{cartCount}</span>
              </span>
            )}
          </Link>

          <Link
            to="/login"
            className="flex h-[35px] w-[100px] items-center justify-center gap-1 rounded-[6px] bg-brand text-[16px] font-medium text-ink"
          >
            <img src={loginIcon} alt="" className="block size-5" />
            Entrar
          </Link>
        </div>
      </div>
      <img src={headerDivider} alt="" className="mt-0 block h-px w-full max-w-none" />
    </header>
  )
}
