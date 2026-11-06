import { expect, test } from '@playwright/test'
import { addToCart, fillCheckout, login, mock, reviewOrder, sendOrder, visible } from './support'

test.describe('9. Mudança de preço ou disponibilidade via Socket.IO durante a compra', () => {
  test.setTimeout(90_000)

  test('o detalhe acompanha nft.updated sem recarregar', async ({ page }) => {
    await page.goto('/nft/nft-001')
    await expect(visible(page.getByRole('heading', { name: 'Emerald Ape #042' }))).toBeVisible()
    // Espera o cliente Socket.IO real assinar o NFT antes de mudar o recurso.
    await expect.poll(() => mock(page, (m) => m.connections().flatMap((c) => c.subs))).toContain('nft-001')
    await mock(page, (m) => m.updateNft('nft-001', 'nft-001-open', { priceEth: '3.33' }))
    await expect(visible(page.getByText('3.33 ETH'))).toBeVisible()
  })

  test('preço muda com o checkout aberto: resumo atualiza e a compra fecha pelo preço novo', async ({ page }) => {
    await login(page)
    await addToCart(page)
    await fillCheckout(page)
    await expect.poll(() => mock(page, (m) => m.connections().flatMap((c) => c.subs))).toContain('nft-001')
    await mock(page, (m) => m.updateNft('nft-001', 'nft-001-open', { priceEth: '3.33' }))
    await expect(page.getByText(/3\.342 ETH/)).toBeVisible()
    await reviewOrder(page)
    await sendOrder(page)
    await expect(page).toHaveURL(/\/order\/ord_/, { timeout: 25_000 })
    await expect(page.getByRole('dialog')).toContainText('3.33 ETH')
  })

  test('item esgota com o checkout aberto: a UI avisa e o envio fica bloqueado', async ({ page }) => {
    await login(page)
    await addToCart(page)
    await fillCheckout(page)
    await expect.poll(() => mock(page, (m) => m.connections().flatMap((c) => c.subs))).toContain('nft-001')
    await mock(page, (m) => m.updateNft('nft-001', 'nft-001-open', { available: 0 }))
    await expect(page.getByText(/não está mais disponível|indisponível|esgotad/i).first()).toBeVisible()
    await expect(page.getByRole('button', { name: /confirmar compra/i })).toHaveAttribute('aria-disabled', 'true')
  })
})
