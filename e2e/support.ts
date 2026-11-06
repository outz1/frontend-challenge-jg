import { expect, type Locator, type Page, type TestInfo } from '@playwright/test'

export const ANA = { email: 'ana@kurio.test', password: 'Kurio@123' }
export const BRUNO = { email: 'bruno@kurio.test', password: 'Kurio@456' }

export const isMobile = (info: TestInfo) => info.project.name.includes('mobile')

/** Pega a ocorrência visível no viewport atual quando um rótulo aparece mais de uma vez (composições mobile e desktop, diálogos). */
export const visible = (locator: Locator) => locator.filter({ visible: true }).first()

/** Cenários de rede do mock (§6). Valem para o contexto atual e persistem em localStorage. */
export type Scenario =
  | 'default'
  | 'slow'
  | 'empty'
  | 'error-500'
  | 'offline'
  | 'session-expired'
  | 'favorites-error'
  | 'wallet-rejected'
  | 'payment-declined'
  | 'payment-slow'
  | 'order-timeout'
  | 'price-changed'
  | 'sold-out-during-purchase'

export async function setScenario(page: Page, name: Scenario) {
  await page.evaluate((n) => localStorage.setItem('kurio:scenario', n), name)
}

type MockControls = {
  updateNft: (nftId: string, editionId: string, patch: { priceEth?: string; available?: number | null }) => Promise<number | null>
  resendLast: (count?: number) => number
  emitStale: (nftId: string) => boolean
  disconnect: (stayDown?: boolean) => void
  reconnect: () => void
  connections: () => { userId: string | null; subs: string[] }[]
}

/** Controles do mock (`window.__kurioMock`): tudo passa pelo servidor simulado e chega ao cliente Socket.IO real. */
export async function mock<T>(page: Page, run: (controls: MockControls) => T | Promise<T>): Promise<T> {
  // O worker do MSW sobe de forma assíncrona: espera os controles existirem antes de usá-los.
  await page.waitForFunction(() => Boolean((window as unknown as { __kurioMock?: unknown }).__kurioMock))
  return (await page.evaluate(`(${run.toString()})(window.__kurioMock)`)) as T
}

export async function login(page: Page, user = ANA, next = '/login') {
  await page.goto(next)
  await page.getByLabel(/e-mail/i).fill(user.email)
  await page.getByLabel(/senha/i).first().fill(user.password)
  await page.getByRole('button', { name: /^entrar/i }).last().click()
  await expect(page).not.toHaveURL(/\/login/)
}

/** Lê a sessão ativa pela API simulada (o token fica em localStorage). */
export const apiGet = <T>(page: Page, path: string) =>
  page.evaluate(
    async (p) => {
      const token = localStorage.getItem('kurio:token')
      const response = await fetch(`/api${p}`, { headers: { Authorization: `Bearer ${token}` } })
      return { status: response.status, body: (await response.json().catch(() => null)) as unknown }
    },
    path,
  ) as Promise<{ status: number; body: T }>

export async function addToCart(page: Page, nftId = 'nft-001') {
  await page.goto(`/nft/${nftId}`)
  await page.getByRole('button', { name: /comprar/i }).first().click()
  await expect(page).toHaveURL(/\/cart$/)
}

/** Preenche o "Perfil do colecionador" do Pagamento e escolhe a carteira de conexão. */
export async function fillCheckout(page: Page, provider: 'MetaMask' | 'WalletConnect' | 'Coinbase Wallet' = 'MetaMask') {
  await page.goto('/checkout')
  await expect(page.getByRole('button', { name: /confirmar compra/i })).toBeVisible()
  await page.getByLabel('Nome de usuário').first().fill('ana_col')
  await page.getByLabel('Nome do perfil').first().fill('Ana Kurio')
  await page.getByText(provider, { exact: true }).first().click()
}

export async function reviewOrder(page: Page) {
  await page.getByRole('button', { name: /confirmar compra/i }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
}

export const sendOrder = (page: Page) => page.getByRole('button', { name: /enviar pedido|confirmar novos valores|verificar pedido/i }).click()

/** Uma compra pronta até a revisão: login, item no carrinho e formulário preenchido. */
export async function readyToPay(page: Page, user = ANA) {
  await login(page, user)
  await addToCart(page)
  await fillCheckout(page)
  await reviewOrder(page)
}
