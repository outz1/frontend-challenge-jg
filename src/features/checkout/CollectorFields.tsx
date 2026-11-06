import { ENS_SUFFIX, NETWORKS, shortAddress, walletKindLabel } from './constants'
import { CheckoutInput, CheckoutSelect, CheckoutTextarea } from './Field'
import { RadioMark } from './Radio'
import type { Wallet } from '@/api/contracts'
import type { CheckoutForm } from './useCheckoutForm'

type Props = {
  form: CheckoutForm
  wallets: Wallet[]
  /** Desktop: rede, endereço e tipo de carteira ficam no formulário (Figma 11:2862). No mobile vêm dos cartões de carteira. */
  withWalletFields: boolean
}

/** "Perfil do colecionador": dados do pedido. Os rótulos e a ordem seguem o frame desktop. */
export function CollectorFields({ form, wallets, withWalletFields }: Props) {
  const { values, errors, setValue } = form
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
        <div className="flex flex-col gap-3">
          <CheckoutInput
            name="displayName"
            label="Nome de exibição"
            required
            autoComplete="nickname"
            value={values.displayName}
            onChange={(e) => setValue('displayName', e.target.value)}
            error={errors.displayName}
          />
          {withWalletFields && (
            <>
              <CheckoutSelect
                name="network"
                label="Rede"
                required
                placeholder="Selecione uma rede"
                value={form.network ?? ''}
                options={NETWORKS.map((n) => ({ value: n.id, label: n.label }))}
                onChange={(v) => form.setNetwork(v as (typeof NETWORKS)[number]['id'])}
                error={errors.network}
              />
              <CheckoutInput
                name="walletAddress"
                label="Endereço da carteira"
                required
                readOnly
                placeholder="Endereço 0x da carteira"
                value={form.wallet?.address ?? ''}
              />
              <CheckoutSelect
                name="walletId"
                label="Tipo de carteira"
                required
                placeholder="Selecione uma carteira"
                value={form.wallet?.id ?? ''}
                options={wallets.map((w) => ({ value: w.id, label: `${walletKindLabel(w)} · ${shortAddress(w.address)}` }))}
                onChange={form.setWalletId}
                error={errors.walletId}
              />
            </>
          )}
          <CheckoutInput
            name="email"
            type="email"
            label="E-mail"
            required
            autoComplete="email"
            value={values.email}
            onChange={(e) => setValue('email', e.target.value)}
            error={errors.email}
          />
        </div>

        <div className="flex flex-col gap-3">
          <CheckoutInput
            name="username"
            label="Nome de usuário"
            required
            autoComplete="username"
            value={values.username}
            onChange={(e) => setValue('username', e.target.value)}
            error={errors.username}
          />
          <CheckoutInput
            name="profileName"
            label="Nome do perfil"
            required
            value={values.profileName}
            onChange={(e) => setValue('profileName', e.target.value)}
            error={errors.profileName}
          />
          <CheckoutInput
            name="secondaryWallet"
            label="ENS ou carteira secundária"
            hideLabel
            placeholder="ENS ou carteira secundária (opcional)"
            disabled={!form.useOtherWallet}
            value={values.secondaryWallet}
            onChange={(e) => setValue('secondaryWallet', e.target.value)}
            error={errors.secondaryWallet}
            className="sm:min-h-[69px] sm:justify-end"
          />
          <CheckoutInput
            name="referralCode"
            label="Código de indicação"
            value={values.referralCode}
            onChange={(e) => setValue('referralCode', e.target.value)}
            error={errors.referralCode}
          />
          <CheckoutSelect
            name="ensSuffix"
            label="Nome ENS"
            compact
            placeholder=""
            value={ENS_SUFFIX}
            options={[{ value: ENS_SUFFIX, label: ENS_SUFFIX }]}
            onChange={() => undefined}
          />
        </div>
      </div>

      <label className="flex w-fit cursor-pointer items-center gap-2 text-[15px] text-text-foreground has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-text-accent">
        <input
          type="checkbox"
          checked={form.useOtherWallet}
          onChange={(e) => form.setUseOtherWallet(e.target.checked)}
          className="sr-only"
        />
        <RadioMark checked={form.useOtherWallet} tone="toggle" />
        Usar outra carteira?
      </label>

      <CheckoutTextarea
        name="note"
        label="Observação do colecionador (opcional)"
        maxLength={280}
        value={values.note}
        onChange={(e) => setValue('note', e.target.value)}
        error={errors.note}
        className="max-w-[350px]"
      />
    </div>
  )
}
