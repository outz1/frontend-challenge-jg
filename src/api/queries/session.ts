import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http, ApiRequestError } from '../client'
import {
  authResponseSchema,
  endpoints,
  sessionSchema,
  type LoginRequest,
  type Session,
  type SignupRequest,
} from '../contracts'
import { clearToken, getGuestId, getToken, setToken } from '@/auth/token'

export const sessionKeys = { current: ['session'] as const }

/**
 * Sessão atual, ou `null` para visitante. Token ausente nem chama a API.
 * Sessão expirada ou inválida vira `null` (o token é descartado pelo interceptor).
 */
export const sessionOptions = () =>
  queryOptions({
    queryKey: sessionKeys.current,
    queryFn: async ({ signal }): Promise<Session | null> => {
      if (!getToken()) return null
      try {
        const { data } = await http.get(endpoints.session, { signal })
        return sessionSchema.parse(data)
      } catch (error) {
        if (error instanceof ApiRequestError && (error.code === 'session_expired' || error.code === 'unauthenticated')) {
          clearToken()
          return null
        }
        throw error
      }
    },
    staleTime: 60_000,
  })

export function useSession() {
  const { data, isPending } = useQuery(sessionOptions())
  return { session: data ?? null, user: data?.user ?? null, isPending }
}

/** Aplica uma sessão nova: guarda o token e descarta todo cache anterior (troca de usuário não vaza dados). */
function useApplyAuth() {
  const queryClient = useQueryClient()
  return (response: { token: string; user: Session['user']; expiresAt: string }) => {
    setToken(response.token)
    queryClient.clear()
    const next: Session = { user: response.user, expiresAt: response.expiresAt }
    queryClient.setQueryData(sessionKeys.current, next)
  }
}

export function useLogin() {
  const apply = useApplyAuth()
  return useMutation({
    mutationFn: async (input: LoginRequest) => {
      const { data } = await http.post(endpoints.login, { ...input, guestCartId: getGuestId() })
      return authResponseSchema.parse(data)
    },
    onSuccess: apply,
  })
}

export function useSignup() {
  const apply = useApplyAuth()
  return useMutation({
    mutationFn: async (input: SignupRequest) => {
      const { data } = await http.post(endpoints.signup, { ...input, guestCartId: getGuestId() })
      return authResponseSchema.parse(data)
    },
    onSuccess: apply,
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      // O logout local é imediato: token e cache privado saem antes da resposta, então fechar a aba no meio
      // não deixa sessão ativa. O servidor é avisado em seguida com o token capturado.
      const token = getToken()
      clearToken()
      queryClient.removeQueries()
      queryClient.setQueryData(sessionKeys.current, null)
      if (!token) return
      try {
        await http.post(endpoints.logout, undefined, { headers: { Authorization: `Bearer ${token}` } })
      } catch {
        // Falha de rede aqui não desfaz o logout local.
      }
    },
  })
}
