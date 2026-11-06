import { expect, test } from '@playwright/test'
import { addToCart, apiGet, fillCheckout, login, mock, reviewOrder, sendOrder, visible } from './support'

test.describe('6. Compra completa do catálogo ao recibo confirmado', () => {
  test('catálogo, detalhe, carrinho, pagamento, revisão e recibo', async ({ page }) => {
    test.setTimeout(60_000)
    await login(page)
    await page.goto('/')
    await page.getByRole('link', { name: /Emerald Ape #042/ }).first().click()
    await expect(page).toHaveURL(/\/nft\/nft-001/)
    await page.getByRole('button', { name: /comprar/i }).first().click()
    await expect(page).toHaveURL(/\/cart$/)
    await expect(visible(page.getByText('Emerald Ape #042'))).toBeVisible()
    await page.getByRole('link', { name: /conectar e finalizar/i }).click()
    await expect(page).toHaveURL(/\/checkout/)

    await fillCheckout(page)
    await reviewOrder(page)
    await sendOrder(page)

    // Confirmação só chega com a resposta da simulação (§3): primeiro o pedido pendente, depois o recibo.
    await expect(page.getByText(/aguardando a confirmação/i)).toBeVisible()
    await expect(page).toHaveURL(/\/order\/ord_/, { timeout: 20_000 })
    await expect(page.getByText('Seus NFTs agora estão na sua carteira')).toBeVisible()
    await expect(page.getByRole('dialog').getByText('MetaMask').first()).toBeVisible()
    await expect(page.getByRole('dialog').getByText('ID do token: #0042').first()).toBeVisible()

    // Só o que foi comprado sai do carrinho.
    const cart = await apiGet<{ items: unknown[] }>(page, '/cart')
    expect(cart.body.items).toHaveLength(0)
    const orders = await apiGet<{ items: { status: string }[] }>(page, '/orders')
    expect(orders.body.items).toHaveLength(1)
    expect(orders.body.items[0].status).toBe('confirmed')
  })

  test('o recibo é um snapshot: não muda quando o preço do catálogo muda depois', async ({ page }) => {
    test.setTimeout(60_000)
    await login(page)
    await addToCart(page)
    await fillCheckout(page)
    await reviewOrder(page)
    await sendOrder(page)
    await expect(page).toHaveURL(/\/order\/ord_/, { timeout: 20_000 })
    const receipt = await page.getByRole('dialog').innerText()
    expect(receipt).toContain('1.19 ETH')

    await mock(page, (m) => m.updateNft('nft-001', 'nft-001-open', { priceEth: '7.77' }))
    await page.reload()
    await expect(page.getByRole('dialog')).toContainText('1.19 ETH')
    await expect(page.getByRole('dialog')).not.toContainText('7.77')
  })

  test('recibo de pedido de outro usuário não abre', async ({ page, browser }) => {
    test.setTimeout(60_000)
    await login(page)
    await addToCart(page)
    await fillCheckout(page)
    await reviewOrder(page)
    await sendOrder(page)
    await expect(page).toHaveURL(/\/order\/ord_/, { timeout: 20_000 })
    const url = page.url()
    // Contexto novo: visitante é levado ao login e o pedido nunca aparece.
    const other = await browser.newContext()
    const guest = await other.newPage()
    await guest.goto(url)
    await expect(guest).toHaveURL(/\/login/)
    await other.close()
  })
})
