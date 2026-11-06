import { useState, type FormEvent } from 'react'
import { ApiRequestError } from '@/api/client'
import {
  createWalletRequestSchema,
  updateWalletRequestSchema,
  type Network,
  type Wallet,
  type WalletProvider,
} from '@/api/contracts'
import { useCreateWallet, useUpdateWallet } from '@/api/queries/wallets'
import { toast } from '@/components/ui/toast'
import { fieldErrorsFrom, firstIssues } from '@/features/auth/form-utils'
import { CheckoutInput, CheckoutSelect } from '@/features/checkout/Field'
import { ENS_SUFFIX, NETWORKS, PROVIDERS } from '@/features/checkout/constants'

type Kind = 'primary' | 'secondary'

type Values = {
  displayName: string
  label: string
  network: Network | ''
  profileName: string
  address: string
  secondaryAddress: string
  walletType: WalletProvider | ''
  referralCode: string
  email: string
  ensName: string
}

const SAVE_BUTTON = 'flex h-10 w-[131px] items-center justify-center rounded-[3px] bg-brand text-[14px] leading-4 font-bold text-ink'
const NETWORK_OPTIONS = NETWORKS.map((n) => ({ value: n.id, label: n.label }))
const PROVIDER_OPTIONS = PROVIDERS.map((p) => ({ value: p.id, label: p.label }))

function initialValues(wallet: Wallet | undefined, defaults: { displayName: string; email: string }): Values {
  return {
    displayName: wallet?.displayName ?? defaults.displayName,
    label: wallet?.label ?? '',
    network: wallet?.network ?? '',
    profileName: wallet?.profileName ?? '',
    address: wallet?.address ?? '',
    secondaryAddress: wallet?.secondaryAddress ?? '',
    walletType: wallet?.walletType ?? '',
    referralCode: wallet?.referralCode ?? '',
    email: wallet?.email ?? defaults.email,
    ensName: wallet?.ensName ?? '',
  }
}

type Props = {
  kind: Kind
  /** Carteira existente (edição) ou `undefined` para cadastrar. */
  wallet?: Wallet
  defaults: { displayName: string; email: string }
  /** Chamado depois que a API aceita a carteira. */
  onSaved?: () => void
}

/** Formulário de carteira (Figma 70390:239). A principal e a secundária compartilham os mesmos campos. */
export function WalletForm({ kind, wallet, defaults, onSaved }: Props) {
  const create = useCreateWallet()
  const update = useUpdateWallet()
  const [values, setValues] = useState<Values>(() => initialValues(wallet, defaults))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const busy = create.isPending || update.isPending
  const n = (field: keyof Values | 'ensSuffix') => `${kind}-${field}`

  const setValue = (field: keyof Values, value: string) => {
    setValues((v) => ({ ...v, [field]: value }))
    setErrors((e) => (e[field] ? { ...e, [field]: '' } : e))
  }
  const focusFirstError = () => requestAnimationFrame(() => document.querySelector<HTMLElement>(`form[data-kind="${kind}"] [aria-invalid="true"]`)?.focus())

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    // Ids dos campos incluem o tipo (`primary-`/`secondary-`) para as duas carteiras coexistirem na mesma tela.
    const parsed = wallet ? updateWalletRequestSchema.safeParse(values) : createWalletRequestSchema.safeParse({ kind, ...values })
    if (!parsed.success) {
      setErrors(firstIssues(parsed.error))
      focusFirstError()
      return
    }
    try {
      if (wallet) await update.mutateAsync({ walletId: wallet.id, input: updateWalletRequestSchema.parse(values) })
      else await create.mutateAsync(createWalletRequestSchema.parse({ kind, ...values }))
      setErrors({})
      toast.success(wallet ? 'Carteira atualizada.' : 'Carteira cadastrada.')
      onSaved?.()
    } catch (error) {
      setErrors(error instanceof ApiRequestError && error.fieldErrors ? fieldErrorsFrom(error.fieldErrors) : {})
      toast.error(error instanceof ApiRequestError ? error.message : 'Não foi possível salvar a carteira.')
      focusFirstError()
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      data-kind={kind}
      aria-label={kind === 'primary' ? 'Carteira principal' : 'Carteira secundária'}
      className="flex flex-col gap-8"
    >
      <div className="grid gap-x-7 gap-y-6 md:grid-cols-2">
        <CheckoutInput name={n('displayName')} label="Nome de exibição" required autoComplete="name" value={values.displayName} onChange={(e) => setValue('displayName', e.target.value)} error={errors.displayName} />
        <CheckoutInput name={n('label')} label="Apelido da carteira" required value={values.label} onChange={(e) => setValue('label', e.target.value)} error={errors.label} />
        <CheckoutSelect name={n('network')} label="Rede" required placeholder="Selecione uma rede" options={NETWORK_OPTIONS} value={values.network} onChange={(v) => setValue('network', v)} error={errors.network} />
        <CheckoutInput name={n('profileName')} label="Nome do perfil" required value={values.profileName} onChange={(e) => setValue('profileName', e.target.value)} error={errors.profileName} />
        <CheckoutInput name={n('address')} label="Endereço da carteira" required placeholder="Endereço 0x da carteira" autoComplete="off" value={values.address} onChange={(e) => setValue('address', e.target.value)} error={errors.address} />
        <CheckoutInput name={n('secondaryAddress')} label="ENS ou carteira secundária" hideLabel placeholder="ENS ou carteira secundária (opcional)" autoComplete="off" className="justify-end" value={values.secondaryAddress} onChange={(e) => setValue('secondaryAddress', e.target.value)} error={errors.secondaryAddress} />
        <CheckoutSelect name={n('walletType')} label="Tipo de carteira" required placeholder="Selecione uma carteira" options={PROVIDER_OPTIONS} value={values.walletType} onChange={(v) => setValue('walletType', v)} error={errors.walletType} />
        <CheckoutInput name={n('referralCode')} label="Código de indicação" value={values.referralCode} onChange={(e) => setValue('referralCode', e.target.value)} error={errors.referralCode} />
        <CheckoutInput name={n('email')} type="email" label="E-mail" required autoComplete="email" value={values.email} onChange={(e) => setValue('email', e.target.value)} error={errors.email} />
        <div className="flex gap-[10px]">
          <CheckoutSelect name={n('ensSuffix')} label="Nome ENS" compact placeholder="" value={ENS_SUFFIX} options={[{ value: ENS_SUFFIX, label: ENS_SUFFIX }]} onChange={() => undefined} />
          <CheckoutInput name={n('ensName')} label="Nome ENS (sem o sufixo)" hideLabel className="min-w-0 flex-1 justify-end" value={values.ensName} onChange={(e) => setValue('ensName', e.target.value)} error={errors.ensName} />
        </div>
      </div>
      <button type="submit" aria-disabled={busy} className={SAVE_BUTTON}>
        {busy ? 'Salvando…' : 'Salvar carteira'}
      </button>
    </form>
  )
}
