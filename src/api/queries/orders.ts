import { queryOptions, useQuery } from '@tanstack/react-query'
import { http } from '../client'
import { endpoints, orderListResponseSchema, orderSchema } from '../contracts'
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
  return useQuery({ ...orderOptions(user?.id ?? '', id ?? ''), enabled: Boolean(user && id) })
}

export const orderListOptions = (userId: string, page: number) =>
  queryOptions({
    queryKey: orderKeys.list(userId, page),
    queryFn: async ({ signal }) => {
      const { data } = await http.get(endpoints.orders, { params: { page }, signal })
      return orderListResponseSchema.parse(data)
    },
  })
