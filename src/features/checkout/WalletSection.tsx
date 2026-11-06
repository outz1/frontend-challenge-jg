import { useState } from 'react'
import { ApiRequestError } from '@/api/client'
import type { Wallet } from '@/api/contracts'
import { useDisconnectWallet } from '@/api/queries/wallets'
import walletIcon from '@/assets/icons/pay-wallet.svg'
import kebab from '@/assets/icons/pay-kebab.svg'
import providerCircle from '@/assets/icons/pay-provider-circle.svg'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { PROVIDERS, networkLabel, providerLabel, shortAddress, walletKindLabel, walletNetworkCaption } from './constants'
import { RadioMark } from './Radio'
import type { CheckoutForm } from './useCheckoutForm'

type Tone = 'desktop' | 'mobile'

const focusRing = 'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-text-accent'

/** "Carteira e rede": como conectar a carteira. Rádios nativos: setas, foco e leitor de tela vêm de graça. */
export function ProviderOptions({ form, tone }: { form: CheckoutForm; tone: Tone }) {
  const mobile = tone === 'mobile'
  return (
    <div className={cn('flex flex-col', mobile ? 'gap-4' : 'gap-5')}>
      <h2 id="provider-title" className={cn('leading-4 font-bold text-text-foreground', mobile ? 'text-[16px]' : 'text-center text-[17px]')}>
        Carteira e rede
      </h2>
      <div role="radiogroup" aria-labelledby="provider-title" aria-describedby={form.errors.provider ? 'provider-error' : undefined} className={cn('flex flex-col', mobile ? 'gap-4' : 'gap-4')}>
        {PROVIDERS.map((p) => {
          const checked = form.provider === p.id
          return (
            <label
              key={p.id}
              className={cn(
                'flex cursor-pointer items-center',
                focusRing,
                mobile
                  ? 'h-[65px] gap-[11px] rounded-[15px] bg-surface-card pr-[17px] pl-[14px] shadow-[0_0_20px_rgba(10,6,4,0.45)]'
                  : cn('h-[45px] gap-[10px] rounded-[3px] border px-3', checked ? 'border-brand' : 'border-line'),
              )}
            >
              <input type="radio" name="provider" value={p.id} checked={checked} onChange={() => form.setProvider(p.id)} className="sr-only" />
              {mobile ? (
                <>
                  <span className="relative grid size-10 shrink-0 place-items-center">
                    <img src={providerCircle} alt="" width={40} height={40} aria-hidden="true" className="absolute inset-0 block" />
                    {p.initial ? (
                      <span aria-hidden="true" className="relative text-[14px] font-bold text-text-accent">
                        {p.initial}
                      </span>
                    ) : (
                      <img src={walletIcon} alt="" width={20} height={19} aria-hidden="true" className="relative block" />
                    )}
                  </span>
                  <span className="text-[14px] leading-4 text-text-foreground">{p.label}</span>
                  <span className="ml-auto">
                    <RadioMark checked={checked} tone="mobile" />
                  </span>
                </>
              ) : (
                <>
                  <RadioMark checked={checked} tone="desktop" />
                  <span className="text-[15px] text-text-foreground">{p.label}</span>
                </>
              )}
            </label>
          )
        })}
      </div>
      {form.errors.provider && (
        <p id="provider-error" role="alert" className="text-[13px] leading-4 text-coral">
          {form.errors.provider}
        </p>
      )}
      {!mobile && form.wallet && <WalletStatus wallet={form.wallet} />}
    </div>
  )
}

/** Estado da conexão simulada da carteira escolhida, com a opção de desconectar. */
export function WalletStatus({ wallet, className }: { wallet: Wallet; className?: string }) {
  const disconnect = useDisconnectWallet()
  const { connection } = wallet
  const connected = connection.status === 'connected' && connection.network && connection.provider
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-2 text-[13px] leading-5 text-text-secondary', className)}>
      <p role="status">
        {connected
          ? `Conectada em ${networkLabel(connection.network!)} via ${providerLabel(connection.provider!)}.`
          : 'Carteira desconectada. A conexão é simulada ao enviar o pedido.'}
      </p>
      {connected && (
        <button
          type="button"
          aria-disabled={disconnect.isPending}
          onClick={() => {
            if (disconnect.isPending) return
            disconnect.mutate(wallet.id, {
              onSuccess: () => toast.success('Carteira desconectada.'),
              onError: (e) => toast.error(e instanceof ApiRequestError && e.transient ? 'Sem conexão com o servidor. Tente novamente.' : 'Não foi possível desconectar a carteira.'),
            })
          }}
          className="text-text-accent underline underline-offset-4"
        >
          Desconectar
        </button>
      )}
    </div>
  )
}

/** Mobile (Figma 16:748): "Carteira conectada" e os cartões de carteira. */
export function MobileWalletCards({ form, wallets }: { form: CheckoutForm; wallets: Wallet[] }) {
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between leading-4 font-bold">
        <h2 id="wallets-title" className="text-[16px] text-text-foreground">
          Carteira conectada
        </h2>
        <button
          type="button"
          onClick={() => document.querySelector<HTMLInputElement>('input[name="walletId"]:checked')?.focus()}
          className="text-[14px] text-text-accent"
        >
          Trocar carteira
        </button>
      </div>
      <div role="radiogroup" aria-labelledby="wallets-title" className="flex flex-col gap-5">
        {wallets.map((wallet) => {
          const checked = form.wallet?.id === wallet.id
          const menuId = `wallet-menu-${wallet.id}`
          return (
            <div key={wallet.id} className="relative">
              <label className={cn('relative block min-h-[93px] rounded-[14px] bg-surface-card py-[15px] pr-12 pl-[54px]', focusRing)}>
                <input type="radio" name="walletId" value={wallet.id} checked={checked} onChange={() => form.setWalletId(wallet.id)} className="sr-only" />
                <span className="absolute top-[39px] left-[19px]">
                  <RadioMark checked={checked} tone="mobile" />
                </span>
                <span className="block text-[16px] leading-4 font-bold text-text-foreground">{walletKindLabel(wallet)}</span>
                <span className="mt-[7px] block text-[14px] leading-[22px] text-text-secondary">{shortAddress(wallet.address)}</span>
                <span className="block text-[14px] leading-[22px] text-text-secondary">{walletNetworkCaption(wallet.network)}</span>
              </label>
              <button
                type="button"
                aria-label={`Mais opções de ${walletKindLabel(wallet)}`}
                aria-expanded={openMenu === wallet.id}
                aria-controls={menuId}
                onClick={() => setOpenMenu((id) => (id === wallet.id ? null : wallet.id))}
                className="absolute top-[28px] right-[10px] grid h-9 w-9 place-items-center"
              >
                <img src={kebab} alt="" width={3} height={15} aria-hidden="true" className="block" />
              </button>
              <div id={menuId} hidden={openMenu !== wallet.id} className="px-4 pt-2 pb-1">
                <WalletStatus wallet={wallet} />
              </div>
            </div>
          )
        })}
      </div>
      {form.errors.network && (
        <p role="alert" className="text-[13px] leading-4 text-coral">
          {form.errors.network}
        </p>
      )}
    </div>
  )
}
