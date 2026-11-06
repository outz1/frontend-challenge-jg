import { useState, type FormEvent } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { ApiRequestError } from '@/api/client'
import { loginRequestSchema } from '@/api/contracts'
import { useLogin } from '@/api/queries/session'
import { safeRedirect } from '@/auth/guard'
import { PasswordField, TextField } from './fields'
import { SocialBlock } from './SocialBlock'
import { UNAVAILABLE_NOTICE, fieldErrorsFrom, firstIssues } from './form-utils'

type Props = { redirect?: string; reason?: 'expired' }

export function LoginForm({ redirect, reason }: Props) {
  const router = useRouter()
  const login = useLogin()
  const [values, setValues] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  function change(field: 'email' | 'password', value: string) {
    setValues((v) => ({ ...v, [field]: value }))
    setErrors((e) => ({ ...e, [field]: '' }))
    setFormError(null)
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (login.isPending) return // clique repetido não cria segunda requisição
    setNotice(null)
    const parsed = loginRequestSchema.pick({ email: true, password: true }).safeParse(values)
    if (!parsed.success) {
      setErrors(firstIssues(parsed.error))
      return
    }
    login.mutate(parsed.data, {
      onSuccess: () => router.history.replace(safeRedirect(redirect) ?? '/'),
      onError: (error) => {
        if (error instanceof ApiRequestError) {
          if (error.fieldErrors) setErrors(fieldErrorsFrom(error.fieldErrors))
          setFormError(
            error.code === 'invalid_credentials' || error.code === 'validation_error'
              ? error.message
              : 'Não foi possível entrar agora. Tente novamente.',
          )
        } else setFormError('Não foi possível entrar agora. Tente novamente.')
      },
    })
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-10">
      {reason === 'expired' && (
        <p role="status" className="rounded-[10px] border border-line-soft px-4 py-3 text-[13px] leading-5 text-text-accent">
          Sua sessão expirou. Entre novamente para continuar de onde parou.
        </p>
      )}
      <div className="flex flex-col gap-3">
        <TextField
          label="E-mail"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="contato@email.com"
          value={values.email}
          onChange={(e) => change('email', e.target.value)}
          error={errors.email}
        />
        <PasswordField
          label="Senha"
          name="password"
          autoComplete="current-password"
          value={values.password}
          onChange={(e) => change('password', e.target.value)}
          error={errors.password}
        />
        <div className="flex justify-end">
          <button type="button" onClick={() => setNotice(UNAVAILABLE_NOTICE)} className="text-[14px] leading-4 text-text-accent">
            Esqueceu a senha?
          </button>
        </div>
      </div>

      {formError && (
        <p role="alert" className="-mt-6 text-[13px] leading-5 text-coral">
          {formError}
        </p>
      )}

      <button
        type="submit"
        aria-disabled={login.isPending}
        className="h-[60px] w-full rounded-[10px] bg-brand text-[16px] leading-4 font-bold text-ink aria-disabled:opacity-70"
      >
        {login.isPending ? 'Entrando…' : 'Entrar'}
      </button>

      <SocialBlock onUnavailable={() => setNotice(UNAVAILABLE_NOTICE)} />
      {/* Região viva sempre presente; sem aviso ela não ocupa espaço. */}
      <p role="status" className={notice ? '-mt-6 text-center text-[13px] leading-4 text-text-secondary' : 'sr-only'}>
        {notice}
      </p>

      <p className="text-center text-[15px] text-text-secondary">
        Novo na Kurio?{' '}
        <Link to="/signup" search={{ redirect }} replace className="underline underline-offset-4">
          Crie uma conta
        </Link>
      </p>
    </form>
  )
}
