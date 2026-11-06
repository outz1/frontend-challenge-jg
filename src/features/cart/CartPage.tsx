import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from '@tanstack/react-router'
import { ApiRequestError } from '@/api/client'
import type { CartItem, NftListQuery, Quote } from '@/api/contracts'
import { useApplyCoupon, useCart, useQuote, useRemoveCoupon, useRemoveItem, useSetQuantity } from '@/api/queries/cart'
import deleteIcon from '@/assets/icons/cart-delete.svg'
import mobileDeleteIcon from '@/assets/icons/cart-m-delete.svg'
import minusOff from '@/assets/icons/cart-m-minus-off.svg'
import minusOn from '@/assets/icons/cart-m-minus.svg'
import backArrow from '@/assets/icons/m-back-arrow.svg'
import { Skeleton } from '@/components/ui/skeleton'
import { MD_UP, useMediaQuery } from '@/hooks/useMediaQuery'
import { NftShowcase } from '@/features/nft/NftShowcase'
import { QuantityStepper } from '@/features/nft/QuantityStepper'
import { formatEth, withEthUnit } from '@/lib/eth'
import { cn } from '@/lib/utils'
import { useNftSubscription } from '@/realtime/useNftSubscription'

/** Rede usada na cotação do carrinho; a escolha da rede acontece no checkout. */
const CART_NETWORK = 'ethereum' as const
const CTA_LABEL = 'Conectar e finalizar'
const GRADIENT_BUTTON = 'bg-[linear-gradient(108.86deg,#d28a4c_3.96%,rgba(210,138,76,0.8)_121.97%)]'
const RECOMMENDED: NftListQuery = { tab: 'all', collection: [], network: [], sort: 'recent', page: 1, pageSize: 20 }

export function CartPage() {
  const desktop = useMediaQuery(MD_UP)
  const cart = useCart()
  const quote = useQuote(CART_NETWORK)
  // Itens do carrinho acompanham mudanças de preço e disponibilidade em tempo real (§7).
  useNftSubscription(cart.data?.items.map((item) => item.nftId) ?? [])
  const items = cart.data?.items ?? []
  const filled = cart.isSuccess && items.length > 0

  return (
    <section
      aria-labelledby="cart-title"
      className={cn('mx-auto w-full max-w-page px-4 pb-16 max-md:px-7 md:pt-0 min-[1240px]:px-0', filled && !desktop ? 'pt-8 pb-[400px]' : 'pt-8')}
    >
      {desktop ? (
        <>
          <h1 id="cart-title" className="sr-only">
            Carrinho de NFTs
          </h1>
          <nav aria-label="Você está em" className="mt-8 mb-3 text-[15px] leading-4 font-bold text-text-foreground">
            <Link to="/">Início</Link> / Mercado / <span aria-current="page">Carrinho</span>
          </nav>
        </>
      ) : (
        <div className="mb-3 flex h-11 items-start gap-[61px]">
          <Link to="/" aria-label="Voltar ao início" className="grid size-[35px] shrink-0 place-items-center rounded-full border border-line bg-[#2f1d15]">
            <img src={backArrow} alt="" width={13} height={7} className="block rotate-90" />
          </Link>
          <h1 id="cart-title" className="mt-[9px] text-[20px] leading-4 font-bold text-text-foreground">
            Carrinho de NFTs
          </h1>
        </div>
      )}

      {cart.isPending ? (
        <CartSkeleton desktop={desktop} />
      ) : cart.isError ? (
        <div role="alert" className="flex flex-col items-center gap-4 bg-surface-card px-6 py-12 text-center">
          <p className="text-body text-text-secondary">Não foi possível carregar o carrinho.</p>
          <button type="button" onClick={() => void cart.refetch()} className="rounded-[6px] bg-brand px-4 py-2 font-bold text-ink">
            Tentar novamente
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 bg-surface-card px-6 py-16 text-center">
          <h2 className="text-heading font-bold text-text-foreground">Seu carrinho está vazio</h2>
          <p className="max-w-[420px] text-body text-text-secondary">Explore o catálogo e adicione NFTs para comprar.</p>
          <Link to="/" className="rounded-[6px] bg-brand px-7 py-[10px] text-[16px] font-bold text-ink">
            Explorar NFTs
          </Link>
        </div>
      ) : desktop ? (
        <>
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <CartTable items={items} quote={quote.data} />
            <DesktopSummary couponCode={cart.data.couponCode} quote={quote.data} loading={quote.isPending} failed={quote.isError} />
          </div>
          <div className="mt-24">
            <NftShowcase id="tambem-viram" title="Colecionadores também viram" query={RECOMMENDED} exclude={items.map((i) => i.nftId)} variant="cart" />
          </div>
        </>
      ) : (
        <>
          <ul aria-label="Itens do carrinho" className="flex flex-col gap-5">
            {items.map((item) => (
              <MobileRow key={item.id} item={item} />
            ))}
          </ul>
          <MobileSummary couponCode={cart.data.couponCode} quote={quote.data} loading={quote.isPending} failed={quote.isError} />
        </>
      )}
    </section>
  )
}

