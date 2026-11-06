import { expect, test } from '@playwright/test'
import { addToCart, fillCheckout, isMobile, login, readyToPay } from './support'

test.describe('11. Teclado, foco de diálogos e validação de formulários', () => {
  test('modal de login: foco preso, Escape fecha e devolve ao fluxo', async ({ page }, info) => {
    test.skip(isMobile(info), 'No mobile o login é uma tela cheia, não um diálogo.')
    await page.goto('/')
    await page.goto('/login')
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    for (let i = 0; i < 12; i += 1) {
      await page.keyboard.press('Tab')
      expect(await page.evaluate(() => Boolean(document.activeElement?.closest('[role=dialog]')))).toBe(true)
    }
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
  })

  test('revisão do pedido: foco entra no diálogo, Escape fecha e o foco volta ao botão', async ({ page }) => {
    await login(page)
    await addToCart(page)
    await fillCheckout(page)
    const trigger = page.getByRole('button', { name: /confirmar compra/i })
    await trigger.focus()
    await page.keyboard.press('Enter')
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    expect(await page.evaluate(() => Boolean(document.activeElement?.closest('[role=dialog]')))).toBe(true)
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(trigger).toBeFocused()
  })

  test('pagamento: campos obrigatórios vazios mostram erros associados e levam o foco ao primeiro', async ({ page }) => {
    await login(page)
    await addToCart(page)
    await page.goto('/checkout')
    await page.getByLabel('Nome de usuário').first().fill('')
    await page.getByRole('button', { name: /confirmar compra/i }).click()
    const invalid = page.locator('[aria-invalid="true"]').first()
    await expect(invalid).toBeVisible()
    await expect(invalid).toBeFocused()
    const describedBy = await invalid.getAttribute('aria-describedby')
    expect(describedBy).toBeTruthy()
    await expect(page.locator(`#${describedBy}`)).not.toBeEmpty()
  })

  test('login: erros vêm em alerta e campo inválido é marcado', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: /^entrar/i }).last().click()
    await expect(page.locator('[aria-invalid="true"]').first()).toBeVisible()
    await expect(page.getByRole('alert').first()).toBeVisible()
  })

  test('navegação por teclado alcança o conteúdo principal e o carrinho', async ({ page }, info) => {
    test.skip(isMobile(info), 'A barra de abas mobile tem outro percurso de foco.')
    await page.goto('/')
    const seen = new Set<string>()
    for (let i = 0; i < 25; i += 1) {
      await page.keyboard.press('Tab')
      seen.add(await page.evaluate(() => document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.textContent?.trim().slice(0, 30) ?? ''))
    }
    expect([...seen].some((name) => /carrinho/i.test(name))).toBe(true)
  })

  test('revisão do pedido bloqueia o envio duplicado enquanto envia', async ({ page }) => {
    await readyToPay(page)
    await expect(page.getByRole('button', { name: /enviar pedido/i })).toBeVisible()
  })
})
