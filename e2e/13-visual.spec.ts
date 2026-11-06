import { expect, test, type Page } from '@playwright/test'
import { addToCart, fillCheckout, isMobile, login } from './support'

/** Dados estáveis: catálogo determinístico, movimento reduzido e imagens carregadas antes da captura. */
async function settle(page: Page) {
  await page.addStyleTag({ content: '*{caret-color:transparent!important}' })
  await page.evaluate(async () => {
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
    // Rolagem limitada: a lista mobile cresce enquanto rola e imagens preguiçosas só carregam ao entrar na tela.
    const total = Math.min(document.body.scrollHeight, 5000)
    for (let y = 0; y < total; y += 500) {
      window.scrollTo(0, y)
      await sleep(60)
    }
    window.scrollTo(0, 0)
    await Promise.race([document.fonts.ready, sleep(3000)])
    const pending = [...document.images].filter((img) => !img.complete).map((img) => new Promise((resolve) => { img.onload = img.onerror = () => resolve(null) }))
    await Promise.race([Promise.all(pending), sleep(4000)])
  })
  await page.waitForTimeout(400)
}

test.use({ reducedMotion: 'reduce' })

test.describe('Regressão visual: início, detalhe, carrinho e pagamento', () => {
  test('início', async ({ page }, info) => {
    await page.goto('/')
    await expect(page.getByRole('link', { name: /#\d+/ }).first()).toBeVisible()
    await settle(page)
    // No mobile a lista continua ao rolar: a baseline cobre a primeira tela.
    await expect(page).toHaveScreenshot('inicio.png', { fullPage: !isMobile(info) })
  })

  test('detalhe', async ({ page }) => {
    await page.goto('/nft/nft-001')
    await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible()
    await settle(page)
    await expect(page).toHaveScreenshot('detalhe.png', { fullPage: true })
  })

  test('carrinho', async ({ page }) => {
    await login(page)
    await addToCart(page, 'nft-001')
    await expect(page.getByText('Emerald Ape #042').first()).toBeVisible()
    await expect(page.getByText(/^\d+\.\d+ ETH$/).first()).toBeVisible()
    await settle(page)
    await expect(page).toHaveScreenshot('carrinho.png', { fullPage: true })
  })

  test('pagamento', async ({ page }) => {
    await login(page)
    await addToCart(page, 'nft-001')
    await fillCheckout(page)
    await expect(page.getByText(/^\d+\.\d+ ETH$/).first()).toBeVisible()
    await settle(page)
    await expect(page).toHaveScreenshot('pagamento.png', { fullPage: true, mask: [page.locator('input'), page.locator('textarea')] })
  })
})