/**
 * A quantidade muda na tela na hora e o envio é agrupado: cliques rápidos viram uma só chamada com o valor final.
 * Remover bloqueia o item até a API responder.
 */
function useCartItem(item: CartItem) {
  const setQuantity = useSetQuantity()
  const remove = useRemoveItem()
  const max = Math.min(item.available ?? item.maxPerOrder, item.maxPerOrder)
  const [desired, setDesired] = useState<number | null>(null)
  const latest = useRef<number | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  const busy = remove.isPending

  function change(quantity: number) {
    if (busy) return
    latest.current = quantity
    setDesired(quantity)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      setQuantity.mutate(
        { itemId: item.id, quantity },
        // Só solta o valor local se nenhuma mudança mais nova foi feita no meio do caminho.
        { onSettled: () => latest.current === quantity && setDesired(null) },
      )
    }, 350)
  }

  return { quantity: desired ?? item.quantity, max, busy, change, remove: () => !busy && remove.mutate(item.id) }
}

/* Desktop (Figma 70369:241): tabela NFTs, Preço, Edições, Total. */

const COLUMNS = 'grid grid-cols-[250px_77px_75px_87px_24px] items-center justify-between'

function CartTable({ items, quote }: { items: CartItem[]; quote: Quote | undefined }) {
  return (
    <div className="flex w-full flex-col gap-3 lg:w-[782px]">
      <div className={cn(COLUMNS, 'pr-6 text-[16px] leading-4 text-text-foreground')} aria-hidden="true">
        <span className="font-bold">NFTs</span>
        <span className="font-medium">Preço</span>
        <span className="font-bold">Edições</span>
        <span className="font-medium">Total</span>
        <span />
      </div>
      <hr className="h-px border-0 bg-brand/30" />
      <ul aria-label="Itens do carrinho" className="flex flex-col gap-3">
        {items.map((item) => (
          <DesktopRow key={item.id} item={item} line={quote?.lines.find((l) => l.itemId === item.id)} />
        ))}
      </ul>
    </div>
  )
}

