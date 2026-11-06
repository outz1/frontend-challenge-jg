import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { AuthScreen } from '@/features/auth/AuthScreen'
import { LoginForm } from '@/features/auth/LoginForm'

const searchSchema = z.object({
  redirect: z.string().optional().catch(undefined),
  reason: z.literal('expired').optional().catch(undefined),
})

export const Route = createFileRoute('/login')({
  validateSearch: searchSchema,
  component: LoginRoute,
})

function LoginRoute() {
  const { redirect, reason } = Route.useSearch()
  return (
    <AuthScreen title="Entrar" description="Entre na sua conta para favoritar, comprar e gerenciar seu perfil." redirect={redirect}>
      <LoginForm redirect={redirect} reason={reason} />
    </AuthScreen>
  )
}
