import { useState } from 'react'
import { Link, Navigate, getRouteApi, useNavigate } from '@tanstack/react-router'
import Big from 'big.js'
import type { Order } from '@/api/contracts'
import { useOrder } from '@/api/queries/orders'
import closeIcon from '@/assets/icons/order-close.svg'
import thankYou from '@/assets/icons/order-thank-you.svg'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { formatEth, withEthUnit } from '@/lib/eth'
import { networkLabel, providerLabel, shortAddress } from './constants'

const route = getRouteApi('/order/$orderId')

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

/** `29 Jul, 2026`, como no Figma (11:5134). */
function formatReceiptDate(iso: string) {
  const date = new Date(iso)
  return `${date.getDate()} ${MONTHS[date.getMonth()]}, ${date.getFullYear()}`
}

/**
 * Confirmação do pedido (Figma 11:4385, modal 70376:239). Só existe para pedido confirmado pela simulação (§3);
 * o recibo vem do snapshot imutável do pedido, nunca do carrinho ou do catálogo atual.
 */
export function OrderConfirmationPage() {
  const { orderId } = route.useParams()
  const order = useOrder(orderId)

  if (order.isPending) {
    return (
      <div role="status" aria-label="Carregando recibo" className="mx-auto my-8 w-full max-w-[578px] px-4">
        <Skeleton aria-hidden="true" className="h-[821px] w-full rounded-none" />
      </div>
    )
  }
  if (order.isError) {
    return (
      <section role="alert" className="mx-auto flex max-w-page flex-col items-center gap-4 px-4 py-24 text-center">
        <h1 className="text-heading font-bold">Pedido não encontrado</h1>
        <p className="text-body text-text-secondary">Este pedido não existe ou não pertence à sua conta.</p>
        <Link to="/" className="rounded-[6px] bg-brand px-7 py-[10px] text-[16px] font-bold text-ink">
          Voltar ao início
        </Link>
      </section>
    )
  }
  // Pendente volta para o acompanhamento; recusado volta ao checkout. Confirmação só para pedido confirmado.
  if (order.data.status === 'pending') return <Navigate to="/checkout" search={{ order: order.data.id }} replace />
  if (order.data.status === 'rejected') return <Navigate to="/checkout" replace />

  return <Receipt order={order.data} />
}

