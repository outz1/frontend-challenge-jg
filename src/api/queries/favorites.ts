import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { http } from '../client'
import { endpoints, favoritesResponseSchema, type FavoritesResponse } from '../contracts'
import { toast } from '@/components/ui/toast'
import { useSession } from './session'

/** A chave inclui o usuário: dois usuários no mesmo navegador nunca compartilham entrada de cache (§4). */
export const favoriteKeys = {
  all: (userId: string) => ['favorites', userId] as const,
}

export const favoritesOptions = (userId: string) =>
  queryOptions({
    queryKey: favoriteKeys.all(userId),
    queryFn: async ({ signal }) => {
      const { data } = await http.get(endpoints.favorites, { signal })
      return favoritesResponseSchema.parse(data)
    },
  })

type ToggleVars = { nftId: string; favorite: boolean }

/**
 * Favoritar com atualização otimista (§4): a tela muda na hora, a API confirma depois.
 * Em falha, o estado anterior é restaurado e o usuário é avisado; ao final sempre reconcilia com a API.
 */
export function useFavorite(nftId: string) {
  const { user, isPending: sessionPending } = useSession()
  const queryClient = useQueryClient()
  const router = useRouter()
  const userId = user?.id

  const { data } = useQuery({ ...favoritesOptions(userId ?? ''), enabled: Boolean(userId) })
  const isFavorite = data?.nftIds.includes(nftId) ?? false

  const mutation = useMutation({
    mutationFn: async ({ nftId: id, favorite }: ToggleVars) => {
      const { data } = favorite ? await http.put(endpoints.favorite(id)) : await http.delete(endpoints.favorite(id))
      return favoritesResponseSchema.parse(data)
    },
    onMutate: async ({ nftId: id, favorite }) => {
      const key = favoriteKeys.all(userId!)
      // Cancela refetch em andamento para ele não sobrescrever o valor otimista.
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<FavoritesResponse>(key)
      const current = previous?.nftIds ?? []
      queryClient.setQueryData<FavoritesResponse>(key, {
        nftIds: favorite ? [...new Set([...current, id])] : current.filter((x) => x !== id),
      })
      return { previous, key }
    },
    onError: (_error, _vars, context) => {
      if (context) queryClient.setQueryData(context.key, context.previous)
      toast.error('Não foi possível atualizar seus favoritos. A alteração foi desfeita; tente novamente.')
    },
    onSuccess: (_data, { favorite }) => {
      toast.success(favorite ? 'NFT adicionado aos favoritos.' : 'NFT removido dos favoritos.')
    },
    onSettled: () => {
      if (userId) void queryClient.invalidateQueries({ queryKey: favoriteKeys.all(userId) })
    },
  })

  function toggle() {
    // Sessão ainda carregando: não dá para saber se é visitante. Ignora em vez de mandar ao login por engano.
    if (sessionPending) return
    if (!userId) {
      // Visitante: manda ao login e volta para esta tela depois de entrar.
      toast.show('Entre na sua conta para favoritar NFTs.')
      void router.navigate({ to: '/login', search: { redirect: router.state.location.href } })
      return
    }
    if (mutation.isPending) return // clique repetido enquanto a mutation corre
    mutation.mutate({ nftId, favorite: !isFavorite })
  }

  return { isFavorite, toggle, isPending: mutation.isPending, isReady: !sessionPending }
}
