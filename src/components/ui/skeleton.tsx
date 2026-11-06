import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

/**
 * Placeholder com shimmer (§8). A animação some com `prefers-reduced-motion` (tokens.css).
 * Sempre receba as dimensões do conteúdo real para não causar layout shift.
 */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-shimmer rounded-[6px] bg-[linear-gradient(90deg,var(--color-surface-card)_25%,var(--color-surface-dark)_50%,var(--color-surface-card)_75%)] bg-[length:200%_100%]',
        className,
      )}
      {...props}
    />
  )
}
