import { type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react'
import selectArrow from '@/assets/icons/pay-select-arrow.svg'
import { cn } from '@/lib/utils'

const CONTROL =
  'h-10 w-full rounded-[3px] border bg-transparent px-3 text-[14px] leading-[15px] text-text-foreground placeholder:text-brand-secondary disabled:opacity-50'

type ShellProps = {
  id: string
  label: string
  required?: boolean
  error?: string
  /** O Figma deixa alguns campos só com o placeholder: o rótulo continua associado, porém oculto. */
  hideLabel?: boolean
  /** O Figma dá 29 px à linha do rótulo (por causa do asterisco); só o campo de texto longo usa 15 px. */
  shortLabel?: boolean
  children: ReactNode
  className?: string
}

function Shell({ id, label, required, error, hideLabel, shortLabel, children, className }: ShellProps) {
  return (
    <div className={cn('flex flex-col', className)}>
      <label htmlFor={id} className={cn('flex items-center text-[15px] leading-[15px] text-text-foreground', !shortLabel && 'min-h-[29px]', hideLabel && 'sr-only')}>
        {label}
        {required && (
          <span aria-hidden="true" className="ml-1 text-[22px] leading-[29px] text-coral">
            *
          </span>
        )}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-[13px] leading-4 text-coral">
          {error}
        </p>
      )}
    </div>
  )
}

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'name'> & {
  name: string
  label: string
  error?: string
  hideLabel?: boolean
}

export function CheckoutInput({ name, label, error, hideLabel, className, required, ...props }: InputProps) {
  const id = `checkout-${name}`
  return (
    <Shell id={id} label={label} required={required} error={error} hideLabel={hideLabel} className={className}>
      <input
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-required={required || undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(CONTROL, error ? 'border-coral' : 'border-line focus:border-brand')}
        {...props}
      />
    </Shell>
  )
}

type AreaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id' | 'name'> & { name: string; label: string; error?: string }

export function CheckoutTextarea({ name, label, error, className, ...props }: AreaProps) {
  const id = `checkout-${name}`
  return (
    <Shell id={id} label={label} error={error} shortLabel className={cn('gap-3', className)}>
      <textarea
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(CONTROL, 'h-[152px] resize-none py-3', error ? 'border-coral' : 'border-line focus:border-brand')}
        {...props}
      />
    </Shell>
  )
}

type SelectProps = {
  name: string
  label: string
  required?: boolean
  error?: string
  value: string
  placeholder: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
  className?: string
  /** Largura do seletor de sufixo (".eth"), que não ocupa a coluna toda. */
  compact?: boolean
}

/** `<select>` nativo com a seta do Figma: teclado, leitor de tela e seletor do sistema no mobile sem custo extra. */
export function CheckoutSelect({ name, label, required, error, value, placeholder, options, onChange, className, compact }: SelectProps) {
  const id = `checkout-${name}`
  return (
    <Shell id={id} label={label} required={required} error={error} className={className}>
      <div className={cn('relative', compact && 'w-[78px]')}>
        <select
          id={id}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-required={required || undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(CONTROL, compact ? 'pr-7 pl-[10px]' : 'pr-9', 'appearance-none', !value && 'text-brand-secondary', error ? 'border-coral' : 'border-line focus:border-brand')}
        >
          {!compact && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((o) => (
            <option key={o.value} value={o.value} className="bg-surface-card text-text-foreground">
              {o.label}
            </option>
          ))}
        </select>
        <img src={selectArrow} alt="" width={18} height={18} aria-hidden="true" className="pointer-events-none absolute top-1/2 right-2 block -translate-y-1/2" />
      </div>
    </Shell>
  )
}
