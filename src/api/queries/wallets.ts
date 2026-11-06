import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from '../client'
import {
  endpoints,
  walletSchema,
  walletsResponseSchema,
  type CopyPrimaryWalletRequest,
  type CreateWalletRequest,
  type Network,
  type UpdateWalletRequest,
  type Wallet,
  type WalletProvider,
} from '../contracts'
import { useSession } from './session'

/** Chaves com o usuário: carteira de um usuário nunca aparece para outro no mesmo navegador (§4). */
export const walletKeys = { all: (userId: string) => ['wallets', userId] as const }

export const walletsOptions = (userId: string) =>
  queryOptions({
    queryKey: walletKeys.all(userId),
    queryFn: async ({ signal }) => {
      const { data } = await http.get(endpoints.wallets, { signal })
      return walletsResponseSchema.parse(data).items
    },
  })

export function useWallets() {
  const { user } = useSession()
  return useQuery({ ...walletsOptions(user?.id ?? ''), enabled: Boolean(user) })
}

/** Grava a carteira devolvida pela API no cache da lista, sem refazer a consulta. */
function useReplaceWallet() {
  const queryClient = useQueryClient()
  const { user } = useSession()
  return (next: Wallet) =>
    queryClient.setQueryData<Wallet[]>(walletKeys.all(user?.id ?? ''), (list) => list?.map((w) => (w.id === next.id ? next : w)))
}

/** Conexão simulada no servidor (§6): a recusa chega como erro `wallet_rejected`. */
export function useConnectWallet() {
  const replace = useReplaceWallet()
  return useMutation({
    mutationFn: async (input: { walletId: string; network: Network; provider: WalletProvider }) => {
      const { data } = await http.post(endpoints.walletConnect(input.walletId), { network: input.network, provider: input.provider })
      return walletSchema.parse(data)
    },
    onSuccess: replace,
  })
}

export function useDisconnectWallet() {
  const replace = useReplaceWallet()
  return useMutation({
    mutationFn: async (walletId: string) => {
      const { data } = await http.post(endpoints.walletDisconnect(walletId))
      return walletSchema.parse(data)
    },
    onSuccess: replace,
  })
}

/** Acrescenta a carteira nova (ou a cópia da principal) à lista em cache. */
export function useCreateWallet() {
  const queryClient = useQueryClient()
  const { user } = useSession()
  return useMutation({
    mutationFn: async (input: CreateWalletRequest | CopyPrimaryWalletRequest) => {
      const { data } = await http.post(endpoints.wallets, input)
      return walletSchema.parse(data)
    },
    onSuccess: (wallet) =>
      queryClient.setQueryData<Wallet[]>(walletKeys.all(user?.id ?? ''), (list) => [...(list ?? []).filter((w) => w.id !== wallet.id), wallet]),
  })
}

export function useUpdateWallet() {
  const replace = useReplaceWallet()
  return useMutation({
    mutationFn: async ({ walletId, input }: { walletId: string; input: UpdateWalletRequest }) => {
      const { data } = await http.patch(endpoints.wallet(walletId), input)
      return walletSchema.parse(data)
    },
    onSuccess: replace,
  })
}
