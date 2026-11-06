import { useId, useState, type InputHTMLAttributes } from 'react'
import { Eye } from 'lucide-react'
import eyeHide from '@/assets/icons/eye-hide.svg'
import { cn } from '@/lib/utils'

type FieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  /** Rótulo acessível. No layout ele fica oculto (o Figma usa só o placeholder), mas continua associado ao campo. */
  label: string
  error?: string
  hint?: string
}

const INPUT =
  'h-[50px] w-full rounded-[10px] border bg-transparent px-4 text-[14px] leading-4 text-text-foreground placeholder:text-brand-secondary'

export function TextField({ label, error, hint, className, ...props }: FieldProps) {
  const id = useId()
  const messageId = `${id}-msg`
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? messageId : undefined}
        placeholder={props.placeholder ?? label}
        className={cn(INPUT, error ? 'border-coral' : 'border-line focus:border-brand', className)}
        {...props}
      />
      <FieldMessage id={messageId} error={error} hint={hint} />
    </div>
  )
}

export function PasswordField({ label, error, hint, className, ...props }: FieldProps) {
  const id = useId()
  const messageId = `${id}-msg`
  const [visible, setVisible] = useState(false)
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div
        className={cn(
          'flex h-[50px] items-center rounded-[10px] border pr-4',
          error ? 'border-coral' : 'border-line focus-within:border-brand',
          className,
        )}
      >
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? messageId : undefined}
          placeholder={props.placeholder ?? label}
          className="h-full min-w-0 flex-1 rounded-[10px] bg-transparent px-4 text-[14px] leading-4 text-text-foreground placeholder:text-brand-secondary"
          {...props}
        />
        <button
          type="button"
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          aria-pressed={visible}
          onClick={() => setVisible((v) => !v)}
          className="grid size-[18px] shrink-0 place-items-center text-text-secondary"
        >
          {visible ? <Eye size={18} aria-hidden="true" /> : <img src={eyeHide} alt="" width={16} height={14} className="block" />}
        </button>
      </div>
      <FieldMessage id={messageId} error={error} hint={hint} />
    </div>
  )
}

function FieldMessage({ id, error, hint }: { id: string; error?: string; hint?: string }) {
  if (!error && !hint) return null
  return (
    <p id={id} role={error ? 'alert' : undefined} className={cn('px-1 text-[13px] leading-4', error ? 'text-coral' : 'text-text-secondary')}>
      {error ?? hint}
    </p>
  )
}
