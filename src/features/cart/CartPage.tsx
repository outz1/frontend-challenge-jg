import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from '@tanstack/react-router'
import { ApiRequestError } from '@/api/client'
import type { CartItem, Quote } from '@/api/contracts'
import {
  useApplyCoupon,
  useCart,
  useQuote,
  useRemoveCoupon,
  useRemoveItem,
  useSetQuantity,
} from '@/api/queries/cart'
import { Skeleton } from '@/components/ui/skeleton'
import { QuantityStepper } from '@/features/nft/QuantityStepper'
import { withEthUnit } from '@/lib/eth'
import { cn } from '@/lib/utils'
import { useNftSubscription } from '@/realtime/useNftSubscription'

/** Rede usada na cotação do carrinho; a escolha da rede acontece no checkout. */
const CART_NETWORK = 'ethereum' as const

export function CartPage() {
  const cart = useCart()
  const quote = useQuote(CART_NETWORK)
  // Itens do carrinho acompanham mudanças de preço e disponibilidade em tempo real (§7).
  useNftSubscription(cart.data?.items.map((item) => item.nftId) ?? [])

  return (
    <section aria-labelledby="cart-title" className="mx-auto w-full max-w-page px-6 pt-8 pb-16 md:px-4 min-[1240px]:px-0">
      <h1 id="cart-title" className="mb-8 text-heading font-bold text-text-foreground">
        Carrinho de NFTs
      </h1>

      {cart.isPending ? (
        <CartSkeleton />
      ) : cart.isError ? (
        <div role="alert" className="flex flex-col items-center gap-4 bg-surface-card px-6 py-12 text-center">
          <p className="text-body text-text-secondary">Não foi possível carregar o carrinho.</p>
          <button type="button" onClick={() => void cart.refetch()} className="rounded-[6px] bg-brand px-4 py-2 font-bold text-ink">
            Tentar novamente
          </button>
        </div>
      ) : cart.data.items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 bg-surface-card px-6 py-16 text-center">
          <h2 className="text-heading font-bold text-text-foreground">Seu carrinho está vazio</h2>
          <p className="max-w-[420px] text-body text-text-secondary">Explore o catálogo e adicione NFTs para comprar.</p>
          <Link to="/" className="rounded-[6px] bg-brand px-7 py-[10px] text-[16px] font-bold text-ink">
            Explorar NFTs
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <ul className="flex flex-col gap-4" aria-label="Itens do carrinho">
            {cart.data.items.map((item) => (
              <CartRow key={item.id} item={item} line={quote.data?.lines.find((l) => l.itemId === item.id)} />
            ))}
          </ul>
          <Summary couponCode={cart.data.couponCode} quote={quote.data} loading={quote.isPending} failed={quote.isError} />
        </div>
      )}
    </section>
  )
}