function Receipt({ order }: { order: Order }) {
  const navigate = useNavigate()
  const [explorerNotice, setExplorerNotice] = useState(false)
  const hasDiscount = new Big(order.discountEth).gt(0)
  const close = () => void navigate({ to: '/' })

  return (
    <Dialog open onOpenChange={(next) => !next && close()}>
      <DialogContent className="top-4 max-w-[578px] translate-y-0 gap-0 rounded-none border-0 p-0 md:top-1/2 md:-translate-y-1/2">
        <DialogTitle className="sr-only">Compra confirmada</DialogTitle>
        <DialogDescription className="sr-only">Recibo do pedido {order.id}</DialogDescription>

        <button
          type="button"
          onClick={close}
          aria-label="Fechar recibo"
          className="absolute top-[17px] right-[14px] grid size-8 place-items-center"
        >
          <img src={closeIcon} alt="" width={18} height={17} />
        </button>

        <header className="flex h-[156px] shrink-0 flex-col items-center justify-center gap-4">
          <img src={thankYou} alt="" width={65} height={80} />
          <p className="px-4 text-center text-[16px] leading-4 font-bold text-text-secondary">Seus NFTs agora estão na sua carteira</p>
        </header>

        <dl className="grid shrink-0 grid-cols-2 gap-x-4 gap-y-3 border-y border-brand px-5 py-3 text-[14px] leading-4 text-text-secondary md:flex md:h-[65px] md:items-center md:justify-between md:px-9 md:py-1">
          <Meta term="ID da transação" bold value={order.txHash ? shortAddress(order.txHash) : '-'} />
          <Meta term="Data" value={formatReceiptDate(order.settledAt ?? order.createdAt)} divider />
          <Meta term="Total" value={withEthUnit(order.totalEth)} divider />
          <Meta term="Carteira" bold value={providerLabel(order.walletProvider)} divider />
        </dl>

        <section aria-labelledby="receipt-details" className="flex flex-col gap-3 px-5 pt-5 pb-12 md:px-11">
          <h2 id="receipt-details" className="text-[15px] leading-4 font-bold text-text-foreground">
            Detalhes da transação
          </h2>

          <div className="flex items-center justify-between border-b border-line-soft pb-3 text-[16px] leading-4 text-text-foreground">
            <span className="font-bold">NFTs</span>
            <span className="flex gap-8 md:gap-12">
              <span className="font-bold">Edições</span>
              <span className="font-medium">Subtotal</span>
            </span>
          </div>

          <ul className="flex flex-col gap-3">
            {order.lines.map((line) => (
              <li key={`${line.nftId}-${line.editionLabel}`} className="flex min-h-[70px] items-center justify-between gap-3 bg-surface-card">
                <div className="flex min-w-0 items-center gap-3">
                  <img src={line.imageUrl} alt={line.title} width={70} height={70} className="size-[56px] shrink-0 rounded-[8px] object-cover md:size-[70px]" />
                  <div className="flex min-w-0 flex-col gap-[6px] leading-4">
                    <p className="text-[16px] font-bold text-text-foreground">{line.title}</p>
                    <p className="text-[14px] text-brand-secondary">
                      ID do token: {line.tokenId} · {line.editionLabel}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-4 text-right leading-4 md:gap-12">
                  <p className="text-[14px] text-text-secondary">(x {line.quantity})</p>
                  <p className="text-[16px] font-bold text-text-accent md:text-[18px]">{withEthUnit(line.lineTotalEth)}</p>
                </div>
              </li>
            ))}
          </ul>

          <dl className="flex flex-col gap-3 self-end text-text-foreground w-full md:w-[321px]">
            {hasDiscount && (
              <>
                <TotalRow term="Subtotal" value={withEthUnit(order.subtotalEth)} />
                <TotalRow term="Desconto" value={`(-) ${formatEth(order.discountEth)} ETH`} />
              </>
            )}
            <TotalRow term="Taxa de rede" value={withEthUnit(order.networkFeeEth)} />
            <div className="flex items-center justify-between font-bold leading-4">
              <dt className="text-[16px]">Total</dt>
              <dd className="text-[18px] text-text-accent">{withEthUnit(order.totalEth)}</dd>
            </div>
          </dl>

          <p className="mt-2 border-t border-line-soft pt-3 text-center text-[14px] leading-[22px] text-text-secondary">
            Transação confirmada na {networkLabel(order.network)}. A propriedade foi transferida para sua carteira conectada e registrada na rede.
          </p>

          <div className="flex flex-col items-center gap-2 pt-2">
            <button
              type="button"
              aria-describedby={explorerNotice ? 'explorer-notice' : undefined}
              onClick={() => setExplorerNotice(true)}
              className="rounded-[5px] bg-brand p-4 text-[16px] leading-4 font-bold text-ink"
            >
              Ver no Etherscan
            </button>
            {/* O explorador não existe na simulação: a ação não finge abrir uma transação real (§3). */}
            {explorerNotice && (
              <p id="explorer-notice" role="status" className="text-center text-[13px] leading-5 text-text-secondary">
                O Etherscan não está disponível nesta simulação.
              </p>
            )}
          </div>
        </section>

        <div className="h-[10px] shrink-0 bg-brand" aria-hidden="true" />
      </DialogContent>
    </Dialog>
  )
}

function Meta({ term, value, bold = false, divider = false }: { term: string; value: string; bold?: boolean; divider?: boolean }) {
  return (
    <div className={divider ? 'md:border-l md:border-line-soft md:pl-4' : undefined}>
      <dt className={bold ? 'font-bold' : undefined}>{term}</dt>
      <dd className="text-[15px]">{value}</dd>
    </div>
  )
}

function TotalRow({ term, value }: { term: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-[15px]">{term}</dt>
      <dd className="text-[18px] leading-4">{value}</dd>
    </div>
  )
}
