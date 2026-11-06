import { expect, test } from '@playwright/test'
import { login, setScenario, visible } from './support'

const favorite = (page: import('@playwright/test').Page) => visible(page.getByRole('button', { name: /^(favoritar|favoritado|remover .* dos favoritos)/i }))
/** O botão ignora cliques até a lista de favoritos chegar (aria-busy): o teste espera ele ficar pronto. */
const ready = (page: import('@playwright/test').Page) => expect(favorite(page)).toHaveAttribute('aria-busy', 'false')

test.describe('4. Favoritos', () => {
  test('visitante é levado ao login e volta ao NFT depois de entrar', async ({ page }) => {
    await page.goto('/nft/nft-001')
    await favorite(page).click()
    await expect(page).toHaveURL(/\/login\?redirect=/)
    await page.getByLabel(/e-mail/i).fill('ana@kurio.test')
    await page.getByLabel(/senha/i).first().fill('Kurio@123')
    await page.getByRole('button', { name: /^entrar/i }).last().click()
    await expect(page).toHaveURL(/\/nft\/nft-001/)
  })

  test('favoritar e desfavoritar persiste por usuário após refresh', async ({ page }) => {
    await login(page)
    await page.goto('/nft/nft-001')
    await ready(page)
    await favorite(page).click()
    await expect(favorite(page)).toHaveAttribute('aria-pressed', 'true')
    // A atualização é otimista: espera a API confirmar antes de recarregar.
    await expect(page.getByRole('region', { name: /notificações/i })).toContainText('adicionado aos favoritos')
    await page.reload()
    await ready(page)
    await expect(favorite(page)).toHaveAttribute('aria-pressed', 'true')
    await favorite(page).click()
    await expect(favorite(page)).toHaveAttribute('aria-pressed', 'false')
  })

  test('falha da mutation desfaz a atualização otimista, avisa e permite tentar de novo', async ({ page }) => {
    await login(page)
    await page.goto('/nft/nft-001')
    await ready(page)
    await expect(favorite(page)).toHaveAttribute('aria-pressed', 'false')
    await setScenario(page, 'favorites-error')
    await favorite(page).click()
    await expect(page.getByRole('region', { name: /notificações/i })).toContainText(/desfeita/i)
    await expect(favorite(page)).toHaveAttribute('aria-pressed', 'false')
    await setScenario(page, 'default')
    await favorite(page).click()
    await expect(favorite(page)).toHaveAttribute('aria-pressed', 'true')
  })
})
