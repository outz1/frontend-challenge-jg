import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { AuthScreen } from '@/features/auth/AuthScreen'
import { SignupForm } from '@/features/auth/SignupForm'

const searchSchema = z.object({ redirect: z.string().optional().catch(undefined) })

export const Route = createFileRoute('/signup')({
  validateSearch: searchSchema,
  component: SignupRoute,
})

function SignupRoute() {
  const { redirect } = Route.useSearch()
  return (
    <AuthScreen title="Criar conta" description="Crie sua conta de colecionador na Kurio." redirect={redirect}>
      <SignupForm redirect={redirect} />
    </AuthScreen>
  )
}
