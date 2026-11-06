import { createFileRoute } from '@tanstack/react-router'
import { requireSession } from '@/auth/guard'
import { WalletsPage } from '@/features/account/WalletsPage'

export const Route = createFileRoute('/wallets')({
  beforeLoad: ({ context, location }) => requireSession(context.queryClient, location.href),
  component: WalletsPage,
})
