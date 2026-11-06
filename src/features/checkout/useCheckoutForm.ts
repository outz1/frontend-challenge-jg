import { useEffect, useMemo, useState } from 'react'
import { collectorSchema, walletAddressValid, type CreateOrderRequest, type Network, type User, type Wallet, type WalletProvider } from '@/api/contracts'
import { firstIssues } from '@/features/auth/form-utils'
import { ENS_SUFFIX } from './constants'
import { emptyValues, loadDraft, saveDraft, type CollectorValues, type Draft } from './storage'

export type CheckoutErrors = Partial<Record<keyof CollectorValues | 'walletId' | 'network' | 'provider', string>>

/**
 * Estado do formulário de pagamento. Carteira e rede escolhidas são derivadas (escolha do usuário ou padrão),
 * então não há efeito para "inicializar" depois que a lista de carteiras chega.
 */
export function useCheckoutForm(user: User, wallets: Wallet[] | undefined) {
  const [draft, setDraft] = useState<Draft>(
    () =>
      loadDraft(user.id) ?? {
        values: emptyValues(user.name, user.email),
        useOtherWallet: false,
        walletId: null,
        network: null,
        provider: null,
      },
  )
  const [errors, setErrors] = useState<CheckoutErrors>({})

  useEffect(() => saveDraft(user.id, draft), [user.id, draft])

  const wallet = useMemo(() => {
    if (!wallets?.length) return undefined
    return wallets.find((w) => w.id === draft.walletId) ?? wallets.find((w) => w.kind === 'primary') ?? wallets[0]
  }, [wallets, draft.walletId])

  const network: Network | null = draft.network ?? wallet?.network ?? null
  // Sem escolha, mantém o provedor com que a carteira já está conectada.
  const provider: WalletProvider | null = draft.provider ?? wallet?.connection.provider ?? null

  const clearError = (key: keyof CheckoutErrors) => setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e))

  return {
    values: draft.values,
    useOtherWallet: draft.useOtherWallet,
    wallet,
    network,
    provider,
    errors,
    setErrors,
    setValue(field: keyof CollectorValues, value: string) {
      setDraft((d) => ({ ...d, values: { ...d.values, [field]: value } }))
      clearError(field)
    },
    setUseOtherWallet(on: boolean) {
      setDraft((d) => ({ ...d, useOtherWallet: on, values: on ? d.values : { ...d.values, secondaryWallet: '' } }))
      clearError('secondaryWallet')
    },
    setWalletId(walletId: string) {
      // Trocar de carteira volta à rede dela.
      setDraft((d) => ({ ...d, walletId, network: null }))
      clearError('walletId')
      clearError('network')
    },
    setNetwork(next: Network) {
      setDraft((d) => ({ ...d, network: next }))
      clearError('network')
    },
    setProvider(next: WalletProvider) {
      setDraft((d) => ({ ...d, provider: next }))
      clearError('provider')
    },
    /** Valida tudo e devolve o corpo do pedido (sem cotação, que vem da API) ou `null` com os erros na tela. */
    validate(): { collector: CreateOrderRequest['collector']; walletId: string; network: Network; provider: WalletProvider } | null {
      const next: CheckoutErrors = {}
      // "Nome ENS" (.eth): quem digita só o nome recebe o sufixo escolhido.
      const typed = draft.values.secondaryWallet.trim()
      const secondaryWallet = !draft.useOtherWallet ? '' : typed && !typed.startsWith('0x') && !typed.includes('.') ? `${typed}${ENS_SUFFIX}` : typed
      const parsed = collectorSchema.safeParse({ ...draft.values, secondaryWallet })
      if (!parsed.success) Object.assign(next, firstIssues(parsed.error))
      if (draft.useOtherWallet && !draft.values.secondaryWallet.trim()) next.secondaryWallet = 'Informe o endereço ou nome ENS'
      if (!wallet) next.walletId = 'Selecione uma carteira'
      if (!network) next.network = 'Selecione uma rede'
      else if (wallet && !walletAddressValid(network, wallet.address)) next.network = 'Esta carteira não é compatível com a rede selecionada'
      if (!provider) next.provider = 'Selecione como conectar a carteira'
      setErrors(next)
      if (Object.keys(next).length > 0 || !parsed.success || !wallet || !network || !provider) return null
      return { collector: parsed.data, walletId: wallet.id, network, provider }
    },
  }
}

export type CheckoutForm = ReturnType<typeof useCheckoutForm>
