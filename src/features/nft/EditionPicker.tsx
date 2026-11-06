import { useId } from 'react'
import type { Edition } from '@/api/contracts'
import { cn } from '@/lib/utils'
import { limitFor } from './purchase'

type Props = {
  editions: Edition[]
  value: string
  onChange: (id: string) => void
  className?: string
}

/** Seletor de edição (Figma 70342:2696). Radios nativos: setas do teclado e leitura de grupo de graça. */
export function EditionPicker({ editions, value, onChange, className }: Props) {
  const name = useId()
  return (
    <fieldset className={cn('flex min-w-0 flex-col gap-2 md:gap-3', className)}>
      <legend className="mb-2 text-[15px] leading-4 font-bold text-text-foreground md:mb-3">Edição:</legend>
      <div className="flex flex-wrap items-center gap-3 md:gap-[6px]">
        {editions.map((edition) => {
          const soldOut = limitFor(edition).max === 0
          const selected = edition.id === value
          return (
            <label
              key={edition.id}
              className={cn(
                'flex h-7 min-w-[36px] items-center justify-center rounded-full border px-2 text-[14px] leading-4 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-text-accent',
                selected ? 'border-brand font-medium text-text-accent' : 'border-line-soft text-text-secondary',
                soldOut ? 'cursor-not-allowed line-through opacity-60' : 'cursor-pointer',
              )}
            >
              <input
                type="radio"
                name={name}
                value={edition.id}
                checked={selected}
                disabled={soldOut}
                onChange={() => onChange(edition.id)}
                className="sr-only"
              />
              {edition.label}
              {soldOut && <span className="sr-only"> (esgotada)</span>}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
