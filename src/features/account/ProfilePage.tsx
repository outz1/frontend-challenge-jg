import { useRef, useState, type FormEvent } from 'react'
import { ApiRequestError } from '@/api/client'
import {
  AVATAR_MAX_BYTES,
  AVATAR_TYPES,
  changePasswordRequestSchema,
  updateProfileRequestSchema,
  type Profile,
} from '@/api/contracts'
import { useChangePassword, useProfile, useRemoveAvatar, useUpdateProfile, useUploadAvatar } from '@/api/queries/profile'
import imageIcon from '@/assets/icons/account-image.svg'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/toast'
import { fieldErrorsFrom, firstIssues } from '@/features/auth/form-utils'
import { CheckoutInput, CheckoutSelect } from '@/features/checkout/Field'
import { ENS_SUFFIX } from '@/features/checkout/constants'
import { AccountLayout } from './AccountLayout'
import { PasswordField } from './PasswordField'

const TITLE = 'Perfil do colecionador'
const SAVE_BUTTON = 'flex h-10 w-[131px] items-center justify-center rounded-[3px] bg-brand text-[14px] leading-4 font-bold text-ink'

export function ProfilePage() {
  const profile = useProfile()
  return (
    <AccountLayout title={TITLE}>
      {profile.isPending ? (
        <ProfileSkeleton />
      ) : profile.isError ? (
        <div role="alert" className="flex flex-col items-start gap-4 bg-surface-card px-6 py-8">
          <p className="text-body text-text-secondary">Não foi possível carregar o perfil.</p>
          <button type="button" onClick={() => void profile.refetch()} className="rounded-[6px] bg-brand px-4 py-2 font-bold text-ink">
            Tentar novamente
          </button>
        </div>
      ) : (
        <ProfileForm profile={profile.data} />
      )}
    </AccountLayout>
  )
}

function ProfileSkeleton() {
  return (
    <div role="status" aria-label="Carregando perfil" className="flex flex-col gap-6">
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} aria-hidden="true" className="h-[69px] w-full rounded-none" />
      ))}
    </div>
  )
}

const asText = (v: string | null) => v ?? ''

