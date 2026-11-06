import { useState } from 'react'
import { ApiRequestError } from '@/api/client'
import { useSession } from '@/api/queries/session'
import { useCreateWallet, useWallets } from '@/api/queries/wallets'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/toast'
import { RadioMark } from '@/features/checkout/Radio'
import { AccountLayout } from './AccountLayout'
import { WalletForm } from './WalletForm'

const HEADING = 'text-[17px] leading-4 font-bold text-text-foreground'
const ADD = 'text-[16px] leading-4 font-medium text-text-accent'

export function WalletsPage() {
  const wallets = useWallets()
  const { user } = useSession()
  const create = useCreateWallet()
  const [addingSecondary, setAddingSecondary] = useState(false)
  const [sameAsPrimary, setSameAsPrimary] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const primary = wallets.data?.find((w) => w.kind === 'primary')
  const secondary = wallets.data?.find((w) => w.kind === 'secondary')
  const defaults = { displayName: user?.name ?? '', email: user?.email ?? '' }

  function addSecondary() {
    setNotice(null)
    if (!sameAsPrimary) {
      setAddingSecondary(true)
      return
    }
    create.mutate(
      { kind: 'secondary', sameAsPrimary: true },
      {
        onSuccess: () => toast.success('Carteira secundária adicionada.'),
        onError: (error) => setNotice(error instanceof ApiRequestError ? error.message : 'Não foi possível adicionar a carteira.'),
      },
    )
  }

  return (
    <AccountLayout title="Carteiras" showTitleOnDesktop={false}>
      {wallets.isPending ? (
        <div role="status" aria-label="Carregando carteiras" className="flex flex-col gap-6">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} aria-hidden="true" className="h-[69px] w-full rounded-none" />
          ))}
        </div>
      ) : wallets.isError ? (
        <div role="alert" className="flex flex-col items-start gap-4 bg-surface-card px-6 py-8">
          <p className="text-body text-text-secondary">Não foi possível carregar as carteiras.</p>
          <button type="button" onClick={() => void wallets.refetch()} className="rounded-[6px] bg-brand px-4 py-2 font-bold text-ink">
            Tentar novamente
          </button>
        </div>
      ) : (
        <>
          <section aria-labelledby="primary-title" className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <div className="flex items-start justify-between">
                <h2 id="primary-title" className={HEADING}>
                  Carteira principal
                </h2>
                {!primary && (
                  <button type="button" onClick={() => document.getElementById('checkout-primary-displayName')?.focus()} className={ADD}>
                    Adicionar
                  </button>
                )}
              </div>
              <p className="text-[14px] leading-[15px] text-text-secondary">Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.</p>
            </div>
            <WalletForm key={primary?.id ?? 'new-primary'} kind="primary" wallet={primary} defaults={defaults} />
          </section>

          <section aria-labelledby="secondary-title" className="flex flex-col gap-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 id="secondary-title" className={HEADING}>
                Carteira secundária
              </h2>
              {!secondary && (
                <div className="flex items-center gap-6">
                  <label className="flex cursor-pointer items-center gap-2 text-[14px] leading-4 text-text-foreground has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-text-accent">
                    <input type="checkbox" checked={sameAsPrimary} onChange={(e) => setSameAsPrimary(e.target.checked)} className="sr-only" />
                    <RadioMark checked={sameAsPrimary} tone="toggle" />
                    Igual à carteira principal
                  </label>
                  <button type="button" aria-disabled={create.isPending} onClick={() => !create.isPending && addSecondary()} className={ADD}>
                    Adicionar
                  </button>
                </div>
              )}
            </div>
            {notice && (
              <p role="alert" className="text-[13px] leading-5 text-coral">
                {notice}
              </p>
            )}
            {secondary ? (
              <div className="pt-5">
                <WalletForm key={secondary.id} kind="secondary" wallet={secondary} defaults={defaults} />
              </div>
            ) : addingSecondary ? (
              <div className="pt-5">
                <WalletForm kind="secondary" defaults={defaults} onSaved={() => setAddingSecondary(false)} />
              </div>
            ) : (
              <p className="text-[14px] leading-[15px] text-text-secondary">Você ainda não adicionou uma carteira secundária.</p>
            )}
          </section>
        </>
      )}
    </AccountLayout>
  )
}
