import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ApiRequestError } from '@/api/client'
import { quoteSchema, type Quote } from '@/api/contracts'
import { useCreateOrder } from '@/api/queries/orders'
import { useConnectWallet } from '@/api/queries/wallets'
import { withEthUnit } from '@/lib/eth'
import { clearAttempt, loadAttempt, saveActiveOrder, saveAttempt, type Attempt } from './storage'
import type { CheckoutForm } from './useCheckoutForm'

export type Notice = { kind: 'stale' | 'conflict' | 'wallet' | 'network' | 'error'; message: string }
export type Busy = 'connecting' | 'submitting' | null

type Params = {
  userId: string
  form: CheckoutForm
  quote: Quote | undefined
  /** Chamado quando a API aceita o pedido (novo ou o mesmo, em reenvio idempotente). */
  onCreated: (orderId: string) => void
}

/**
 * Envio do pedido: conecta a carteira se preciso, cria o pedido com chave de idempotência e traduz as falhas em
 * avisos. Preço, estoque, cupom e taxa mudando exigem nova confirmação (`quote_stale`), nunca um pedido silencioso.
 */
export function useCheckoutOrder({ userId, form, quote, onCreated }: Params) {
  const queryClient = useQueryClient()
  const connect = useConnectWallet()
  const create = useCreateOrder()
  const [busy, setBusy] = useState<Busy>(null)
  const [notice, setNotice] = useState<Notice | null>(null)
  // Há uma tentativa guardada sem resposta (ex.: refresh no meio do envio): a tela só deixa recuperar o mesmo pedido.
  const [recovering, setRecovering] = useState(() => loadAttempt(userId) !== null)
  // Trava síncrona: dois cliques no mesmo tick nunca disparam dois envios.
  const inFlight = useRef(false)

  async function submit() {
    if (inFlight.current) return
    // Tentativa não resolvida (timeout ou queda de rede): reenvia exatamente a mesma, sem refazer cotação nem dados.
    let attempt: Attempt | null = loadAttempt(userId)
    if (!attempt) {
      if (!quote) return
      const valid = form.validate()
      if (!valid || !form.wallet) return
      inFlight.current = true
      setNotice(null)
      try {
        const { connection } = form.wallet
        const connected = connection.status === 'connected' && connection.network === valid.network && connection.provider === valid.provider
        if (!connected) {
          setBusy('connecting')
          try {
            await connect.mutateAsync({ walletId: valid.walletId, network: valid.network, provider: valid.provider })
          } catch (error) {
            setNotice(
              error instanceof ApiRequestError && error.code === 'wallet_rejected'
                ? { kind: 'wallet', message: 'A conexão foi recusada na carteira. Tente novamente para continuar.' }
                : failure(error),
            )
            return
          }
        }
        attempt = { key: crypto.randomUUID(), request: { quoteId: quote.id, walletId: valid.walletId, network: valid.network, collector: valid.collector } }
        saveAttempt(userId, attempt)
      } finally {
        inFlight.current = false
        setBusy(null)
      }
    }
    await send(attempt, quote)
  }

  async function send(attempt: Attempt, shown: Quote | undefined) {
    if (inFlight.current) return
    inFlight.current = true
    setNotice(null)
    setBusy('submitting')
    try {
      const order = await create.mutateAsync({ request: attempt.request, idempotencyKey: attempt.key })
      clearAttempt(userId)
      setRecovering(false)
      saveActiveOrder(userId, order.id)
      onCreated(order.id)
    } catch (error) {
      const transient = error instanceof ApiRequestError && error.transient
      // Só queda de rede e timeout mantêm a tentativa: a API pode ter criado o pedido sem a resposta chegar.
      if (transient) setRecovering(true)
      else {
        clearAttempt(userId)
        setRecovering(false)
      }
      setNotice(orderFailure(error, shown))
      if (error instanceof ApiRequestError && (error.code === 'quote_stale' || error.code === 'availability_conflict')) {
        // A cotação e o carrinho mudaram no servidor: refaz os dois para a tela mostrar os valores novos.
        void queryClient.invalidateQueries({ queryKey: ['quote'] })
        void queryClient.invalidateQueries({ queryKey: ['cart'] })
      }
    } finally {
      inFlight.current = false
      setBusy(null)
    }
  }

  return { submit, busy, notice, recovering, clearNotice: () => setNotice(null) }
}

function failure(error: unknown): Notice {
  if (error instanceof ApiRequestError && error.transient) {
    return { kind: 'network', message: 'Sem conexão com o servidor. Verifique a rede e tente novamente.' }
  }
  return { kind: 'error', message: 'Não foi possível concluir agora. Tente novamente.' }
}

function orderFailure(error: unknown, shown: Quote | undefined): Notice {
  if (!(error instanceof ApiRequestError)) return failure(error)
  if (error.code === 'quote_stale') {
    const next = quoteSchema.safeParse(error.details?.quote)
    const total = next.success && next.data.totalEth !== shown?.totalEth ? ` Novo total: ${withEthUnit(next.data.totalEth)}.` : ''
    return { kind: 'stale', message: `Os valores mudaram desde a sua última revisão.${total} Confira o resumo e confirme novamente.` }
  }
  if (error.code === 'availability_conflict') {
    return { kind: 'conflict', message: `${error.message} Volte ao carrinho para ajustar os itens.` }
  }
  if (error.code === 'wallet_not_connected') {
    return { kind: 'wallet', message: 'A carteira não está conectada na rede escolhida. Tente novamente.' }
  }
  if (error.code === 'timeout' || error.code === 'network') {
    // O pedido pode ter sido criado antes da resposta se perder: repetir usa a mesma chave e devolve o mesmo pedido.
    return {
      kind: 'network',
      message: 'Não recebemos a resposta do servidor. Seu pedido não será duplicado: tente novamente e recuperaremos o mesmo pedido.',
    }
  }
  if (error.status === 422 && error.fieldErrors) {
    return { kind: 'error', message: 'Revise os dados informados e tente novamente.' }
  }
  return failure(error)
}
