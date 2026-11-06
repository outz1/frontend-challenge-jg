import { expect, test } from '@playwright/test'
import { apiGet, readyToPay, sendOrder, setScenario } from './support'

type Orders = { items: { id: string; status: string }[] }

test.describe('7. Falhas de pagamento, clique repetido e recuperação', () => {
  test.setTimeout(90_000)

  test('pagamento recusado preserva o carrinho e permite nova tentativa', async ({ page }) => {
    await readyToPay(page)
    await setScenario(page, 'payment-declined')
    await sendOrder(page)
    await expect(page.getByText(/pagamento recusado/i).first()).toBeVisible({ timeout: 25_000 })
    const cart = await apiGet<{ items: unknown[] }>(page, '/cart')
    expect(cart.body.items).toHaveLength(1)
    await page.getByRole('button', { name: /tentar novamente|novamente|revis/i }).first().click()
    await sendOrder(page)
    await expect(page).toHaveURL(/\/order\/ord_/, { timeout: 25_000 })
  })

  test('clique repetido em "Enviar pedido" cria um único pedido', async ({ page }) => {
    await readyToPay(page)
    const send = page.getByRole('button', { name: /enviar pedido/i })
    await send.dblclick()
    await expect(page).toHaveURL(/\/order\/ord_/, { timeout: 25_000 })
    const orders = await apiGet<Orders>(page, '/orders')
    expect(orders.body.items).toHaveLength(1)
  })

  test('timeout depois de criar o pedido: recupera o mesmo pedido sem comprar de novo', async ({ page }) => {
    await readyToPay(page)
    await setScenario(page, 'order-timeout')
    await sendOrder(page)
    await expect(page.getByText(/não será duplicado|não recebemos a resposta/i).first()).toBeVisible({ timeout: 40_000 })
    const before = await apiGet<Orders>(page, '/orders')
    expect(before.body.items).toHaveLength(1)
    await page.getByRole('button', { name: /verificar pedido/i }).click()
    await expect(page).toHaveURL(/\/order\/ord_/, { timeout: 25_000 })
    const after = await apiGet<Orders>(page, '/orders')
    expect(after.body.items).toHaveLength(1)
    expect(page.url()).toContain(before.body.items[0].id)
  })

  test('cotação desatualizada exige nova confirmação e não cria pedido', async ({ page }) => {
    await readyToPay(page)
    await setScenario(page, 'price-changed')
    await sendOrder(page)
    await expect(page.getByText(/valores mudaram/i).first()).toBeVisible({ timeout: 25_000 })
    expect((await apiGet<Orders>(page, '/orders')).body.items).toHaveLength(0)
    await expect(page.getByRole('button', { name: /confirmar novos valores/i })).toHaveAttribute('aria-disabled', 'false', { timeout: 15_000 })
    await sendOrder(page)
    await expect(page).toHaveURL(/\/order\/ord_/, { timeout: 25_000 })
  })

  test('edição esgotada durante a compra bloqueia o pedido e leva ao carrinho', async ({ page }) => {
    await readyToPay(page)
    await setScenario(page, 'sold-out-during-purchase')
    await sendOrder(page)
    await expect(page.getByText(/carrinho para ajustar|não está mais/i).first()).toBeVisible({ timeout: 25_000 })
    expect((await apiGet<Orders>(page, '/orders')).body.items).toHaveLength(0)
    await expect(page.getByRole('link', { name: /voltar ao carrinho/i })).toBeVisible()
  })

  test('conexão da carteira recusada mostra o aviso e não cria pedido', async ({ page }) => {
    await readyToPay(page)
    await setScenario(page, 'wallet-rejected')
    await sendOrder(page)
    await expect(page.getByText(/recusada na carteira|conexão foi recusada/i).first()).toBeVisible({ timeout: 15_000 })
    expect((await apiGet<Orders>(page, '/orders')).body.items).toHaveLength(0)
  })
})