function DesktopRow({ item, line }: { item: CartItem; line: Quote['lines'][number] | undefined }) {
  const { quantity, max, busy, change, remove } = useCartItem(item)
  return (
    <li aria-busy={busy} className={cn(COLUMNS, 'h-[70px] bg-surface-card pr-6', busy && 'opacity-70')}>
      <div className="flex items-center gap-4">
        <Link to="/nft/$nftId" params={{ nftId: item.nftId }} className="shrink-0">
          <img src={item.image.url} alt={item.image.alt} width={70} height={70} className="size-[70px] rounded-[6px] object-cover" />
        </Link>
        <div className="flex min-w-0 flex-col gap-[6px] leading-4">
          <Link to="/nft/$nftId" params={{ nftId: item.nftId }} className="text-[16px] font-bold whitespace-nowrap text-text-foreground hover:underline">
            {item.title}
          </Link>
          <p className="truncate text-[14px] text-brand-secondary">ID do token: {item.tokenId}</p>
          <p className="truncate text-[14px] text-text-secondary">Edição {item.editionLabel}</p>
        </div>
      </div>
      <p className="text-[16px] leading-4 font-bold whitespace-nowrap text-text-secondary">{withEthUnit(item.unitPriceEth)}</p>
      <QuantityStepper variant="cart" value={quantity} max={max} onChange={change} />
      <div className="text-[16px] leading-4 font-bold whitespace-nowrap text-text-accent">{line ? withEthUnit(line.lineTotalEth) : <Skeleton className="h-4 w-16" />}</div>
      <button type="button" onClick={remove} aria-label={`Remover ${item.title} do carrinho`} className="grid size-6 place-items-center">
        <img src={deleteIcon} alt="" width={18} height={20} className="block" />
      </button>
    </li>
  )
}

function DesktopSummary({ couponCode, quote, loading, failed }: SummaryProps) {
  const blocked = !quote || quote.issues.some((issue) => issue.kind === 'unavailable')
  return (
    <aside aria-labelledby="summary-title" className="flex w-full flex-col gap-6 lg:w-[332px]">
      <div className="flex flex-col gap-3">
        <h2 id="summary-title" className="text-[18px] leading-4 font-bold text-text-foreground">
          Resumo da carteira
        </h2>
        <hr className="h-px border-0 bg-brand/30" />
      </div>
      <CouponForm couponCode={couponCode} variant="desktop" />
      <QuoteRows quote={quote} loading={loading} failed={failed} />
      <div className="flex flex-col items-center gap-3">
        {blocked ? (
          <button type="button" aria-disabled="true" className="flex h-10 w-full cursor-not-allowed items-center justify-center rounded-[3px] bg-brand text-[15px] leading-4 font-bold text-ink opacity-60">
            {CTA_LABEL}
          </button>
        ) : (
          <Link to="/checkout" className="flex h-10 w-full items-center justify-center rounded-[3px] bg-brand text-[15px] leading-4 font-bold text-ink">
            {CTA_LABEL}
          </Link>
        )}
        <Link to="/" className="text-[15px] text-text-accent">
          Continuar explorando
        </Link>
      </div>
    </aside>
  )
}

/* Mobile (Figma 70397:241 e 70397:245): cartões de 100 px e folha de resumo fixa embaixo. */

function MobileRow({ item }: { item: CartItem }) {
  const { quantity, max, busy, change, remove } = useCartItem(item)
  const atMin = quantity <= 1
  const atMax = quantity >= max
  return (
    <li aria-busy={busy} className={cn('relative h-[100px] rounded-[14px] bg-surface-card shadow-[0_6px_20px_rgba(10,6,4,0.45)]', busy && 'opacity-70')}>
      <Link to="/nft/$nftId" params={{ nftId: item.nftId }} className="absolute top-0 left-0">
        <img src={item.image.url} alt={item.image.alt} width={100} height={100} className="size-[100px] rounded-[14px] object-cover" />
      </Link>
      <Link to="/nft/$nftId" params={{ nftId: item.nftId }} className="absolute top-[13px] left-[109px] max-w-[140px] truncate text-[15px] leading-4 font-bold text-text-foreground">
        {item.title}
      </Link>
      <p className="absolute top-[35px] left-[109px] text-[14px] leading-4 text-text-secondary">Edição: {item.editionLabel}</p>
      <p className="absolute top-[69px] left-[109px] text-[18px] leading-4 font-bold text-text-accent">{withEthUnit(item.unitPriceEth)}</p>
      <div role="group" aria-label="Quantidade" className="absolute top-[38px] left-[261px] flex items-center">
        <button
          type="button"
          aria-label="Diminuir quantidade"
          aria-disabled={atMin}
          onClick={() => !atMin && change(quantity - 1)}
          className="size-6"
        >
          <img src={atMin ? minusOff : minusOn} alt="" width={24} height={24} className="block" />
        </button>
        <output aria-live="polite" className="w-[37px] translate-y-[6px] text-center text-[16px] leading-[22px] text-text-foreground">
          {quantity}
        </output>
        <button
          type="button"
          aria-label="Aumentar quantidade"
          aria-disabled={atMax}
          onClick={() => !atMax && change(quantity + 1)}
          className={cn('grid size-6 place-items-center rounded-full border border-line bg-[#2f1d15] text-[21px] leading-none text-text-foreground', atMax && 'cursor-not-allowed opacity-40')}
        >
          <span aria-hidden="true">+</span>
        </button>
      </div>
      <button type="button" onClick={remove} aria-label={`Remover ${item.title} do carrinho`} className="absolute top-2 right-2 grid size-6 place-items-center">
        <img src={mobileDeleteIcon} alt="" width={18} height={20} className="block" />
      </button>
    </li>
  )
}

