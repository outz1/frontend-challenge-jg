import { expect, test, type Page } from '@playwright/test'
import { ANA, BRUNO, addToCart, fillCheckout, isMobile, login, reviewOrder, sendOrder, setScenario } from './support'

async function logout(page: Page, mobile: boolean) {
  if (mobile) {
    await page.goto('/profile')
    await page.getByRole('button', { name: 'Sair' }).click()
  } else {
    await page.getByRole('banner').getByRole('button', { name: 'Sair' }).click()
  }
  await expect(page).toHaveURL(/\/$/)
}

test.describe('3. Conta e sessão', () => {
  test('cadastro cria a conta e abre a sessão; logout encerra', async ({ page }, info) => {
    await page.goto('/signup')
    await page.getByLabel('Nome de usuário').fill('colecionador_novo')
    await page.getByLabel('E-mail').fill('novo@kurio.test')
    await page.getByLabel('Senha', { exact: true }).fill('Kurio@777')
    await page.getByLabel('Confirmar senha').fill('Kurio@777')
    await page.getByRole('button', { name: /criar (conta|perfil)/i }).click()
    await expect(page).toHaveURL(/\/$/)
    await page.goto('/profile')
    await expect(page.getByLabel(/^E-mail/)).toHaveValue('novo@kurio.test')
    await logout(page, isMobile(info))
    await page.goto('/profile')
    await expect(page).toHaveURL(/\/login/)
  })

  test('cadastro com e-mail já usado e com confirmação diferente mostra o erro no campo', async ({ page }) => {
    await page.goto('/signup')
    await page.getByLabel('Nome de usuário').fill('outra_ana')
    await page.getByLabel('E-mail').fill(ANA.email)
    await page.getByLabel('Senha', { exact: true }).fill('Kurio@777')
    await page.getByLabel('Confirmar senha').fill('diferente')
    await page.getByRole('button', { name: /criar (conta|perfil)/i }).click()
    await expect(page.getByText(/não confere/i)).toBeVisible()
    await page.getByLabel('Confirmar senha').fill('Kurio@777')
    await page.getByRole('button', { name: /criar (conta|perfil)/i }).click()
    await expect(page.getByText(/já está em uso/i)).toBeVisible()
  })

  test('login inválido mostra erro; login correto devolve ao fluxo que pediu a sessão', async ({ page }) => {
    await page.goto('/profile')
    await expect(page).toHaveURL(/\/login\?redirect=/)
    await page.getByLabel(/e-mail/i).fill(ANA.email)
    await page.getByLabel(/senha/i).first().fill('errada')
    await page.getByRole('button', { name: /^entrar/i }).last().click()
    await expect(page.getByRole('alert').first()).toBeVisible()
    await page.getByLabel(/senha/i).first().fill(ANA.password)
    await page.getByRole('button', { name: /^entrar/i }).last().click()
    await expect(page).toHaveURL(/\/profile$/)
  })

  test('sessão expirada ao navegar leva ao login e retoma a rota', async ({ page }) => {
    await login(page)
    await setScenario(page, 'session-expired')
    await page.goto('/profile')
    await expect(page).toHaveURL(/\/login/)
    await page.getByLabel(/e-mail/i).fill(ANA.email)
    await page.getByLabel(/senha/i).first().fill(ANA.password)
    await page.getByRole('button', { name: /^entrar/i }).last().click()
    await expect(page).toHaveURL(/\/profile$/)
  })

  test('sessão expirada no checkout preserva o contexto e retoma depois do login', async ({ page }) => {
    test.setTimeout(60_000)
    await login(page)
    await addToCart(page)
    await fillCheckout(page)
    await reviewOrder(page)
    await setScenario(page, 'session-expired')
    await sendOrder(page)
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByText(/sessão expirou/i).first()).toBeVisible()
    await page.getByLabel(/e-mail/i).fill(ANA.email)
    await page.getByLabel(/senha/i).first().fill(ANA.password)
    await page.getByRole('button', { name: /^entrar/i }).last().click()
    await expect(page).toHaveURL(/\/checkout/)
    // O item continua no carrinho e nenhum pedido foi criado.
    await expect(page.getByRole('button', { name: /confirmar compra/i })).toBeVisible()
  })

  test('troca de usuário limpa o cache privado: carrinho e carteiras não vazam entre contas', async ({ page }, info) => {
    await login(page, ANA)
    await addToCart(page)
    await page.goto('/wallets')
    await expect(page.getByLabel('Apelido da carteira').first()).toHaveValue('Principal')
    await logout(page, isMobile(info))

    await login(page, BRUNO)
    await page.goto('/cart')
    await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
    await page.goto('/wallets')
    await expect(page.getByLabel('Apelido da carteira').first()).toHaveValue('Criador')
    await logout(page, isMobile(info))

    await login(page, ANA)
    await page.goto('/cart')
    await expect(page.getByRole('list', { name: /itens do carrinho/i }).locator('> li')).toHaveCount(1)
  })
})
