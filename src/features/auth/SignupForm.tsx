import { useState, type FormEvent } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { ApiRequestError } from '@/api/client'
import { signupRequestSchema } from '@/api/contracts'
import { useSignup } from '@/api/queries/session'
import { safeRedirect } from '@/auth/guard'
import { PasswordField, TextField } from './fields'
import { SocialBlock } from './SocialBlock'
import { UNAVAILABLE_NOTICE, fieldErrorsFrom, firstIssues } from './form-utils'

export function SignupForm({ redirect }: { redirect?: string }) {
  const router = useRouter()
  const signup = useSignup()
  const [values, setValues] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  function change(field: keyof typeof values, value: string) {
    setValues((v) => ({ ...v, [field]: value }))
    setErrors((e) => ({ ...e, [field]: '' }))
    setFormError(null)
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (signup.isPending) return
    setNotice(null)
    const parsed = signupRequestSchema.pick({ name: true, email: true, password: true }).safeParse(values)
    const issues = parsed.success ? {} : firstIssues(parsed.error)
    // A confirmação só existe na tela: o contrato recebe uma senha.
    if (values.confirmPassword !== values.password) issues.confirmPassword = 'A confirmação não confere com a senha'
    if (!parsed.success || issues.confirmPassword) {
      setErrors(issues)
      return
    }
    signup.mutate(parsed.data, {
      onSuccess: () => router.history.replace(safeRedirect(redirect) ?? '/'),
      onError: (error) => {
        if (error instanceof ApiRequestError) {
          // Conflito de e-mail e erros de validação da API aparecem no campo correspondente.
          if (error.fieldErrors) setErrors(fieldErrorsFrom(error.fieldErrors))
          else setFormError('Não foi possível criar a conta agora. Tente novamente.')
        } else setFormError('Não foi possível criar a conta agora. Tente novamente.')
      },
    })
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-10 md:gap-0">
      <div className="flex flex-col gap-3 md:px-20 md:pt-6">
        <TextField
          label="Nome de usuário"
          name="name"
          autoComplete="username"
          value={values.name}
          onChange={(e) => change('name', e.target.value)}
          error={errors.name}
        />
        <TextField
          label="E-mail"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="Digite seu e-mail"
          value={values.email}
          onChange={(e) => change('email', e.target.value)}
          error={errors.email}
        />
        <PasswordField
          label="Senha"
          name="password"
          autoComplete="new-password"
          value={values.password}
          onChange={(e) => change('password', e.target.value)}
          error={errors.password}
        />
        <PasswordField
          label="Confirmar senha"
          name="confirmPassword"
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={(e) => change('confirmPassword', e.target.value)}
          error={errors.confirmPassword}
        />
      </div>

      {formError && (
        <p role="alert" className="-mt-6 text-[13px] leading-5 text-coral md:mx-20 md:mt-3">
          {formError}
        </p>
      )}

      <button
        type="submit"
        aria-disabled={signup.isPending}
        className="h-[60px] w-full rounded-[10px] bg-brand text-[16px] leading-4 font-bold text-ink aria-disabled:opacity-70 md:mt-6 md:h-[45px] md:w-[calc(100%-160px)] md:self-center md:rounded-[5px]"
      >
        {signup.isPending ? 'Criando conta…' : (<><span className="md:hidden">Criar perfil</span><span className="max-md:hidden">Criar conta</span></>)}
      </button>

      <SocialBlock onUnavailable={() => setNotice(UNAVAILABLE_NOTICE)} gap="md:gap-4" />
      {/* Região viva sempre presente; sem aviso ela não ocupa espaço. */}
      <p role="status" className={notice ? '-mt-6 text-center text-[13px] leading-4 text-text-secondary md:mt-3' : 'sr-only'}>
        {notice}
      </p>

      <p className="text-center text-[15px] text-text-secondary md:hidden">
        Já tem uma conta?{' '}
        <Link to="/login" search={{ redirect }} replace className="underline underline-offset-4">
          Entre
        </Link>
      </p>
    </form>
  )
}
