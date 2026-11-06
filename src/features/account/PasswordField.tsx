import { useState, type InputHTMLAttributes } from 'react'
import hideIcon from '@/assets/icons/account-hide.svg'
import { cn } from '@/lib/utils'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'name' | 'type'> & { name: string; label: string; error?: string }

/** Campo de senha com o botão de visibilidade do Figma (Password Input 70504:2973). */
export function PasswordField({ name, label, error, className, ...props }: Props) {
  const [visible, setVisible] = useState(false)
  const id = `account-${name}`
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <label htmlFor={id} className="text-[15px] leading-[15px] text-text-foreground">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            'h-10 w-full rounded-[3px] border bg-transparent pr-11 pl-3 text-[14px] leading-[15px] text-text-foreground',
            error ? 'border-coral' : 'border-line focus:border-brand',
          )}
          {...props}
        />
        <button
          type="button"
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          aria-pressed={visible}
          onClick={() => setVisible((v) => !v)}
          className="absolute top-1/2 right-3 grid size-5 -translate-y-1/2 place-items-center"
        >
          <img src={hideIcon} alt="" width={17} height={14} className={cn('block', visible && 'opacity-60')} />
        </button>
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="-mt-1 text-[13px] leading-4 text-coral">
          {error}
        </p>
      )}
    </div>
  )
}
