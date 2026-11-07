import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { addToCart, login } from './support'

/** Rotas públicas e privadas que o §8 cobre; as privadas exigem sessão e carrinho com item. */
const PUBLIC = ['/', '/?q=ape&collection=arte-digital', '/nft/nft-001', '/nft/nao-existe', '/rota-inexistente', '/login', '/signup']
const PRIVATE = ['/cart', '/checkout', '/profile', '/wallets']

async function ready(page: Page, path: string) {
  await page.goto(path)
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('status').filter({ hasText: /carregando/i })).toHaveCount(0)
}

async function violations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
  return violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)
}

const WIDTHS = [320, 390, 768, 1440]

async function enterWithCart(page: Page) {
  await login(page)
  await addToCart(page)
}

async function overflowAt(page: Page, paths: string[]) {
  const found: string[] = []
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 })
    for (const path of paths) {
      await ready(page, path)
      const { scroll, client } = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }))
      if (scroll > client) found.push(`${width}px ${path}: ${scroll} > ${client}`)
    }
  }
  return found
}

const withoutEmpty = (found: Record<string, string[]>) => Object.fromEntries(Object.entries(found).filter(([, list]) => list.length))

test.describe('14. Acessibilidade automática (axe, WCAG 2.1 AA) e reflow (§8)', () => {
  test.describe.configure({ timeout: 180_000 })

  test('telas públicas sem violação de WCAG 2.1 AA', async ({ page }) => {
    const found: Record<string, string[]> = {}
    for (const path of PUBLIC) {
      await ready(page, path)
      found[path] = await violations(page)
    }
    expect(withoutEmpty(found)).toEqual({})
  })

  test('telas privadas sem violação de WCAG 2.1 AA, inclusive com erros de validação visíveis', async ({ page }) => {
    await enterWithCart(page)
    const found: Record<string, string[]> = {}
    for (const path of PRIVATE) {
      await ready(page, path)
      found[path] = await violations(page)
    }
    await ready(page, '/checkout')
    await page.getByRole('button', { name: /confirmar compra/i }).filter({ visible: true }).first().click()
    await expect(page.getByRole('alert').first()).toBeVisible()
    found['/checkout (erros)'] = await violations(page)
    expect(withoutEmpty(found)).toEqual({})
  })

  // As larguras ficam no próprio teste (320 px equivale a zoom de 400% em 1280 px): basta um projeto.
  test('telas públicas sem overflow horizontal em 320, 390, 768 e 1440 px', async ({ page }, info) => {
    test.skip(info.project.name.includes('mobile'), 'Larguras definidas no teste.')
    expect(await overflowAt(page, PUBLIC)).toEqual([])
  })

  test('telas privadas sem overflow horizontal em 320, 390, 768 e 1440 px', async ({ page }, info) => {
    test.skip(info.project.name.includes('mobile'), 'Larguras definidas no teste.')
    await enterWithCart(page)
    expect(await overflowAt(page, PRIVATE)).toEqual([])
  })
})
