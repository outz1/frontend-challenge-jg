import { createFileRoute } from '@tanstack/react-router'
import { requireSession } from '@/auth/guard'
import { OrderConfirmationPage } from '@/features/checkout/OrderConfirmationPage'

export const Route = createFileRoute('/order/$orderId')({
  beforeLoad: ({ context, location }) => requireSession(context.queryClient, location.href),
  component: OrderConfirmationPage,
})
