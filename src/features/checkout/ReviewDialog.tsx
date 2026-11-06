import { useEffect } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { ApiRequestError } from '@/api/client'
import type { CartItem, Quote } from '@/api/contracts'
import { useOrder } from '@/api/queries/orders'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { withEthUnit } from '@/lib/eth'
import { cn } from '@/lib/utils'
import { networkLabel, providerLabel, shortAddress, walletKindLabel } from './constants'
import { OrderLines, Totals } from './OrderSummary'
import { clearActiveOrder, clearDraft } from './storage'
import type { Busy, Notice } from './useCheckoutOrder'
import type { CheckoutForm } from './useCheckoutForm'

type Props = {
  userId: string
  form: CheckoutForm
  quote: Quote | undefined
  /** Cotação sendo refeita: o envio espera para nunca fechar um pedido com valores já velhos. */
  quoteBusy: boolean
  items: CartItem[]
  orderId: string | undefined
  reviewOpen: boolean
  /** Envio sem resposta: só é possível recuperar o mesmo pedido, nunca criar outro. */
  recovering: boolean
  busy: Busy
  notice: Notice | null
  onClose: () => void
  onSubmit: () => void
  /** Pedido recusado: volta à revisão com uma chave nova. */
  onRetryAfterRejection: () => void
}

const PRIMARY = 'flex h-[45px] items-center justify-center rounded-[8px] bg-brand px-4 text-[15px] font-bold text-ink'
const SECONDARY = 'flex h-[45px] items-center justify-center rounded-[8px] border border-line-soft px-4 text-[15px] text-text-foreground'

/**
 * Revisão antes do envio e acompanhamento do pedido. Existe uma tela só para o pedido pendente, recusado ou
 * em erro; a confirmação (pedido confirmado pela simulação) é uma rota própria.
 */
export function ReviewDialog(props: Props) {
  const { orderId, reviewOpen, recovering } = props
  const open = reviewOpen || recovering || Boolean(orderId)
  const order = useOrder(orderId)
  const locked = Boolean(props.busy) || order.data?.status === 'pending'

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !locked && props.onClose()}>
      <DialogContent
        // Enquanto envia ou aguarda o pagamento não há como fechar: o pedido já está em andamento.
        onEscapeKeyDown={(e) => locked && e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        {orderId ? <OrderProgress userId={props.userId} orderId={orderId} order={order} onRetry={props.onRetryAfterRejection} /> : <Review {...props} />}
      </DialogContent>
    </Dialog>
  )
}

function Review({ form, quote, quoteBusy, items, busy, notice, recovering, onClose, onSubmit }: Props) {
  if (recovering) return <Recovery busy={busy} notice={notice} onSubmit={onSubmit} onClose={onClose} />
  const stale = notice?.kind === 'stale'
  const unavailable = quote?.issues.some((i) => i.kind === 'unavailable') ?? false
  const ready = Boolean(quote) && !quoteBusy && !unavailable
  const label = busy === 'connecting' ? 'Conectando a carteira…' : busy === 'submitting' ? 'Enviando o pedido…' : stale ? 'Confirmar novos valores' : 'Enviar pedido'
  return (
    <>
      <div className="flex flex-col gap-1">
        <DialogTitle className="text-[18px] leading-5 font-bold text-text-foreground">Revisar pedido</DialogTitle>
        <DialogDescription className="text-[14px] leading-5 text-text-secondary">
          Confira os itens, a carteira e os valores. A cotação é a da API: se algo mudar antes do envio, você confirma de novo.
        </DialogDescription>
      </div>

      {notice && (
        <p role="alert" className={cn('border px-3 py-2 text-[13px] leading-5', notice.kind === 'stale' ? 'border-text-accent text-text-accent' : 'border-coral text-coral')}>
          {notice.message}
        </p>
      )}

      {quote ? (
        <div className="flex flex-col gap-4">
          <OrderLines quote={quote} items={items} />
          <Totals quote={quote} />
        </div>
      ) : (
        <div role="status" aria-label="Atualizando a cotação" className="flex flex-col gap-3">
          <Skeleton className="h-[70px] w-full rounded-none" />
          <Skeleton className="h-[120px] w-full rounded-none" />
        </div>
      )}

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[13px] leading-5">
        <dt className="text-text-secondary">Carteira</dt>
        <dd className="text-right text-text-foreground">{form.wallet ? `${walletKindLabel(form.wallet)} · ${shortAddress(form.wallet.address)}` : '-'}</dd>
        <dt className="text-text-secondary">Rede</dt>
        <dd className="text-right text-text-foreground">{form.network ? networkLabel(form.network) : '-'}</dd>
        <dt className="text-text-secondary">Conexão</dt>
        <dd className="text-right text-text-foreground">{form.provider ? providerLabel(form.provider) : '-'}</dd>
        <dt className="text-text-secondary">Colecionador</dt>
        <dd className="text-right break-all text-text-foreground">{form.values.displayName} · {form.values.email}</dd>
      </dl>

      <div className="flex flex-col gap-3 sm:flex-row-reverse">
        <button
          type="button"
          aria-disabled={!ready || Boolean(busy)}
          onClick={() => ready && !busy && onSubmit()}
          className={cn(PRIMARY, 'sm:flex-1', (!ready || busy) && 'cursor-not-allowed opacity-60')}
        >
          {label}
        </button>
        {notice?.kind === 'conflict' ? (
          <Link to="/cart" className={cn(SECONDARY, 'sm:flex-1')}>
            Voltar ao carrinho
          </Link>
        ) : (
          <button type="button" aria-disabled={Boolean(busy)} onClick={() => !busy && onClose()} className={cn(SECONDARY, 'sm:flex-1')}>
            Voltar e editar
          </button>
        )}
      </div>
    </>
  )
}

