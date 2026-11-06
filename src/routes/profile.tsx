import { createFileRoute } from '@tanstack/react-router'
import { requireSession } from '@/auth/guard'
import { ProfilePage } from '@/features/account/ProfilePage'

export const Route = createFileRoute('/profile')({
  // Perfil exige sessão; o login devolve para cá guardando o contexto (§3).
  beforeLoad: ({ context, location }) => requireSession(context.queryClient, location.href),
  component: ProfilePage,
})
