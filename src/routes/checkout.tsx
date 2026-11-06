import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { requireSession } from '@/auth/guard'
import { CheckoutPage } from '@/features/checkout/CheckoutPage'

const searchSchema = z.object({
  /** Pedido em andamento: sobrevive a refresh e permite retomar sem criar outro (§3). */
  order: z.string().optional().catch(undefined),
})

export const Route = createFileRoute('/checkout')({
  validateSearch: searchSchema,
  // Checkout exige sessão; o login devolve para cá guardando o contexto (§3).
  beforeLoad: ({ context, location }) => requireSession(context.queryClient, location.href),
  component: CheckoutPage,
})
