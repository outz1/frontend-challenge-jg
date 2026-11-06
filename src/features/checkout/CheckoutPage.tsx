import { useEffect, useState, type FormEvent } from 'react'
import { Link, getRouteApi, useNavigate } from '@tanstack/react-router'
import type { User } from '@/api/contracts'
import { useCart, useQuote } from '@/api/queries/cart'
import { useSession } from '@/api/queries/session'
import { useWallets } from '@/api/queries/wallets'
import backArrow from '@/assets/icons/m-back-arrow.svg'
import { Skeleton } from '@/components/ui/skeleton'
import { MD_UP, useMediaQuery } from '@/hooks/useMediaQuery'
import { withEthUnit } from '@/lib/eth'
import { cn } from '@/lib/utils'
import { useNftSubscription } from '@/realtime/useNftSubscription'
import { CollectorFields } from './CollectorFields'
import { DesktopSummary } from './OrderSummary'
import { ReviewDialog } from './ReviewDialog'
import { clearActiveOrder, loadActiveOrder } from './storage'
import { useCheckoutForm } from './useCheckoutForm'
import { useCheckoutOrder } from './useCheckoutOrder'
import { MobileWalletCards, ProviderOptions } from './WalletSection'

const route = getRouteApi('/checkout')

const CONFIRM_DESKTOP = 'flex h-[45px] w-full items-center justify-center rounded-[8px] bg-brand px-4 text-[15px] font-bold text-ink'
const ROUND_BTN = 'grid size-[35px] shrink-0 place-items-center rounded-full border border-line bg-[#2f1d15]'

export function CheckoutPage() {
  const { user } = useSession()
  // A rota exige sessão; sem usuário (logout em andamento) não há nada a mostrar.
  return user ? <Checkout user={user} /> : null
}

