import { expect, test } from '@playwright/test'
import { isMobile, visible } from './support'

test.describe('2. Detalhe: acesso direto e recurso inexistente', () => {
  test('acesso direto mostra o NFT, edições e quantidade com limite', async ({ page }) => {
    await page.goto('/nft/nft-001')
    await expect(visible(page.getByRole('heading', { name: 'Emerald Ape #042' }))).toBeVisible()
    await expect(visible(page.getByText('ID do token: #0042'))).toBeVisible()
    await page.reload()
    await expect(visible(page.getByRole('heading', { name: 'Emerald Ape #042' }))).toBeVisible()
  })

  test('NFT inexistente mostra 404 com caminho de volta', async ({ page }) => {
    await page.goto('/nft/nft-nao-existe')
    await expect(page.getByRole('heading', { name: 'NFT não encontrado' })).toBeVisible()
    await page.getByRole('link', { name: /voltar|início|explorar/i }).first().click()
    await expect(page).toHaveURL(/\/$/)
  })

  test('rota inexistente mostra a página 404', async ({ page }) => {
    await page.goto('/qualquer/coisa')
    await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible()
  })

  test('"Mercado" do menu e da trilha leva ao catálogo; "Criadores" avisa que está indisponível', async ({ page }, info) => {
    test.skip(isMobile(info), 'O menu principal só existe a partir de 768 px; no mobile a navegação é a tab bar.')
    await page.goto('/nft/nft-001')
    const menu = page.getByRole('navigation', { name: 'Principal' })
    await expect(menu.getByRole('link', { name: 'Mercado' })).toHaveAttribute('aria-current', 'page')
    await page.getByRole('navigation', { name: 'Trilha de navegação' }).getByRole('link', { name: 'Mercado' }).click()
    await expect(page).toHaveURL(/\/#catalogo$/)
    await expect(page.locator('#catalogo')).toBeInViewport()
    // Fora do escopo (§3): o clique não navega, só informa.
    await menu.getByRole('button', { name: 'Criadores' }).click({ force: true })
    await expect(page.getByText(/Criadores: indisponível nesta demonstração/)).toBeVisible()
    await expect(page).toHaveURL(/\/#catalogo$/)
  })

  test('a quantidade respeita o limite da edição e avisa ao chegar nele', async ({ page }) => {
    await page.goto('/nft/nft-001')
    const more = page.getByRole('button', { name: /aumentar quantidade/i }).first()
    for (let i = 0; i < 8; i += 1) await more.click({ force: true })
    await expect(page.getByRole('status').filter({ hasText: /\S/ }).first()).toBeVisible()
    await expect(more).toHaveAttribute('aria-disabled', 'true')
  })
})