function CartRow({ item, line }: { item: CartItem; line: Quote['lines'][number] | undefined }) {
  const setQuantity = useSetQuantity()
  const remove = useRemoveItem()
  const max = Math.min(item.available ?? item.maxPerOrder, item.maxPerOrder)
  const busy = remove.isPending

  // A quantidade muda na tela na hora e o envio é agrupado: cliques rápidos viram uma só chamada com o valor final.
  const [desired, setDesired] = useState<number | null>(null)
  const latest = useRef<number | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  function change(quantity: number) {
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

  return (
    <li aria-busy={busy} className={cn('flex flex-col gap-4 bg-surface-card p-4 sm:flex-row sm:items-center', busy && 'opacity-70')}>
      <Link to="/nft/$nftId" params={{ nftId: item.nftId }} className="shrink-0">
        <img src={item.image.url} alt={item.image.alt} width={96} height={96} className="size-24 rounded-[12px] object-cover" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Link to="/nft/$nftId" params={{ nftId: item.nftId }} className="text-[16px] leading-5 text-text-foreground hover:underline">
          {item.title}
        </Link>
        <p className="text-body text-text-secondary">Edição {item.editionLabel}</p>
        <p className="text-[15px] font-bold text-text-accent">{withEthUnit(item.unitPriceEth)}</p>
      </div>
      <QuantityStepper value={desired ?? item.quantity} max={max} onChange={(quantity) => !busy && change(quantity)} />
      <div className="flex items-center justify-between gap-4 sm:w-[150px] sm:flex-col sm:items-end">
        <div className="text-[16px] font-bold text-text-foreground">
          {line ? withEthUnit(line.lineTotalEth) : <Skeleton className="h-4 w-20" />}
        </div>
        <button
          type="button"
          onClick={() => !busy && remove.mutate(item.id)}
          aria-label={`Remover ${item.title} do carrinho`}
          className="text-[14px] text-text-accent underline underline-offset-4"
        >
          Remover
        </button>
      </div>
    </li>
  )
}

function Summary({
  couponCode,
  quote,
  loading,
  failed,
}: {
  couponCode: string | null
  quote: Quote | undefined
  loading: boolean
  failed: boolean
}) {
  return (
    <aside aria-labelledby="summary-title" className="flex h-fit flex-col gap-5 bg-surface-card p-5">
      <h2 id="summary-title" className="text-[18px] leading-4 font-bold text-text-foreground">
        Resumo da carteira
      </h2>
      <CouponForm couponCode={couponCode} />

      {failed ? (
        <p role="alert" className="text-body text-coral">
          Não foi possível calcular os valores. Tente novamente em instantes.
        </p>
      ) : loading || !quote ? (
        <div className="flex flex-col gap-3" aria-hidden="true">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </div>
      ) : (
        <>
          {quote.issues.length > 0 && (
            <ul role="status" className="flex flex-col gap-2 border border-line-soft p-3 text-[13px] leading-5 text-text-accent">
              {quote.issues.map((issue) => (
                <li key={`${issue.kind}-${issue.itemId ?? ''}`}>{issue.message}</li>
              ))}
            </ul>
          )}
          <dl className="flex flex-col gap-3 text-[15px] text-text-secondary">
            <Row label="Subtotal" value={withEthUnit(quote.subtotalEth)} />
            <Row
              label={quote.coupon ? `Desconto (${quote.coupon.code})` : 'Desconto'}
              value={quote.coupon ? `- ${withEthUnit(quote.discountEth)}` : withEthUnit(quote.discountEth)}
            />
            <Row label="Taxa de rede" value={withEthUnit(quote.networkFeeEth)} />
            <div className="flex items-center justify-between border-t border-line-soft pt-3 text-[18px] font-bold text-text-foreground">
              <dt>Total</dt>
              <dd className="text-text-accent">{withEthUnit(quote.totalEth)}</dd>
            </div>
          </dl>
        </>
      )}

      <button
        type="button"
        aria-disabled="true"
        title="O pagamento chega no próximo bloco"
        className="h-[50px] w-full cursor-not-allowed rounded-[10px] bg-brand text-[16px] font-bold text-ink opacity-60"
      >
        Finalizar compra
      </button>
    </aside>
  )
}

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between">
    <dt>{label}</dt>
    <dd className="text-text-foreground">{value}</dd>
  </div>
)

function CouponForm({ couponCode }: { couponCode: string | null }) {
  const apply = useApplyCoupon()
  const remove = useRemoveCoupon()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

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
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-1">
      <label htmlFor="coupon" className="text-[14px] text-text-secondary">
        Cupom de desconto
      </label>
      <div className="flex gap-2">
        <input
          id="coupon"
          value={code}
          onChange={(e) => {
            setCode(e.target.value)
            setError('')
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'coupon-error' : undefined}
          maxLength={32}
          placeholder="Ex.: KURIO10"
          className={cn('h-10 min-w-0 flex-1 rounded-[6px] border bg-transparent px-3 text-body text-text-foreground placeholder:text-brand-secondary', error ? 'border-coral' : 'border-line-soft')}
        />
        <button type="submit" aria-disabled={apply.isPending} className="h-10 rounded-[6px] bg-brand px-4 text-[14px] font-bold text-ink">
          Aplicar
        </button>
      </div>
      {error && (
        <p id="coupon-error" role="alert" className="text-[13px] text-coral">
          {error}
        </p>
      )}
    </form>
  )
}

function CartSkeleton() {
  return (
    <div role="status" aria-label="Carregando carrinho" className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div aria-hidden="true" className="flex flex-col gap-4">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-[128px] w-full rounded-none" />
        ))}
      </div>
      <Skeleton aria-hidden="true" className="h-[360px] w-full rounded-none" />
    </div>
  )
}
