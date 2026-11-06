import type { CreateOrderRequest, Network, WalletProvider } from '@/api/contracts'

/** Rascunho do checkout e chave de idempotência: guardados por usuário para retomar após expiração ou refresh (§3). */
const PREFIX = 'kurio:checkout-'

export type CollectorValues = {
  displayName: string
  username: string
  profileName: string
  email: string
  referralCode: string
  secondaryWallet: string
  note: string
}

export type Draft = {
  values: CollectorValues
  useOtherWallet: boolean
  walletId: string | null
  network: Network | null
  provider: WalletProvider | null
}

function read<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(PREFIX + key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown) {
  try {
    sessionStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // Sem armazenamento (janela privada, cota): o checkout segue sem retomada.
  }
}

function remove(key: string) {
  try {
    sessionStorage.removeItem(PREFIX + key)
  } catch {
    // idem
  }
}

export const loadDraft = (userId: string) => read<Draft>(`draft:${userId}`)
export const saveDraft = (userId: string, draft: Draft) => write(`draft:${userId}`, draft)
export const clearDraft = (userId: string) => remove(`draft:${userId}`)

/**
 * Tentativa de envio em andamento: a chave de idempotência e o corpo exatos que foram enviados. Fica guardada até a
 * API responder (pedido criado ou erro de negócio). Após timeout ou queda de rede o reenvio usa estes mesmos valores,
 * e não a cotação atual (que já pode ter mudado porque o pedido foi liquidado), então a API devolve o mesmo pedido.
 */
export type Attempt = { key: string; request: CreateOrderRequest }

export const loadAttempt = (userId: string) => read<Attempt>(`attempt:${userId}`)
export const saveAttempt = (userId: string, attempt: Attempt) => write(`attempt:${userId}`, attempt)
export const clearAttempt = (userId: string) => remove(`attempt:${userId}`)

/** Pedido criado e ainda não encerrado na tela: voltar ao checkout retoma o acompanhamento, nunca abre outra compra. */
export const loadActiveOrder = (userId: string) => read<string>(`order:${userId}`)
export const saveActiveOrder = (userId: string, orderId: string) => write(`order:${userId}`, orderId)
export const clearActiveOrder = (userId: string) => remove(`order:${userId}`)

export function clearCheckoutStorage() {
  try {
    for (const key of Object.keys(sessionStorage)) if (key.startsWith(PREFIX)) sessionStorage.removeItem(key)
  } catch {
    // idem
  }
}

export const emptyValues = (name = '', email = ''): CollectorValues => ({
  displayName: name,
  username: '',
  profileName: '',
  email,
  referralCode: '',
  secondaryWallet: '',
  note: '',
})
