import { useState } from 'react'
import type { Edition, Nft } from '@/api/contracts'

export type Limit = {
  /** Máximo que o usuário pode pedir desta edição agora (0 = esgotada). */
  max: number
  reason: 'soldout' | 'availability' | 'order'
}

/** Regra de limite: o menor entre a disponibilidade da edição e o teto por pedido (§3). */
export function limitFor(edition: Edition): Limit {
  const { available, maxPerOrder } = edition
  if (available !== null && available <= 0) return { max: 0, reason: 'soldout' }
  if (available !== null && available < maxPerOrder) return { max: available, reason: 'availability' }
  return { max: maxPerOrder, reason: 'order' }
}

/** Mensagem exibida quando a quantidade chegou ao limite ou a edição está esgotada. */
export function limitMessage(edition: Edition, quantity: number): string | null {
  const { max, reason } = limitFor(edition)
  if (reason === 'soldout') return 'Esta edição está esgotada. Escolha outra edição.'
  if (quantity < max) return null
  if (reason === 'availability') return `Restam apenas ${max} ${max === 1 ? 'unidade' : 'unidades'} desta edição.`
  return `Limite de ${max} ${max === 1 ? 'unidade' : 'unidades'} por pedido.`
}

/** Edição aberta quando houver estoque; senão a primeira com estoque; senão a primeira. */
function defaultEdition(editions: Edition[]): Edition {
  const open = editions.find((e) => e.kind === 'open' && limitFor(e).max > 0)
  return open ?? editions.find((e) => limitFor(e).max > 0) ?? editions[0]
}

/** Seleção de edição e quantidade. A quantidade é derivada do limite atual, sem efeito de sincronização. */
export function usePurchase(nft: Nft) {
  const [editionId, setEditionId] = useState(() => defaultEdition(nft.editions).id)
  const [requested, setRequested] = useState(1)

  const edition = nft.editions.find((e) => e.id === editionId) ?? nft.editions[0]
  const { max } = limitFor(edition)
  const quantity = max === 0 ? 1 : Math.min(Math.max(requested, 1), max)

  return {
    edition,
    max,
    quantity,
    soldOut: max === 0,
    message: limitMessage(edition, quantity),
    selectEdition: setEditionId,
    setQuantity: (next: number) => setRequested(Math.min(Math.max(next, 1), Math.max(max, 1))),
  }
}
export type Purchase = ReturnType<typeof usePurchase>