function ProfileForm({ profile }: { profile: Profile }) {
  const update = useUpdateProfile()
  const uploadAvatar = useUploadAvatar()
  const removeAvatar = useRemoveAvatar()
  const changePassword = useChangePassword()
  const fileInput = useRef<HTMLInputElement>(null)

  const [values, setValues] = useState({
    name: profile.name,
    username: profile.username,
    email: profile.email,
    ensName: asText(profile.ensName),
    walletAlias: asText(profile.walletAlias),
  })
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const setValue = (field: keyof typeof values, value: string) => {
    setValues((v) => ({ ...v, [field]: value }))
    setErrors((e) => (e[field] ? { ...e, [field]: '' } : e))
  }
  const setPassword = (field: keyof typeof passwords, value: string) => {
    setPasswords((v) => ({ ...v, [field]: value }))
    setErrors((e) => (e[field] ? { ...e, [field]: '' } : e))
  }
  const focusFirstError = () => requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
  const busy = update.isPending || changePassword.isPending

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    const changingPassword = Boolean(passwords.currentPassword || passwords.newPassword || passwords.confirmPassword)

    const nextErrors: Record<string, string> = {}
    const parsedProfile = updateProfileRequestSchema.safeParse(values)
    if (!parsedProfile.success) Object.assign(nextErrors, firstIssues(parsedProfile.error))
    const parsedPassword = changePasswordRequestSchema.safeParse(passwords)
    if (changingPassword) {
      if (!parsedPassword.success) Object.assign(nextErrors, firstIssues(parsedPassword.error))
      if (passwords.confirmPassword !== passwords.newPassword) nextErrors.confirmPassword = 'A confirmação não confere com a nova senha'
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0 || !parsedProfile.success) {
      focusFirstError()
      return
    }

    try {
      await update.mutateAsync(parsedProfile.data)
    } catch (error) {
      setErrors(error instanceof ApiRequestError && error.fieldErrors ? fieldErrorsFrom(error.fieldErrors) : {})
      toast.error(error instanceof ApiRequestError ? error.message : 'Não foi possível salvar o perfil.')
      focusFirstError()
      return
    }

    if (!changingPassword || !parsedPassword.success) {
      toast.success('Perfil atualizado.')
      return
    }
    try {
      await changePassword.mutateAsync(parsedPassword.data)
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
      toast.success('Perfil e senha atualizados.')
    } catch (error) {
      setErrors(error instanceof ApiRequestError && error.fieldErrors ? fieldErrorsFrom(error.fieldErrors) : {})
      toast.error(error instanceof ApiRequestError ? `Perfil salvo, mas a senha não mudou: ${error.message}` : 'Perfil salvo, mas a senha não mudou.')
      focusFirstError()
    }
  }

  function onAvatarPicked(file: File | undefined) {
    if (!file) return
    if (!(AVATAR_TYPES as readonly string[]).includes(file.type)) {
      setErrors((e) => ({ ...e, avatar: 'Use uma imagem PNG, JPEG ou WebP' }))
      return
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setErrors((e) => ({ ...e, avatar: 'O arquivo deve ter até 2 MB' }))
      return
    }
    setErrors((e) => ({ ...e, avatar: '' }))
    uploadAvatar.mutate(file, {
      onSuccess: () => toast.success('Avatar atualizado.'),
      onError: (error) => {
        const message = error instanceof ApiRequestError ? (error.fieldErrors?.file?.[0] ?? error.message) : 'Não foi possível enviar o avatar.'
        setErrors((e) => ({ ...e, avatar: message }))
      },
    })
  }

  const avatarBusy = uploadAvatar.isPending || removeAvatar.isPending

  return (
    <form onSubmit={onSubmit} noValidate aria-label={TITLE} className="flex flex-col gap-8">
      <div className="grid gap-x-7 gap-y-6 md:grid-cols-2">
        <CheckoutInput name="name" label="Nome de exibição" required autoComplete="name" value={values.name} onChange={(e) => setValue('name', e.target.value)} error={errors.name} />
        <CheckoutInput name="username" label="Nome de usuário" required autoComplete="username" value={values.username} onChange={(e) => setValue('username', e.target.value)} error={errors.username} />
        <CheckoutInput name="email" type="email" label="E-mail" required autoComplete="email" value={values.email} onChange={(e) => setValue('email', e.target.value)} error={errors.email} />
        <div className="flex gap-[10px]">
          <CheckoutSelect name="ensSuffix" label="Nome ENS" compact placeholder="" value={ENS_SUFFIX} options={[{ value: ENS_SUFFIX, label: ENS_SUFFIX }]} onChange={() => undefined} />
          <CheckoutInput name="ensName" label="Nome ENS (sem o sufixo)" hideLabel className="min-w-0 flex-1 justify-end" value={values.ensName} onChange={(e) => setValue('ensName', e.target.value)} error={errors.ensName} />
        </div>
        <CheckoutInput name="walletAlias" label="Apelido da carteira" required value={values.walletAlias} onChange={(e) => setValue('walletAlias', e.target.value)} error={errors.walletAlias} />

        <div className="flex flex-col gap-[10px]">
          <p className="text-[15px] leading-[15px] text-text-foreground">Avatar</p>
          <div className="flex items-center gap-6">
            <span className="grid size-[50px] shrink-0 place-items-center overflow-hidden rounded-full border border-line bg-[#2f1d15]">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Avatar do colecionador" className="size-full object-cover" />
              ) : (
                <img src={imageIcon} alt="" width={20} height={20} className="block" />
              )}
            </span>
            <div className="flex items-center gap-5">
              <button
                type="button"
                aria-disabled={avatarBusy}
                onClick={() => !avatarBusy && fileInput.current?.click()}
                className="h-10 w-[98px] rounded-[3px] bg-brand text-[14px] leading-4 font-bold text-ink"
              >
                {uploadAvatar.isPending ? 'Enviando…' : 'Alterar'}
              </button>
              <button
                type="button"
                aria-disabled={avatarBusy || !profile.avatarUrl}
                onClick={() => !avatarBusy && profile.avatarUrl && removeAvatar.mutate(undefined, { onSuccess: () => toast.success('Avatar removido.') })}
                className="text-[14px] leading-4 text-text-foreground"
              >
                Remover
              </button>
            </div>
            <input
              ref={fileInput}
              type="file"
              accept={AVATAR_TYPES.join(',')}
              aria-label="Enviar avatar"
              className="sr-only"
              tabIndex={-1}
              onChange={(e) => {
                onAvatarPicked(e.target.files?.[0])
                e.target.value = ''
              }}
            />
          </div>
          {errors.avatar && (
            <p role="alert" className="text-[13px] leading-4 text-coral">
              {errors.avatar}
            </p>
          )}
        </div>
      </div>

      <fieldset className="flex max-w-[417px] flex-col gap-6">
        <legend className="mb-6 text-[16px] leading-4 font-medium text-text-foreground">Alterar senha</legend>
        <PasswordField name="currentPassword" label="Senha atual" autoComplete="current-password" value={passwords.currentPassword} onChange={(e) => setPassword('currentPassword', e.target.value)} error={errors.currentPassword} />
        <PasswordField name="newPassword" label="Nova senha" autoComplete="new-password" value={passwords.newPassword} onChange={(e) => setPassword('newPassword', e.target.value)} error={errors.newPassword} />
        <PasswordField name="confirmPassword" label="Confirmar nova senha" autoComplete="new-password" value={passwords.confirmPassword} onChange={(e) => setPassword('confirmPassword', e.target.value)} error={errors.confirmPassword} />
      </fieldset>

      <button type="submit" aria-disabled={busy} className={SAVE_BUTTON}>
        {busy ? 'Salvando…' : 'Salvar'}
      </button>
    </form>
  )
}
