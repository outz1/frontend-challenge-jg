import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/login')({
  component: () => (
    <section className="mx-auto max-w-page px-4 py-16">
      <h1 className="text-heading font-bold">Entrar</h1>
    </section>
  ),
})
