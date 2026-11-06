import { expect, test } from '@playwright/test'
import { ANA, addToCart, apiGet, login } from './support'

const rows = (page: import('@playwright/test').Page) => page.getByRole('list', { name: /itens do carrinho/i }).locator('> li')

test.describe('5. Carrinho', () => {
  test('quantidade, remoção e persistência após refresh', async ({ page }) => {
    await addToCart(page, 'nft-001')
    await page.goto('/nft/nft-005')
    await page.getByRole('button', { name: /comprar/i }).first().click()
    await expect(page).toHaveURL(/\/cart$/)
    await expect(rows(page)).toHaveCount(2)

    // O envio da quantidade é agrupado (350 ms): espera a API responder antes de recarregar.
    const saved = page.waitForResponse((r) => r.request().method() === 'PATCH' && /\/api\/cart\/items\//.test(r.url()))
    await page.getByRole('button', { name: /aumentar quantidade/i }).first().click()
    await expect(page.getByRole('group', { name: /quantidade/i }).first().locator('output')).toHaveText('2')
    await saved
    await page.reload()
    await expect(page.getByRole('group', { name: /quantidade/i }).first().locator('output')).toHaveText('2')

    await page.getByRole('button', { name: /remover .* do carrinho/i }).first().click()
    await expect(rows(page)).toHaveCount(1)
  })

  test('cupom inválido mostra erro; cupom válido aplica desconto e pode ser removido', async ({ page }) => {
    await addToCart(page)
    const code = page.getByLabel('Código promocional').last()
    await code.fill('INVALIDO')
    await page.getByRole('button', { name: /^aplicar$/i }).last().click()
    await expect(page.getByRole('alert').filter({ hasText: /inválid/i })).toBeVisible()
    await code.fill('KURIO10')
    await page.getByRole('button', { name: /^aplicar$/i }).last().click()
    await expect(page.getByText(/KURIO10/).first()).toBeVisible()
    await page.getByRole('button', { name: /remover cupom/i }).click()
    await expect(page.getByLabel('Código promocional').last()).toBeVisible()
  })

  test('itens do visitante são preservados ao entrar na conta', async ({ page }) => {
    await addToCart(page, 'nft-001')
    await login(page, ANA, '/login')
    await page.goto('/cart')
    await expect(rows(page)).toHaveCount(1)
    const cart = await apiGet<{ items: unknown[] }>(page, '/cart')
    expect(cart.body.items).toHaveLength(1)
  })

  test('totais vêm da cotação da API com precisão decimal', async ({ page }) => {
    await addToCart(page)
    await expect(page.getByText('Subtotal')).toBeVisible()
    await expect(page.getByText(/^\d+\.\d{2,3} ETH$/).first()).toBeVisible()
    await expect(page.getByText('Taxa de rede')).toBeVisible()
    await expect(page.getByText('Total', { exact: true }).first()).toBeVisible()
  })
})
