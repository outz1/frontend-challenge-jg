import { Link } from '@tanstack/react-router'
import type { CartItem, Quote } from '@/api/contracts'
import { Skeleton } from '@/components/ui/skeleton'
import { formatEth, withEthUnit } from '@/lib/eth'

/** "Seus NFTs": linhas da cotação com a arte do carrinho (Figma 70504:3125). */
export function OrderLines({ quote, items }: { quote: Quote; items: CartItem[] }) {
  return (
    <ul aria-label="Itens do pedido" className="flex flex-col gap-3">
      {quote.lines.map((line) => {
        const item = items.find((i) => i.id === line.itemId)
        return (
          <li key={line.itemId} className="flex h-[70px] items-center gap-2 bg-surface-card pr-4 pl-1">
            {item ? (
              <img src={item.image.url} alt={item.image.alt} width={66} height={66} className="size-[66px] shrink-0 rounded-[8px] object-cover" />
            ) : (
              <div aria-hidden="true" className="size-[66px] shrink-0 rounded-[8px] bg-surface-dark" />
            )}
            <div className="flex min-w-0 flex-1 flex-col gap-1 leading-4">
              <p className="truncate text-[14px] font-bold text-text-foreground">{line.title}</p>
              {item && <p className="truncate text-[12px] text-brand-secondary">ID do token: {item.tokenId}</p>}
              <p className="truncate text-[12px] text-text-secondary">Edição {line.editionLabel}</p>
            </div>
            <div className="flex shrink-0 items-center gap-4 leading-4">
              <p className="text-[14px] text-text-secondary">(x {line.quantity})</p>
              <p className="text-[18px] font-bold text-text-accent">{withEthUnit(line.lineTotalEth)}</p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

/** Subtotal, desconto, taxa e total exatamente como a cotação do servidor devolveu (§3). */
export function Totals({ quote, withHints = false }: { quote: Quote; withHints?: boolean }) {
  return (
    <dl className="flex flex-col gap-3 text-text-foreground">
      <div className="flex items-center justify-between">
        <dt className="text-[15px]">Subtotal</dt>
        <dd className="text-[18px] leading-4">{withEthUnit(quote.subtotalEth)}</dd>
      </div>
      <div className="flex items-center justify-between text-[15px]">
        <dt>{quote.coupon ? `Desconto (${quote.coupon.code})` : 'Desconto do lançamento'}</dt>
        <dd>(-) {formatEth(quote.discountEth)}</dd>
      </div>
      <div className="flex items-center justify-between">
        <dt className="text-[15px]">Taxa de rede</dt>
        <dd className="text-[18px] leading-4">{withEthUnit(quote.networkFeeEth)}</dd>
      </div>
      {withHints && <p className="text-center text-[12px] leading-4 text-text-accent">Taxa estimada</p>}
      <div className="flex items-center justify-between border-t border-line-soft pt-3 text-[16px] leading-4 font-bold">
        <dt>Total</dt>
        <dd className="text-[18px] text-text-accent">{withEthUnit(quote.totalEth)}</dd>
      </div>
    </dl>
  )
}

/** Coluna "Seus NFTs" do desktop: lista, atalho do cupom e totais. */
export function DesktopSummary({
  quote,
  items,
  loading,
  failed,
  onRetry,
}: {
  quote: Quote | undefined
  items: CartItem[]
  loading: boolean
  failed: boolean
  onRetry: () => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-[17px] leading-4 font-bold text-text-foreground">Seus NFTs</h2>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-[16px] leading-4 text-text-foreground">
            <p className="font-bold">NFTs</p>
            <p className="font-medium">Subtotal</p>
          </div>
          <hr className="border-line-soft" />
        </div>

        {failed ? (
          <div role="alert" className="flex flex-col items-start gap-3 bg-surface-card p-4 text-[14px] text-coral">
            Não foi possível calcular os valores.
            <button type="button" onClick={onRetry} className="rounded-[6px] bg-brand px-4 py-2 font-bold text-ink">
              Tentar novamente
            </button>
          </div>
        ) : loading || !quote ? (
          <div role="status" aria-label="Carregando resumo do pedido" className="flex flex-col gap-3">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-[70px] w-full rounded-none" />
            ))}
            <Skeleton className="h-[148px] w-full rounded-none" />
          </div>
        ) : (
          <>
            <OrderLines quote={quote} items={items} />
            {quote.issues.length > 0 && (
              <ul role="status" className="flex flex-col gap-2 border border-line-soft p-3 text-[13px] leading-5 text-text-accent">
                {quote.issues.map((issue) => (
                  <li key={`${issue.kind}-${issue.itemId ?? ''}`}>{issue.message}</li>
                ))}
              </ul>
            )}
            <p className="text-center text-[14px] leading-4 text-text-foreground">
              {quote.coupon ? (
                <>Cupom {quote.coupon.code} aplicado. </>
              ) : (
                <>Tem um código promocional? </>
              )}
              <Link to="/cart" className="text-text-accent underline underline-offset-4">
                {quote.coupon ? 'Alterar no carrinho' : 'Aplique aqui'}
              </Link>
            </p>
            <Totals quote={quote} withHints />
          </>
        )}
      </div>
    </div>
  )
}
