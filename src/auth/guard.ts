import { redirect } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { sessionOptions } from '@/api/queries/session'

/** Só caminhos internos: evita redirecionar para um site externo por `?redirect=`. */
export function safeRedirect(target: string | undefined): string | undefined {
  if (!target || !target.startsWith('/') || target.startsWith('//')) return undefined
  return target
}

/** `beforeLoad` de rotas privadas: sem sessão, vai ao login guardando o destino para o retorno. */
export async function requireSession(queryClient: QueryClient, locationHref: string) {
  const session = await queryClient.ensureQueryData(sessionOptions())
  if (!session) throw redirect({ to: '/login', search: { redirect: locationHref } })
  return session
}
