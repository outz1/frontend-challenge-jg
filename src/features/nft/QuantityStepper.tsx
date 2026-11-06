import minus from '@/assets/icons/qty-minus.svg'
import plus from '@/assets/icons/qty-plus.svg'
import mMinus from '@/assets/icons/m-qty-minus.svg'
import mPlus from '@/assets/icons/m-qty-plus.svg'
import { cn } from '@/lib/utils'

type Props = {
  value: number
  max: number
  onChange: (next: number) => void
  /** `compact` é o stepper da buy bar mobile (Figma 70410:4179); `cart` é o da tabela do carrinho (Figma 70402:3303). */
  variant?: 'default' | 'compact' | 'cart'
}

/**
 * Botões usam `aria-disabled` (não `disabled`) para o foco não se perder ao chegar no limite.
 * O valor é um `<output>` em região viva, então leitores de tela ouvem a mudança.
 */
export function QuantityStepper({ value, max, onChange, variant = 'default' }: Props) {
  const compact = variant !== 'default'
  const atMin = value <= 1
  const atMax = value >= max
  const button = cn(
    'grid shrink-0 place-items-center border border-ink bg-brand',
    compact
      ? 'h-[30px] w-[20px] rounded-[20px] shadow-[0_4px_6px_rgba(20,13,10,0.15)]'
      : 'h-[49.5px] w-[33px] rounded-[33px] shadow-[0_6.6px_9.9px_rgba(20,13,10,0.15)]',
  )
  const disabled = 'cursor-not-allowed opacity-40'

  return (
    <div role="group" aria-label="Quantidade" className={cn('flex items-center', compact ? 'gap-3' : 'gap-3')}>
      <button
        type="button"
        aria-label="Diminuir quantidade"
        aria-disabled={atMin}
        onClick={() => !atMin && onChange(value - 1)}
        className={cn(button, atMin && disabled)}
      >
        <img src={compact ? mMinus : minus} alt="" className="block" />
      </button>
      <output
        aria-live="polite"
        className={cn('text-center text-text-foreground', variant === 'cart' ? 'min-w-3 text-[17px] leading-6' : compact ? 'min-w-3 text-[18px] leading-[25px] font-medium' : 'min-w-4 text-[20px] leading-7')}
      >
        {value}
      </output>
      <button
        type="button"
        aria-label="Aumentar quantidade"
        aria-disabled={atMax}
        onClick={() => !atMax && onChange(value + 1)}
        className={cn(button, atMax && disabled)}
      >
        <img src={compact ? mPlus : plus} alt="" className="block" />
      </button>
    </div>
  )
}
