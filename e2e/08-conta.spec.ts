import { expect, test } from '@playwright/test'
import { writeFileSync } from 'node:fs'
import { ANA, BRUNO, login } from './support'

const save = (page: import('@playwright/test').Page) => page.getByRole('button', { name: /^salvar$/i })
const toasts = (page: import('@playwright/test').Page) => page.getByRole('region', { name: /notificações/i })

test.describe('8. Perfil, avatar, senha e carteiras', () => {
  test('perfil: validação por campo, usuário em uso e persistência', async ({ page }) => {
    await login(page)
    await page.goto('/profile')
    await page.getByLabel('Nome de exibição').fill('')
    await page.getByLabel(/^Nome de usuário/).fill('a!')
    await save(page).click()
    const form = page.getByRole('form', { name: 'Perfil do colecionador' })
    await expect(form).toContainText('Informe o nome de exibição')
    await expect(form).toContainText('3 a 20')
    await expect(page.getByLabel('Nome de exibição')).toBeFocused()

    await page.getByLabel('Nome de exibição').fill('Ana Atualizada')
    await page.getByLabel(/^Nome de usuário/).fill('bruno_criador')
    await save(page).click()
    await expect(form).toContainText('já está em uso')

    await page.getByLabel(/^Nome de usuário/).fill('ana_nova')
    await save(page).click()
    await expect(toasts(page)).toContainText('Perfil atualizado')
    await page.reload()
    await expect(page.getByLabel('Nome de exibição')).toHaveValue('Ana Atualizada')
  })

  test('senha: confirmação, senha atual incorreta, troca e login com a nova', async ({ page }) => {
    await login(page)
    await page.goto('/profile')
    await page.getByLabel('Senha atual').fill('errada123')
    await page.getByLabel('Nova senha', { exact: true }).fill('Novissima@1')
    await page.getByLabel('Confirmar nova senha').fill('Novissima@2')
    await save(page).click()
    await expect(page.getByText(/não confere/i)).toBeVisible()
    await page.getByLabel('Confirmar nova senha').fill('Novissima@1')
    await save(page).click()
    await expect(page.getByRole('form', { name: 'Perfil do colecionador' })).toContainText(/incorreta/i)
    await page.getByLabel('Senha atual').fill(ANA.password)
    await save(page).click()
    await expect(toasts(page)).toContainText(/senha atualizados/i)
    await page.getByRole('button', { name: 'Sair' }).first().click()
    await login(page, { email: ANA.email, password: 'Novissima@1' })
  })

  test('avatar: envia, recusa formato inválido e remove', async ({ page }, info) => {
    await login(page)
    await page.goto('/profile')
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')
    await page.locator('input[type=file]').setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: png })
    await expect(page.getByAltText('Avatar do colecionador')).toBeVisible()
    const txt = info.outputPath('nao-imagem.txt')
    writeFileSync(txt, 'não sou imagem')
    await page.locator('input[type=file]').setInputFiles(txt)
    await expect(page.getByText(/PNG, JPEG ou WebP/)).toBeVisible()
    await page.getByRole('button', { name: /remover/i }).click()
    await expect(page.getByAltText('Avatar do colecionador')).toHaveCount(0)
  })

  test('carteiras: editar a principal, endereço inválido para a rede e secundária igual à principal', async ({ page }) => {
    await login(page, BRUNO)
    await page.goto('/wallets')
    const alias = page.getByLabel('Apelido da carteira').first()
    await expect(alias).toHaveValue('Criador')
    await page.getByLabel('Endereço da carteira').first().fill('0x123')
    await page.getByRole('button', { name: /salvar carteira/i }).first().click()
    await expect(page.getByRole('form', { name: 'Carteira principal' })).toContainText('Endereço inválido')
    await page.getByLabel('Endereço da carteira').first().fill('DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy')
    await alias.fill('Criador Pro')
    await page.getByRole('button', { name: /salvar carteira/i }).first().click()
    await expect(toasts(page)).toContainText('Carteira atualizada')

    await page.getByText('Igual à carteira principal').click()
    await page.getByRole('button', { name: /^adicionar$/i }).click()
    await expect(page.getByLabel('Apelido da carteira')).toHaveCount(2)
    await expect(page.getByLabel('Apelido da carteira').nth(1)).toHaveValue('Criador Pro')
    await page.reload()
    await expect(page.getByRole('button', { name: /salvar carteira/i })).toHaveCount(2)
  })

  test('carteiras de um usuário não aparecem para outro', async ({ page }) => {
    await login(page, ANA)
    await page.goto('/wallets')
    await expect(page.getByLabel('Apelido da carteira').first()).toHaveValue('Principal')
    await expect(page.getByLabel('Apelido da carteira').nth(1)).toHaveValue('Reserva')
  })
})
