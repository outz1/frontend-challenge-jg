import { expect, test } from '@playwright/test'
import { isMobile } from './support'

test.describe('1. Catálogo: busca, filtros, ordenação e paginação na URL', () => {
  test('filtros combináveis, ordenação e página vivem na URL e sobrevivem a refresh e histórico', async ({ page }, info) => {
    test.skip(isMobile(info), 'Filtros e ordenação têm a composição desktop; o mobile usa o diálogo de filtros.')
    await page.goto('/')
    const cards = page.getByRole('link', { name: /#\d+/ })
    await expect(cards.first()).toBeVisible()

    await page.getByRole('link', { name: 'Página 2' }).click()
    await expect(page).toHaveURL(/page=2/)
    await expect(cards.first()).toBeVisible()

    // Mudar filtro reinicia a paginação (§3).
    await page.getByLabel('Fotografia').check({ force: true })
    await expect(page).toHaveURL(/collection=.*fotografia/)
    await expect(page).not.toHaveURL(/page=2/)

    await page.getByRole('combobox').click()
    await page.getByRole('option', { name: 'Menor preço' }).click()
    await expect(page).toHaveURL(/sort=price_asc/)
    await expect(page).toHaveURL(/collection=.*fotografia/)

    await page.getByRole('link', { name: 'Novos lançamentos' }).click()
    await expect(page).toHaveURL(/tab=new/)

    // Refresh restaura tudo.
    await page.reload()
    await expect(page).toHaveURL(/tab=new/)
    await expect(page).toHaveURL(/sort=price_asc/)
    await expect(page.getByLabel('Fotografia')).toBeChecked()

    // Histórico: voltar desfaz a última mudança.
    await page.goBack()
    await expect(page).not.toHaveURL(/tab=new/)
    await expect(page).toHaveURL(/sort=price_asc/)
  })

  test('a URL com filtros restaura a lista ao abrir direto (desktop e mobile)', async ({ page }) => {
    // Arrays viajam como JSON na URL (serialização padrão do TanStack Router).
    await page.goto('/?collection=%5B%22fotografia%22%5D&sort=price_asc')
    await expect(page.getByRole('link', { name: /#\d+/ }).first()).toBeVisible()
    await page.reload()
    await expect(page).toHaveURL(/collection=.*fotografia/)
    await expect(page).toHaveURL(/sort=price_asc/)
    await expect(page.getByRole('link', { name: /#\d+/ }).first()).toBeVisible()
  })

  test('busca por texto e resultado vazio com limpeza de filtros', async ({ page }, info) => {
    test.skip(isMobile(info), 'A busca mobile fica na barra do topo; o fluxo desktop usa o diálogo do cabeçalho.')
    await page.goto('/')
    await page.getByRole('button', { name: 'Buscar' }).click()
    await page.getByRole('searchbox').fill('Emerald')
    await page.getByRole('button', { name: 'Buscar', exact: true }).last().click()
    await expect(page).toHaveURL(/q=Emerald/)
    await expect(page.getByRole('link', { name: /Emerald Ape #042/ }).first()).toBeVisible()

    await page.goto('/?q=zzzz')
    await expect(page.getByRole('heading', { name: 'Nenhum NFT encontrado' })).toBeVisible()
    await page.getByRole('button', { name: /limpar/i }).first().click()
    await expect(page).not.toHaveURL(/q=zzzz/)
    await expect(page.getByRole('link', { name: /#\d+/ }).first()).toBeVisible()
  })

  test('parâmetros inválidos na URL caem no padrão em vez de quebrar a rota', async ({ page }) => {
    await page.goto('/?page=abc&sort=nada&tab=x')
    await expect(page.getByRole('link', { name: /#\d+/ }).first()).toBeVisible()
  })
})
