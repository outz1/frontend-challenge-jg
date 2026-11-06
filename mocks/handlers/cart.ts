import { http, HttpResponse } from 'msw'
import {
  API_BASE,
  addCartItemRequestSchema,
  couponRequestSchema,
  endpoints,
  routePatterns,
  updateCartItemRequestSchema,
} from '../../src/api/contracts'
import { conflictResponse, findEdition, getCart, maxFor, ownerOf, toCartResponse, touch } from '../cart'
import { findCoupon } from '../fixtures/coupons'
import { applyNetwork, errorResponse } from '../network'

function validation(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  const fieldErrors: Record<string, string[]> = {}
  for (const issue of error.issues) (fieldErrors[String(issue.path[0] ?? 'form')] ??= []).push(issue.message)
  return errorResponse('validation_error', 'Revise os campos informados.', { fieldErrors })
}

export const cartHandlers = [
  http.get(`${API_BASE}${endpoints.cart}`, async ({ request }) => {
    const failure = await applyNetwork(request)
    if (failure) return failure
    const owner = ownerOf(request)
    if (owner instanceof Response) return owner
    return HttpResponse.json(toCartResponse(getCart(owner.key)))
  }),

  http.post(`${API_BASE}${endpoints.cartItems}`, async ({ request }) => {
    const failure = await applyNetwork(request)
    if (failure) return failure
    const owner = ownerOf(request)
    if (owner instanceof Response) return owner
    const parsed = addCartItemRequestSchema.safeParse(await request.json().catch(() => ({})))
    if (!parsed.success) return validation(parsed.error)
    const found = findEdition(parsed.data.nftId, parsed.data.editionId)
    if (!found) return errorResponse('not_found', 'NFT ou edição não encontrados.')

    const cart = getCart(owner.key)
    const existing = cart.items.find((i) => i.nftId === parsed.data.nftId && i.editionId === parsed.data.editionId)
    const total = (existing?.quantity ?? 0) + parsed.data.quantity
    // O servidor decide o limite: a UI pode estar com disponibilidade desatualizada.
    if (total > maxFor(found.edition)) return conflictResponse(found.edition, total)

    if (existing) existing.quantity = total
    else cart.items.push({ id: `item-${crypto.randomUUID().slice(0, 8)}`, ...parsed.data })
    touch(cart)
    return HttpResponse.json(toCartResponse(cart))
  }),

  http.patch(`${API_BASE}${routePatterns.cartItem}`, async ({ request, params }) => {
    const failure = await applyNetwork(request)
    if (failure) return failure
    const owner = ownerOf(request)
    if (owner instanceof Response) return owner
    const parsed = updateCartItemRequestSchema.safeParse(await request.json().catch(() => ({})))
    if (!parsed.success) return validation(parsed.error)
    const cart = getCart(owner.key)
    const line = cart.items.find((i) => i.id === params.itemId)
    if (!line) return errorResponse('not_found', 'Item não encontrado no carrinho.')
    const found = findEdition(line.nftId, line.editionId)
    if (found && parsed.data.quantity > maxFor(found.edition)) return conflictResponse(found.edition, parsed.data.quantity)
    line.quantity = parsed.data.quantity
    touch(cart)
    return HttpResponse.json(toCartResponse(cart))
  }),

  http.delete(`${API_BASE}${routePatterns.cartItem}`, async ({ request, params }) => {
    const failure = await applyNetwork(request)
    if (failure) return failure
    const owner = ownerOf(request)
    if (owner instanceof Response) return owner
    const cart = getCart(owner.key)
    if (!cart.items.some((i) => i.id === params.itemId)) return errorResponse('not_found', 'Item não encontrado no carrinho.')
    cart.items = cart.items.filter((i) => i.id !== params.itemId)
    if (cart.items.length === 0) cart.couponCode = null
    touch(cart)
    return HttpResponse.json(toCartResponse(cart))
  }),

  http.put(`${API_BASE}${endpoints.cartCoupon}`, async ({ request }) => {
    const failure = await applyNetwork(request)
    if (failure) return failure
    const owner = ownerOf(request)
    if (owner instanceof Response) return owner
    const parsed = couponRequestSchema.safeParse(await request.json().catch(() => ({})))
    if (!parsed.success) return validation(parsed.error)
    const coupon = findCoupon(parsed.data.code)
    if (!coupon) return errorResponse('coupon_invalid', 'Cupom inválido.', { fieldErrors: { code: ['Cupom inválido.'] } })
    if (coupon.expired) return errorResponse('coupon_expired', 'Este cupom expirou.', { fieldErrors: { code: ['Este cupom expirou.'] } })
    const cart = getCart(owner.key)
    cart.couponCode = coupon.code
    touch(cart)
    return HttpResponse.json(toCartResponse(cart))
  }),

  http.delete(`${API_BASE}${endpoints.cartCoupon}`, async ({ request }) => {
    const failure = await applyNetwork(request)
    if (failure) return failure
    const owner = ownerOf(request)
    if (owner instanceof Response) return owner
    const cart = getCart(owner.key)
    cart.couponCode = null
    touch(cart)
    return HttpResponse.json(toCartResponse(cart))
  }),
]
