import { db, persist, type OrderRecord } from './db'
import { findEdition, getCart, touch } from './cart'
import { mutateNft } from './nftState'

/** Pedido decidido pela simulação em ~2,5 s; cenário `payment-slow` estica para ~20 s (reconexão, refresh). */
export const SETTLE_MS = 2500
export const SETTLE_SLOW_MS = 20_000

type Listener = (order: OrderRecord) => void
const listeners = new Set<Listener>()

/** Socket.IO se inscreve aqui para emitir `order.updated` quando um pedido termina. */
export function onOrderSettled(listener: Listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const hex = (bytes: number) =>
  [...crypto.getRandomValues(new Uint8Array(bytes))].map((b) => b.toString(16).padStart(2, '0')).join('')

/** Efeitos da confirmação: tira do carrinho só o comprado, baixa o estoque e notifica o catálogo. */
function applyConfirmation(order: OrderRecord) {
  const cart = getCart(order.userId)
  for (const bought of order.purchased) {
    const line = cart.items.find((i) => i.nftId === bought.nftId && i.editionId === bought.editionId)
    if (line) {
      line.quantity -= bought.quantity
      if (line.quantity <= 0) cart.items = cart.items.filter((i) => i.id !== line.id)
    }
    const found = findEdition(bought.nftId, bought.editionId)
    // Edição aberta (estoque nulo) não esgota; limitadas baixam.
    if (found && found.edition.available !== null) {
      mutateNft(bought.nftId, { [bought.editionId]: { available: Math.max(0, found.edition.available - bought.quantity) } })
    }
  }
  if (cart.items.length === 0) cart.couponCode = null
  touch(cart)
}

/** Fecha um pedido pendente. Estados terminais nunca mudam (§7): chamar de novo não faz nada. */
export function settle(orderId: string): OrderRecord | null {
  const order = db.orders.find((o) => o.id === orderId)
  if (!order || order.status !== 'pending') return null
  const now = new Date().toISOString()

  if (order.outcome === 'confirmed') {
    order.status = 'confirmed'
    order.txHash = `0x${hex(32)}`
    order.explorerUrl = `https://explorer.kurio.test/tx/${order.txHash}`
    applyConfirmation(order)
  } else {
    order.status = 'rejected'
    order.rejectionReason = 'Pagamento recusado pela rede simulada.'
  }
  order.version += 1
  order.updatedAt = now
  order.settledAt = now
  persist()
  listeners.forEach((l) => l(order))
  return order
}

const timers = new Map<string, ReturnType<typeof setTimeout>>()

export function scheduleSettlement(order: OrderRecord) {
  clearTimeout(timers.get(order.id))
  const wait = Math.max(0, Date.parse(order.settleAt) - Date.now())
  timers.set(
    order.id,
    setTimeout(() => {
      timers.delete(order.id)
      settle(order.id)
    }, wait),
  )
}

/** Leitura preguiçosa: se o prazo passou (aba dormiu, refresh), fecha na hora da consulta. */
export function settleIfDue(order: OrderRecord) {
  if (order.status === 'pending' && Date.parse(order.settleAt) <= Date.now()) settle(order.id)
}

/** Ao carregar o mock: pedidos pendentes de antes do refresh vencem na hora ou voltam a ter timer. */
export function resumeSettlements() {
  for (const order of db.orders) {
    if (order.status !== 'pending') continue
    if (Date.parse(order.settleAt) <= Date.now()) settle(order.id)
    else scheduleSettlement(order)
  }
}

/** O que sai na API: o pedido sem os campos internos do servidor. */
export function publicOrder(order: OrderRecord) {
  const { userId, settleAt, outcome, purchased, ...rest } = order
  void userId
  void settleAt
  void outcome
  void purchased
  return rest
}
