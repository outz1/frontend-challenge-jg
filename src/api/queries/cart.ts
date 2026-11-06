import { keepPreviousData, queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http, ApiRequestError } from '../client'
import {
  cartSchema,
  endpoints,
  quoteSchema,
  type AddCartItemRequest,
  type Cart,
  type Network,
} from '../contracts'
import { getGuestId } from '@/auth/token'
import { toast } from '@/components/ui/toast'
import { useSession } from './session'

/** Dono do carrinho: usuário logado, ou o visitante (id local). Entra em toda chave para isolar dados (§4). */
export function useOwnerKey() {
  const { user, isPending } = useSession()
  return { ownerKey: user ? user.id : `guest:${getGuestId()}`, ready: !isPending }
}

export const cartKeys = {
  cart: (owner: string) => ['cart', owner] as const,
  quote: (owner: string, network: Network, cartVersion: number) => ['quote', owner, network, cartVersion] as const,
}

export const cartOptions = (owner: string) =>
  queryOptions({
    queryKey: cartKeys.cart(owner),
    queryFn: async ({ signal }) => {
      const { data } = await http.get(endpoints.cart, { signal })
      return cartSchema.parse(data)
    },
  })

export function useCart() {
  const { ownerKey, ready } = useOwnerKey()
  return useQuery({ ...cartOptions(ownerKey), enabled: ready })
}

/** Selo do Header e da tab bar: total de unidades no carrinho. */
export function useCartCount() {
  const { data } = useCart()
  return data?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0
}

/** Cotação do servidor: a única fonte de subtotal, desconto, taxa e total (§3). Refaz quando a versão do carrinho muda. */
export function useQuote(network: Network) {
  const { ownerKey } = useOwnerKey()
  const cart = useCart()
  const version = cart.data?.version
  return useQuery({
    queryKey: cartKeys.quote(ownerKey, network, version ?? -1),
    queryFn: async ({ signal }) => {
      const { data } = await http.post(endpoints.quotes, { network }, { signal })
      return quoteSchema.parse(data)
    },
    enabled: version !== undefined,
    placeholderData: keepPreviousData,
  })
}

/** Mensagem legível para falhas de carrinho (conflito de disponibilidade, cupom, rede). */
export function cartErrorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    if (error.code === 'availability_conflict' || error.code === 'coupon_invalid' || error.code === 'coupon_expired') {
      return error.message
    }
    if (error.transient) return 'Sem conexão com o servidor. Tente novamente.'
  }
  return 'Não foi possível atualizar o carrinho. Tente novamente.'
}

function useCartMutation<TVars>(run: (vars: TVars) => Promise<unknown>, success?: string) {
  const queryClient = useQueryClient()
  const { ownerKey } = useOwnerKey()
  return useMutation({
    // Mutations do carrinho rodam em série: respostas nunca chegam fora de ordem nem se sobrescrevem.
    scope: { id: 'cart' },
    mutationFn: async (vars: TVars) => cartSchema.parse(await run(vars)),
    onSuccess: (cart: Cart) => {
      // A resposta já é o carrinho novo; grava direto e deixa a cotação refazer pela nova versão.
      queryClient.setQueryData(cartKeys.cart(ownerKey), cart)
      if (success) toast.success(success)
    },
    onError: (error) => {
      toast.error(cartErrorMessage(error))
      // Disponibilidade pode ter mudado no servidor: reconcilia.
      void queryClient.invalidateQueries({ queryKey: cartKeys.cart(ownerKey) })
    },
  })
}

export function useAddToCart() {
  return useCartMutation<AddCartItemRequest>(async (input) => (await http.post(endpoints.cartItems, input)).data)
}

export function useSetQuantity() {
  return useCartMutation<{ itemId: string; quantity: number }>(
    async ({ itemId, quantity }) => (await http.patch(endpoints.cartItem(itemId), { quantity })).data,
  )
}

export function useRemoveItem() {
  return useCartMutation<string>(async (itemId) => (await http.delete(endpoints.cartItem(itemId))).data, 'Item removido do carrinho.')
}

export function useRemoveCoupon() {
  return useCartMutation<void>(async () => (await http.delete(endpoints.cartCoupon)).data, 'Cupom removido.')
}

/** Cupom tem erro de campo (inválido/expirado), então o chamador trata o erro; sem toast automático. */
export function useApplyCoupon() {
  const queryClient = useQueryClient()
  const { ownerKey } = useOwnerKey()
  return useMutation({
    scope: { id: 'cart' },
    mutationFn: async (code: string) => cartSchema.parse((await http.put(endpoints.cartCoupon, { code })).data),
    onSuccess: (cart) => {
      queryClient.setQueryData(cartKeys.cart(ownerKey), cart)
      toast.success('Cupom aplicado.')
    },
  })
}
