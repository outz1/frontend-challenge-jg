import { expect, test } from '@playwright/test'
import { addToCart, fillCheckout, login, mock, reviewOrder, sendOrder, setScenario, visible } from './support'

const subscribed = (page: import('@playwright/test').Page, id: string) =>
  expect.poll(() => mock(page, (m) => m.connections().flatMap((c) => c.subs))).toContain(id)

test.describe('10. Eventos duplicados ou antigos, desconexão e retomada de pedido pendente', () => {
  test.setTimeout(90_000)

  test('evento duplicado é ignorado: o aviso de preço do carrinho aparece uma vez só', async ({ page }) => {
    await addToCart(page)
    await subscribed(page, 'nft-001')
    await mock(page, (m) => m.updateNft('nft-001', 'nft-001-open', { priceEth: '2.50' }))
    const notices = page.getByRole('region', { name: /notificações/i }).getByText(/preço mudou/i)
    await expect(notices).toHaveCount(1)
    await mock(page, (m) => m.resendLast(1))
    await page.waitForTimeout(500)
    await expect(notices).toHaveCount(1)
  })

  test('evento antigo não regride o estado', async ({ page }) => {
    await page.goto('/nft/nft-001')
    await subscribed(page, 'nft-001')
    await mock(page, (m) => m.updateNft('nft-001', 'nft-001-open', { priceEth: '2.50' }))
    await expect(visible(page.getByText('2.50 ETH'))).toBeVisible()
    await mock(page, (m) => m.emitStale('nft-001'))
    await page.waitForTimeout(500)
    await expect(page.getByText('99.99 ETH')).toHaveCount(0)
    await expect(visible(page.getByText('2.50 ETH'))).toBeVisible()
  })

  test('queda do socket: ao reconectar, a tela reconcilia por REST o que mudou no intervalo', async ({ page }) => {
    await page.goto('/nft/nft-001')
    await subscribed(page, 'nft-001')
    await mock(page, (m) => m.disconnect(true))
    await mock(page, (m) => m.updateNft('nft-001', 'nft-001-open', { priceEth: '4.44' }))
    await expect(page.getByText('4.44 ETH')).toHaveCount(0)
    await mock(page, (m) => m.reconnect())
    await expect(visible(page.getByText('4.44 ETH'))).toBeVisible({ timeout: 30_000 })
  })

  test('pedido pendente sobrevive a refresh e termina confirmado sem nova compra', async ({ page }) => {
    await login(page)
    await addToCart(page)
    await fillCheckout(page)
    await setScenario(page, 'payment-slow')
    await reviewOrder(page)
    await sendOrder(page)
    await expect(page.getByText(/aguardando a confirmação/i)).toBeVisible()
    await page.reload()
    await expect(page).toHaveURL(/order=ord_/)
    await expect(page.getByText(/aguardando a confirmação/i)).toBeVisible()
    await expect(page).toHaveURL(/\/order\/ord_/, { timeout: 40_000 })
    const orders = await page.evaluate(async () => {
      const r = await fetch('/api/orders', { headers: { Authorization: `Bearer ${localStorage.getItem('kurio:token')}` } })
      return ((await r.json()) as { items: { status: string }[] }).items
    })
    expect(orders).toHaveLength(1)
    expect(orders[0].status).toBe('confirmed')
  })

  test('logout libera a identidade e as subscriptions do socket (sem eventos privados para a sessão anterior)', async ({ page }, info) => {
    await login(page)
    await addToCart(page)
    await subscribed(page, 'nft-001')
    expect((await mock(page, (m) => m.connections())).some((c) => c.userId !== null)).toBe(true)
    if (info.project.name.includes('mobile')) {
      await page.goto('/profile')
      await page.getByRole('button', { name: 'Sair' }).click()
    } else {
      await page.getByRole('banner').getByRole('button', { name: 'Sair' }).click()
    }
    await expect.poll(async () => (await mock(page, (m) => m.connections())).some((c) => c.userId !== null)).toBe(false)
  })
})
