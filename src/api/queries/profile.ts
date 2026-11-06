import { queryOptions, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { http } from '../client'
import {
  endpoints,
  profileSchema,
  type ChangePasswordRequest,
  type Profile,
  type Session,
  type UpdateProfileRequest,
} from '../contracts'
import { sessionKeys, useSession } from './session'

/** Chave com o usuário: o perfil de um usuário nunca aparece para outro no mesmo navegador (§4). */
export const profileKeys = { detail: (userId: string) => ['profile', userId] as const }

export const profileOptions = (userId: string) =>
  queryOptions({
    queryKey: profileKeys.detail(userId),
    queryFn: async ({ signal }) => {
      const { data } = await http.get(endpoints.profile, { signal })
      return profileSchema.parse(data)
    },
  })

export function useProfile() {
  const { user } = useSession()
  return useQuery({ ...profileOptions(user?.id ?? ''), enabled: Boolean(user) })
}

/** O Header e o resto do app leem nome e avatar da sessão: grava o que a API devolveu nos dois caches. */
function storeProfile(queryClient: QueryClient, profile: Profile) {
  queryClient.setQueryData(profileKeys.detail(profile.id), profile)
  queryClient.setQueryData<Session | null>(sessionKeys.current, (session) =>
    session ? { ...session, user: { ...session.user, name: profile.name, email: profile.email, avatarUrl: profile.avatarUrl } } : session,
  )
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdateProfileRequest) => {
      const { data } = await http.patch(endpoints.profile, input)
      return profileSchema.parse(data)
    },
    onSuccess: (profile) => storeProfile(queryClient, profile),
  })
}

export function useUploadAvatar() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append('file', file)
      const { data } = await http.put(endpoints.profileAvatar, form)
      return profileSchema.parse(data)
    },
    onSuccess: (profile) => storeProfile(queryClient, profile),
  })
}

export function useRemoveAvatar() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await http.delete(endpoints.profileAvatar)
      return profileSchema.parse(data)
    },
    onSuccess: (profile) => storeProfile(queryClient, profile),
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (input: ChangePasswordRequest) => {
      await http.put(endpoints.profilePassword, input)
    },
  })
}