function MobileSummary({ couponCode, quote, loading, failed }: SummaryProps) {
  const blocked = !quote || quote.issues.some((issue) => issue.kind === 'unavailable')
  const cta = cn('flex h-[60px] w-full shrink-0 items-center justify-center rounded-[40px] text-[16px] leading-4 font-bold text-ink', GRADIENT_BUTTON)
  return (
    <aside
      aria-label="Resumo da carteira"
      className="fixed inset-x-0 bottom-0 z-30 flex max-h-[75dvh] flex-col gap-3 overflow-y-auto rounded-t-[40px] bg-surface-card px-6 pt-6 pb-9"
    >
      <CouponForm couponCode={couponCode} variant="mobile" />
      <QuoteRows quote={quote} loading={loading} failed={failed} compact />
      {blocked ? (
        <button type="button" aria-disabled="true" className={cn(cta, 'cursor-not-allowed opacity-60')}>
          {CTA_LABEL}
        </button>
      ) : (
        <Link to="/checkout" className={cta}>
          {CTA_LABEL}
        </Link>
      )}
    </aside>
  )
}

/* Partes compartilhadas */

type SummaryProps = { couponCode: string | null; quote: Quote | undefined; loading: boolean; failed: boolean }

function QuoteRows({ quote, loading, failed, compact = false }: { quote: Quote | undefined; loading: boolean; failed: boolean; compact?: boolean }) {
  if (failed) {
    return (
      <p role="alert" className="text-body text-coral">
        Não foi possível calcular os valores. Tente novamente em instantes.
      </p>
    )
  }
  if (loading || !quote) {
    return (
      <div className="flex flex-col gap-3" aria-hidden="true">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-5 w-full" />
        ))}
      </div>
    )
  }
  const value = compact ? 'text-[16px]' : 'text-[18px]'
  const discount = quote.coupon ? `(-) ${formatEth(quote.discountEth)}` : '(-) 0.00'
  return (
    <div className="flex flex-col gap-3 text-text-foreground">
      {quote.issues.length > 0 && (
        <ul role="status" className="flex flex-col gap-2 border border-line-soft p-3 text-[13px] leading-5 text-text-accent">
          {quote.issues.map((issue) => (
            <li key={`${issue.kind}-${issue.itemId ?? ''}`}>{issue.message}</li>
          ))}
        </ul>
      )}
      <dl className="flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <dt className="text-[15px] leading-[normal]">Subtotal</dt>
          <dd className={cn('leading-4', value)}>{withEthUnit(quote.subtotalEth)}</dd>
        </div>
        <div className="flex items-start justify-between text-[15px] leading-[normal]">
          <dt>{quote.coupon ? `Desconto (${quote.coupon.code})` : 'Desconto do lançamento'}</dt>
          <dd>{discount}</dd>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex w-full items-center justify-between">
            <dt className="text-[15px] leading-[normal]">Taxa de rede</dt>
            <dd className={cn('leading-4', value)}>{withEthUnit(quote.networkFeeEth)}</dd>
          </div>
          <p className="text-[12px] leading-4 text-text-accent">Taxa estimada</p>
        </div>
        <div className="flex items-start justify-between leading-4 font-bold">
          <dt className="text-[16px]">Total</dt>
          <dd className="text-[18px] text-text-accent">{withEthUnit(quote.totalEth)}</dd>
        </div>
      </dl>
    </div>
  )
}

