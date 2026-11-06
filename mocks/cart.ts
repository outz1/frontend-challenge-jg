import Big from 'big.js'
import type { Cart, CartItem, Edition } from '../src/api/contracts'
import { authenticate, isError, type Authed } from './auth'
import { db, persist, type CartLine, type CartRecord } from './db'
import { errorResponse } from './network'

/** Menor entre disponibilidade e teto por pedido (mesma regra do cliente, mas a do servidor é a que vale). */
export function maxFor(edition: Edition): number {
  if (edition.available !== null && edition.available <= 0) return 0
  return edition.available === null ? edition.maxPerOrder : Math.min(edition.available, edition.maxPerOrder)
}

export function findEdition(nftId: string, editionId: string) {
  const nft = db.nfts.find((n) => n.id === nftId)
  const edition = nft?.editions.find((e) => e.id === editionId)
  return nft && edition ? { nft, edition } : null
}

export type Owner = { key: string; authed: Authed | null }

/**
 * Dono do carrinho: usuário autenticado (Bearer) ou visitante (`X-Guest-Id`).
 * Token presente e inválido responde 401 (sessão expirada), nunca cai para visitante em silêncio.
 */
export function ownerOf(request: Request): Owner | Response {
  if (request.headers.get('Authorization')) {
    const auth = authenticate(request)
    if (isError(auth)) return auth
    return { key: auth.user.id, authed: auth }
  }
  const guest = request.headers.get('X-Guest-Id')
  if (!guest) return errorResponse('unauthenticated', 'Identificação do carrinho ausente.')
  return { key: `guest:${guest}`, authed: null }
}

export function getCart(key: string): CartRecord {
  return (db.carts[key] ??= { items: [], couponCode: null, version: 0, updatedAt: new Date().toISOString() })
}

/** Toda mudança passa por aqui: sobe a versão, carimba a data e persiste. */
export function touch(cart: CartRecord) {
  cart.version += 1
  cart.updatedAt = new Date().toISOString()
  persist()
}

/** Resposta do contrato: preços e disponibilidade são lidos do estado atual do catálogo (refletem nft.updated). */
export function toCartResponse(cart: CartRecord): Cart {
  const items: CartItem[] = []
  for (const line of cart.items) {
    const found = findEdition(line.nftId, line.editionId)
    if (!found) continue
    items.push({
      id: line.id,
      nftId: line.nftId,
      editionId: line.editionId,
      title: found.nft.title,
      editionLabel: found.edition.label,
      image: found.nft.image,
      quantity: line.quantity,
      unitPriceEth: found.edition.priceEth,
      available: found.edition.available,
      maxPerOrder: found.edition.maxPerOrder,
    })
  }
  return { items, couponCode: cart.couponCode, version: cart.version, updatedAt: cart.updatedAt }
}

/** Funde o carrinho de visitante no do usuário ao entrar: soma quantidades, limitado pela disponibilidade. */
export function mergeGuestCart(guestId: string | undefined, userId: string) {
  if (!guestId) return
  const guestKey = `guest:${guestId}`
  const guest = db.carts[guestKey]
  if (!guest || guest.items.length === 0) return
  const target = getCart(userId)
  for (const line of guest.items) {
    const found = findEdition(line.nftId, line.editionId)
    if (!found) continue
    const limit = maxFor(found.edition)
    const existing = target.items.find((i) => i.nftId === line.nftId && i.editionId === line.editionId)
    if (existing) existing.quantity = Math.min(existing.quantity + line.quantity, Math.max(limit, 1))
    else if (limit > 0) target.items.push({ ...line, id: `item-${crypto.randomUUID().slice(0, 8)}`, quantity: Math.min(line.quantity, limit) })
  }
  target.couponCode ??= guest.couponCode
  delete db.carts[guestKey]
  touch(target)
}

export function conflictResponse(edition: Edition, requested: number) {
  const max = maxFor(edition)
  return errorResponse(
    'availability_conflict',
    max === 0
      ? 'Esta edição está esgotada.'
      : `Só é possível comprar até ${max} ${max === 1 ? 'unidade' : 'unidades'} desta edição.`,
    { details: { available: edition.available, limit: edition.maxPerOrder, max, requested } },
  )
}

export type { CartLine }

/** Texto ETH normalizado: sem zeros à direita, mas sempre com ao menos 2 casas. */
export function eth(value: Big): string {
  const fixed = value.round(8, Big.roundHalfUp).toFixed(8).replace(/0+$/, '')
  const [int, dec = ''] = fixed.split('.')
  return `${int}.${dec.padEnd(2, '0')}`
}