/** Envio sem resposta: o pedido pode existir. Repetir o envio usa a mesma chave e devolve o mesmo pedido (§3). */
function Recovery({ busy, notice, onSubmit, onClose }: { busy: Busy; notice: Notice | null; onSubmit: () => void; onClose: () => void }) {
  return (
    <>
      <div className="flex flex-col gap-1">
        <DialogTitle className="text-[18px] leading-5 font-bold text-text-foreground">Confirmar o envio do pedido</DialogTitle>
        <DialogDescription className="text-[14px] leading-5 text-text-secondary">
          Não recebemos a resposta do servidor sobre o seu último envio. Verifique o pedido: se ele já existir, você acompanha o mesmo pedido, sem cobrança em duplicidade.
        </DialogDescription>
      </div>
      {notice && (
        <p role="alert" className="border border-coral px-3 py-2 text-[13px] leading-5 text-coral">
          {notice.message}
        </p>
      )}
      <div className="flex flex-col gap-3 sm:flex-row-reverse">
        <button type="button" aria-disabled={Boolean(busy)} onClick={() => !busy && onSubmit()} className={cn(PRIMARY, 'sm:flex-1', busy && 'cursor-not-allowed opacity-60')}>
          {busy ? 'Verificando o pedido…' : 'Verificar pedido'}
        </button>
        <button type="button" aria-disabled={Boolean(busy)} onClick={() => !busy && onClose()} className={cn(SECONDARY, 'sm:flex-1')}>
          Agora não
        </button>
      </div>
    </>
  )
}

/** Pedido já criado: pendente (aguarda a simulação), recusado ou confirmado (segue para o recibo). */
function OrderProgress({
  userId,
  orderId,
  order,
  onRetry,
}: {
  userId: string
  orderId: string
  order: ReturnType<typeof useOrder>
  onRetry: () => void
}) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const status = order.data?.status

  useEffect(() => {
    if (status !== 'confirmed') return
    // Sucesso: a tentativa acabou. O servidor já tirou do carrinho só o que foi comprado.
    clearActiveOrder(userId)
    clearDraft(userId)
    void queryClient.invalidateQueries({ queryKey: ['cart'] })
    void navigate({ to: '/order/$orderId', params: { orderId }, replace: true })
  }, [status, userId, orderId, navigate, queryClient])

  const gone = order.error instanceof ApiRequestError && (order.error.status === 404 || order.error.status === 403)
  useEffect(() => {
    if (!gone) return
    // Pedido que não existe (ou não é deste usuário) não pode prender o checkout.
    clearActiveOrder(userId)
    void navigate({ to: '/checkout', search: {}, replace: true })
  }, [gone, userId, navigate])

  if (order.isError && !order.data) {
    return (
      <div role="alert" className="flex flex-col gap-4">
        <DialogTitle className="text-[18px] font-bold text-text-foreground">Não foi possível abrir o pedido</DialogTitle>
        <DialogDescription className="text-[14px] leading-5 text-text-secondary">Verifique a conexão. O pedido continua sendo processado.</DialogDescription>
        <button type="button" onClick={() => void order.refetch()} className={PRIMARY}>
          Tentar novamente
        </button>
      </div>
    )
  }

  if (!order.data) return <Skeleton className="h-[120px] w-full" />

  if (order.data.status === 'rejected') {
    return (
      <div className="flex flex-col gap-4">
        <DialogTitle className="text-[18px] font-bold text-coral">Pagamento recusado</DialogTitle>
        <DialogDescription role="alert" className="text-[14px] leading-5 text-text-secondary">
          {order.data.rejectionReason ?? 'A simulação recusou o pagamento.'} Nada foi cobrado e seus itens continuam no carrinho.
        </DialogDescription>
        <div className="flex flex-col gap-3 sm:flex-row-reverse">
          <button type="button" onClick={onRetry} className={cn(PRIMARY, 'sm:flex-1')}>
            Tentar novamente
          </button>
          <Link to="/cart" className={cn(SECONDARY, 'sm:flex-1')}>
            Voltar ao carrinho
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div role="status" className="flex flex-col gap-4">
      <DialogTitle className="text-[18px] font-bold text-text-foreground">Aguardando a confirmação do pagamento</DialogTitle>
      <DialogDescription className="text-[14px] leading-5 text-text-secondary">
        Pedido {order.data.id} no valor de {withEthUnit(order.data.totalEth)}. Você pode atualizar a página: o pedido continua sendo acompanhado e não será duplicado.
      </DialogDescription>
      <div aria-hidden="true" className="size-6 animate-spin rounded-full border-2 border-line-soft border-t-brand motion-reduce:animate-none" />
    </div>
  )
}
