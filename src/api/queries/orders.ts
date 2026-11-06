import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from '../client'
import { IDEMPOTENCY_HEADER, endpoints, orderListResponseSchema, orderSchema, type CreateOrderRequest } from '../contracts'
import { useSession } from './session'

/** Chaves com o usuário: pedido de um usuário nunca aparece para outro no mesmo navegador (§4). */
export const orderKeys = {
  all: (userId: string) => ['orders', userId] as const,
  list: (userId: string, page: number) => ['orders', userId, 'list', page] as const,
  detail: (userId: string, id: string) => ['orders', userId, 'detail', id] as const,
}

export const orderOptions = (userId: string, id: string) =>
  queryOptions({
    queryKey: orderKeys.detail(userId, id),
    queryFn: async ({ signal }) => {
      const { data } = await http.get(endpoints.order(id), { signal })
      return orderSchema.parse(data)
    },
  })

export function useOrder(id: string | undefined) {
  const { user } = useSession()
  return useQuery({
    ...orderOptions(user?.id ?? '', id ?? ''),
    enabled: Boolean(user && id),
    // `order.updated` já traz o resultado; a consulta periódica cobre socket fora do ar (§7).
    refetchInterval: (query) => (query.state.data?.status === 'pending' ? 3000 : false),
  })
}

/**
 * Cria o pedido com a chave de idempotência: repetir a mesma chave com o mesmo conteúdo devolve o mesmo pedido,
 * então reenvio após timeout nunca duplica a compra (§3).
 */
export function useCreateOrder() {
  const queryClient = useQueryClient()
  const { user } = useSession()
  return useMutation({
    mutationFn: async ({ request, idempotencyKey }: { request: CreateOrderRequest; idempotencyKey: string }) => {
      const { data } = await http.post(endpoints.orders, request, { headers: { [IDEMPOTENCY_HEADER]: idempotencyKey } })
      return orderSchema.parse(data)
    },
    onSuccess: (order) => {
      if (user) queryClient.setQueryData(orderKeys.detail(user.id, order.id), order)
    },
  })
}

export const orderListOptions = (userId: string, page: number) =>
  queryOptions({
    queryKey: orderKeys.list(userId, page),
    queryFn: async ({ signal }) => {
      const { data } = await http.get(endpoints.orders, { params: { page }, signal })
      return orderListResponseSchema.parse(data)
    },
  })