function Checkout({ user }: { user: User }) {
  const { order: orderId } = route.useSearch()
  const navigate = useNavigate()
  const desktop = useMediaQuery(MD_UP)
  const cart = useCart()
  const wallets = useWallets()
  const form = useCheckoutForm(user, wallets.data)
  const quote = useQuote(form.network ?? 'ethereum')
  const [reviewOpen, setReviewOpen] = useState(false)
  // Itens do pedido acompanham preço e estoque em tempo real durante o checkout (§7).
  useNftSubscription(cart.data?.items.map((item) => item.nftId) ?? [])

  const quoteData = quote.isPlaceholderData ? undefined : quote.data
  const checkout = useCheckoutOrder({
    userId: user.id,
    form,
    quote: quoteData,
    onCreated: (id) => {
      void navigate({ to: '/checkout', search: { order: id }, replace: true })
    },
  })

  // Voltar ao checkout com um pedido em andamento retoma o acompanhamento em vez de abrir outra compra (§3).
  useEffect(() => {
    if (orderId) return
    const active = loadActiveOrder(user.id)
    if (active) void navigate({ to: '/checkout', search: { order: active }, replace: true })
  }, [orderId, user.id, navigate])

  const items = cart.data?.items ?? []
  const noWallets = wallets.isSuccess && wallets.data.length === 0
  const blocked = noWallets || (quote.data?.issues.some((i) => i.kind === 'unavailable') ?? false)

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (blocked) return
    const valid = form.validate()
    if (!valid) {
      // Foco no primeiro campo com erro (os ids seguem o nome do campo).
      requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
      return
    }
    checkout.clearNotice()
    setReviewOpen(true)
  }

  const loading = cart.isPending || wallets.isPending
  const failed = cart.isError || wallets.isError

  return (
    <section aria-labelledby="checkout-title" className="mx-auto w-full max-w-page px-4 pt-8 pb-16 max-md:px-7 md:pt-0 min-[1240px]:px-0">
      {desktop ? (
        <>
          <h1 id="checkout-title" className="sr-only">
            Pagamento
          </h1>
          <nav aria-label="Você está em" className="mt-8 mb-8 text-[15px] leading-4 font-bold text-text-foreground">
            <Link to="/">Início</Link> / Mercado / <span aria-current="page">Pagamento</span>
          </nav>
        </>
      ) : (
        <div className="mb-4 flex h-11 items-start gap-6">
          <Link to="/cart" aria-label="Voltar ao carrinho" className={ROUND_BTN}>
            <img src={backArrow} alt="" width={13} height={7} className="block rotate-90" />
          </Link>
          <h1 id="checkout-title" className="mt-[9px] text-[20px] leading-4 font-bold text-text-foreground">
            Pagamento com carteira
          </h1>
        </div>
      )}

      {loading ? (
        <CheckoutSkeleton desktop={desktop} />
      ) : failed ? (
        <div role="alert" className="flex flex-col items-center gap-4 bg-surface-card px-6 py-12 text-center">
          <p className="text-body text-text-secondary">Não foi possível carregar o pagamento.</p>
          <button
            type="button"
            onClick={() => {
              void cart.refetch()
              void wallets.refetch()
            }}
            className="rounded-[6px] bg-brand px-4 py-2 font-bold text-ink"
          >
            Tentar novamente
          </button>
        </div>
      ) : items.length === 0 && !orderId && !checkout.recovering ? (
        <div className="flex flex-col items-center gap-4 bg-surface-card px-6 py-16 text-center">
          <h2 className="text-heading font-bold text-text-foreground">Nada para pagar</h2>
          <p className="max-w-[420px] text-body text-text-secondary">Seu carrinho está vazio. Adicione NFTs para continuar.</p>
          <Link to="/" className="rounded-[6px] bg-brand px-7 py-[10px] text-[16px] font-bold text-ink">
            Explorar NFTs
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate aria-labelledby="checkout-title">
          {noWallets && (
            <p role="alert" className="mb-6 border border-coral px-4 py-3 text-[14px] leading-5 text-coral">
              Você ainda não tem uma carteira cadastrada. Cadastre uma carteira para concluir a compra.
            </p>
          )}
          {desktop ? (
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_405px]">
              <div className="flex flex-col gap-3">
                <h2 className="text-[17px] leading-4 font-bold text-text-foreground">Perfil do colecionador</h2>
                <CollectorFields form={form} wallets={wallets.data ?? []} withWalletFields />
              </div>
              <div className="flex flex-col gap-5">
                <DesktopSummary quote={quote.data} items={items} loading={quote.isPending} failed={quote.isError} onRetry={() => void quote.refetch()} />
                <ProviderOptions form={form} tone="desktop" />
                <button type="submit" data-confirm-purchase aria-disabled={blocked} className={cn(CONFIRM_DESKTOP, blocked && 'cursor-not-allowed opacity-60')}>
                  Confirmar compra
                </button>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[calc(100dvh-140px)] flex-col justify-between gap-8">
              <div className="flex flex-col gap-4">
                {/* Sem o resumo do desktop, os avisos da cotação (item esgotado, preço) aparecem aqui. */}
                {quote.data && quote.data.issues.length > 0 && (
                  <ul role="status" className="flex flex-col gap-2 border border-line-soft p-3 text-[13px] leading-5 text-text-accent">
                    {quote.data.issues.map((issue) => (
                      <li key={`${issue.kind}-${issue.itemId ?? ''}`}>{issue.message}</li>
                    ))}
                  </ul>
                )}
                <MobileWalletCards form={form} wallets={wallets.data ?? []} />
                <ProviderOptions form={form} tone="mobile" />
                <div className="flex flex-col gap-3 pt-2">
                  <h2 className="text-[16px] leading-4 font-bold text-text-foreground">Perfil do colecionador</h2>
                  <CollectorFields form={form} wallets={wallets.data ?? []} withWalletFields={false} />
                </div>
                <div className="flex items-center justify-end gap-7 leading-4 font-bold">
                  <p className="text-[16px] text-text-foreground">Total:</p>
                  {quote.data ? (
                    <p className="text-[18px] text-text-accent">{withEthUnit(quote.data.totalEth)}</p>
                  ) : (
                    <Skeleton className="h-[18px] w-28" />
                  )}
                </div>
              </div>
              <button
                type="submit"
                data-confirm-purchase
                aria-disabled={blocked}
                className={cn(
                  'flex h-[60px] w-full items-center justify-center rounded-[40px] bg-[linear-gradient(108.5deg,#d28a4c_4%,rgba(210,138,76,0.8)_122%)] text-[15px] leading-4 font-bold text-ink',
                  blocked && 'cursor-not-allowed opacity-60',
                )}
              >
                Confirmar compra
              </button>
            </div>
          )}
        </form>
      )}

      <ReviewDialog
        userId={user.id}
        form={form}
        quote={quote.data}
        quoteBusy={quote.isFetching || quote.isPlaceholderData}
        items={items}
        orderId={orderId}
        reviewOpen={reviewOpen}
        recovering={checkout.recovering}
        busy={checkout.busy}
        notice={checkout.notice}
        onClose={() => setReviewOpen(false)}
        onSubmit={() => void checkout.submit()}
        onRetryAfterRejection={() => {
          // Recusa encerra o pedido: a próxima tentativa nasce com chave nova, mesmos dados, de volta à revisão.
          clearActiveOrder(user.id)
          checkout.clearNotice()
          setReviewOpen(true)
          void navigate({ to: '/checkout', search: {}, replace: true })
        }}
      />
    </section>
  )
}

function CheckoutSkeleton({ desktop }: { desktop: boolean }) {
  return (
    <div role="status" aria-label="Carregando pagamento" className={desktop ? 'grid gap-8 lg:grid-cols-[minmax(0,1fr)_405px]' : 'flex flex-col gap-4'}>
      <div aria-hidden="true" className="flex flex-col gap-3">
        {Array.from({ length: desktop ? 5 : 3 }, (_, i) => (
          <Skeleton key={i} className={desktop ? 'h-[69px] w-full rounded-none' : 'h-[93px] w-full rounded-[14px]'} />
        ))}
      </div>
      <Skeleton aria-hidden="true" className={desktop ? 'h-[620px] w-full rounded-none' : 'h-[200px] w-full rounded-[15px]'} />
    </div>
  )
}