function CouponForm({ couponCode, variant }: { couponCode: string | null; variant: 'desktop' | 'mobile' }) {
  const apply = useApplyCoupon()
  const remove = useRemoveCoupon()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const mobile = variant === 'mobile'

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const value = code.trim()
    if (!value) return setError('Informe o cupom')
    if (apply.isPending) return
    setError('')
    apply.mutate(value, {
      onSuccess: () => setCode(''),
      onError: (e) => setError(e instanceof ApiRequestError && e.status === 422 ? e.message : 'Não foi possível aplicar o cupom.'),
    })
  }

  if (couponCode) {
    return (
      <div className="flex items-center justify-between gap-3 border border-line-soft px-3 py-2 text-[14px]">
        <p className="text-text-foreground">
          Cupom <strong className="text-text-accent">{couponCode}</strong> aplicado
        </p>
        <button type="button" onClick={() => remove.mutate()} className="text-text-accent underline underline-offset-4">
          Remover cupom
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className={cn('flex flex-col', mobile ? 'gap-1' : 'gap-2')}>
      <label htmlFor={`coupon-${variant}`} className={mobile ? 'sr-only' : 'text-[14px] leading-4 font-bold text-text-foreground'}>
        Código promocional
      </label>
      <div
        className={cn(
          'flex items-center',
          mobile
            ? 'h-[50px] rounded-[40px] border border-line bg-surface-card pl-4 drop-shadow-[0_6px_10px_rgba(10,6,4,0.45)]'
            : 'h-10 rounded-[3px] border pl-2',
          !mobile && (error ? 'border-coral' : 'border-brand'),
        )}
      >
        <input
          id={`coupon-${variant}`}
          value={code}
          onChange={(e) => {
            setCode(e.target.value)
            setError('')
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `coupon-error-${variant}` : undefined}
          maxLength={32}
          placeholder="Digite o código promocional..."
          className={cn('min-w-0 flex-1 bg-transparent text-text-foreground placeholder:text-brand-secondary', mobile ? 'text-[13px] leading-[22px]' : 'text-[12px] leading-4')}
        />
        <button
          type="submit"
          aria-disabled={apply.isPending}
          className={cn(
            'flex shrink-0 items-center justify-center text-[15px] leading-4 font-bold',
            mobile
              ? 'h-[50px] w-[97px] rounded-[40px] bg-[linear-gradient(96deg,rgba(210,138,76,0.54)_0.94%,#d28a4c_105%)] text-text-foreground'
              : 'h-10 w-[102px] rounded-r-[3px] bg-brand text-ink',
          )}
        >
          Aplicar
        </button>
      </div>
      {error && (
        <p id={`coupon-error-${variant}`} role="alert" className={cn('text-[13px] text-coral', mobile && 'px-4')}>
          {error}
        </p>
      )}
    </form>
  )
}

function CartSkeleton({ desktop }: { desktop: boolean }) {
  return (
    <div role="status" aria-label="Carregando carrinho" className={desktop ? 'flex flex-col gap-8 lg:flex-row lg:justify-between' : 'flex flex-col gap-5'}>
      <div aria-hidden="true" className={cn('flex flex-col', desktop ? 'w-full gap-3 lg:w-[782px]' : 'gap-5')}>
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className={desktop ? 'h-[70px] w-full rounded-none' : 'h-[100px] w-full rounded-[14px]'} />
        ))}
      </div>
      {desktop && <Skeleton aria-hidden="true" className="h-[420px] w-full rounded-none lg:w-[332px]" />}
    </div>
  )
}
