import { expect, test } from '@playwright/test'
import { setScenario, visible } from './support'

test.describe('12. Skeletons em carga lenta, feedback de falha e nova tentativa', () => {
  test('carga lenta mostra skeletons e depois o conteúdo sem pular', async ({ page }) => {
    await page.goto('/')
    await setScenario(page, 'slow')
    await page.goto('/nft/nft-002')
    await expect(visible(page.locator('.animate-shimmer'))).toBeVisible()
    await expect(visible(page.getByRole('heading', { name: 'Sage Nomad #009' }))).toBeVisible({ timeout: 20_000 })
    await expect(page.locator('.animate-shimmer')).toHaveCount(0)
  })

  test('com movimento reduzido o shimmer não anima', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' })
    const page = await context.newPage()
    await page.goto('/')
    await setScenario(page, 'slow')
    await page.goto('/nft/nft-002')
    const name = await page.locator('.animate-shimmer').first().evaluate((el) => getComputedStyle(el).animationName)
    expect(name).toBe('none')
    await context.close()
  })

  test('falha 500 mostra o estado de erro e "Tentar novamente" recupera', async ({ page }) => {
    await page.goto('/')
    await setScenario(page, 'error-500')
    await page.goto('/?page=2')
    await expect(page.getByRole('alert').filter({ hasText: /algo deu errado/i })).toBeVisible({ timeout: 30_000 })
    await setScenario(page, 'default')
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.getByRole('link', { name: /#\d+/ }).first()).toBeVisible({ timeout: 20_000 })
  })

  test('sem conexão mostra a mensagem de rede e recupera depois', async ({ page }) => {
    await page.goto('/')
    await setScenario(page, 'offline')
    await page.goto('/?page=2')
    await expect(page.getByText(/Não conseguimos falar com o servidor/)).toBeVisible({ timeout: 30_000 })
    await setScenario(page, 'default')
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.getByRole('link', { name: /#\d+/ }).first()).toBeVisible({ timeout: 20_000 })
  })

  test('resultado vazio do catálogo é um estado próprio, não uma falha', async ({ page }) => {
    await page.goto('/')
    await setScenario(page, 'empty')
    await page.goto('/?page=2')
    await expect(page.getByRole('heading', { name: 'Nenhum NFT encontrado' })).toBeVisible({ timeout: 20_000 })
  })
})
