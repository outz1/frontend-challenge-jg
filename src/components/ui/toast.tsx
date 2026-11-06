import { useSyncExternalStore } from 'react'
import { cn } from '@/lib/utils'

type Toast = { id: number; message: string; kind: 'success' | 'error' | 'info' }

let toasts: Toast[] = []
let nextId = 1
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

/** Feedback acessível de mutations e eventos (§8): região viva global, sem dependência de cor (o prefixo diz o tipo). */
export const toast = {
  show(message: string, kind: Toast['kind'] = 'info', ms = 5000) {
    const id = nextId++
    toasts = [...toasts, { id, message, kind }]
    emit()
    setTimeout(() => toast.dismiss(id), ms)
  },
  success: (message: string) => toast.show(message, 'success'),
  error: (message: string) => toast.show(message, 'error', 7000),
  dismiss(id: number) {
    toasts = toasts.filter((t) => t.id !== id)
    emit()
  },
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

const PREFIX: Record<Toast['kind'], string> = { success: 'Sucesso', error: 'Erro', info: 'Aviso' }

export function Toaster() {
  const items = useSyncExternalStore(subscribe, () => toasts, () => toasts)
  return (
    <div
      role="region"
      aria-label="Notificações"
      className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4 md:top-auto md:bottom-6"
    >
      {items.map((item) => (
        <div
          key={item.id}
          role={item.kind === 'error' ? 'alert' : 'status'}
          className={cn(
            'pointer-events-auto flex max-w-[420px] items-start gap-3 rounded-[8px] border bg-surface-card px-4 py-3 text-body text-text-foreground shadow-[0_0_10px_rgba(10,6,4,0.45)]',
            item.kind === 'error' ? 'border-coral' : 'border-line-soft',
          )}
        >
          <p>
            <strong className={cn('font-bold', item.kind === 'error' && 'text-coral')}>{PREFIX[item.kind]}: </strong>
            {item.message}
          </p>
          <button type="button" aria-label="Fechar aviso" onClick={() => toast.dismiss(item.id)} className="text-text-secondary">
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
