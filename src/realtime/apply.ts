import type { QueryClient } from '@tanstack/react-query'
import {
  nftUpdatedEventSchema,
  orderSchema,
  orderUpdatedEventSchema,
  type Cart,
  type FeaturedResponse,
  type Nft,
  type NftListResponse,
  type NftUpdatedEvent,
  type Order,
  type OrderUpdatedEvent,
} from '@/api/contracts'
import { toast } from '@/components/ui/toast'
import { withEthUnit } from '@/lib/eth'

/** Quantos ids de evento lembrar para descartar reentrega (§7). */
const SEEN_LIMIT = 500

/** Estado de consumo de eventos. Um por conexão: nasce no login e morre no logout. */
export class EventLedger {
  private seen = new Set<string>()
  /** Maior versão já aplicada por recurso (`nft:<id>`), para ignorar evento antigo. */
  private versions = new Map<string, number>()

  /** `true` se o evento é novo e deve ser aplicado; registra o id. */
  accept(eventId: string, resource: string, version: number): boolean {
    if (this.seen.has(eventId)) return false // duplicata
    this.seen.add(eventId)
    if (this.seen.size > SEEN_LIMIT) this.seen.delete(this.seen.values().next().value as string)
    if (version <= (this.versions.get(resource) ?? -1)) return false // antigo
    this.versions.set(resource, version)
    return true
  }
}

type Change = { title: string; message: string }

/**
 * Aplica `nft.updated` ao cache: detalhe, listas, destaque e carrinho (§7).
 * Cada entrada só é atualizada se a versão do evento for maior que a que ela já tem,
 * então uma resposta REST mais nova nunca é sobrescrita por evento atrasado.
 */
export function applyNftUpdated(queryClient: QueryClient, raw: unknown, ledger: EventLedger) {
  const parsed = nftUpdatedEventSchema.safeParse(raw)
  if (!parsed.success) return // payload fora do contrato: ignora em vez de corromper o cache
  const event = parsed.data
  if (!ledger.accept(event.eventId, `nft:${event.resource.id}`, event.version)) return
  const id = event.resource.id

  queryClient.setQueriesData<Nft>({ queryKey: ['nfts', 'detail', id] }, (nft) => {
    if (!nft || event.version <= nft.version) return nft
    return {
      ...nft,
      version: event.version,
      priceEth: event.data.priceEth,
      compareAtEth: event.data.compareAtEth,
      soldOut: event.data.soldOut,
      editions: nft.editions.map((edition) => {
        const next = event.data.editions.find((e) => e.editionId === edition.id)
        return next ? { ...edition, priceEth: next.priceEth, available: next.available } : edition
      }),
    }
  })

  const patchSummary = <T extends { id: string; version: number }>(item: T): T =>
    item.id === id && event.version > item.version
      ? { ...item, version: event.version, priceEth: event.data.priceEth, compareAtEth: event.data.compareAtEth, soldOut: event.data.soldOut }
      : item

  queryClient.setQueriesData<NftListResponse>({ queryKey: ['nfts', 'list'] }, (list) =>
    list ? { ...list, items: list.items.map(patchSummary) } : list,
  )
  queryClient.setQueriesData<FeaturedResponse>({ queryKey: ['nfts', 'featured'] }, (featured) =>
    featured ? { hero: patchSummary(featured.hero), spotlight: patchSummary(featured.spotlight) } : featured,
  )

  // Ordem por preço pode ter mudado: marca as listas como velhas sem refazer as que ninguém está vendo.
  void queryClient.invalidateQueries({ queryKey: ['nfts', 'list'], refetchType: 'none' })

  const changes: Change[] = []
  queryClient.setQueriesData<Cart>({ queryKey: ['cart'] }, (cart) => {
    if (!cart) return cart
    let touched = false
    const items = cart.items.map((item) => {
      if (item.nftId !== id || event.version <= item.nftVersion) return item
      const next = event.data.editions.find((e) => e.editionId === item.editionId)
      if (!next) return item
      touched = true
      if (next.priceEth !== item.unitPriceEth) {
        changes.push({ title: item.title, message: `${item.title}: o preço mudou de ${withEthUnit(item.unitPriceEth)} para ${withEthUnit(next.priceEth)}.` })
      }
      if (next.available !== item.available) {
        changes.push({
          title: item.title,
          message:
            next.available === 0
              ? `${item.title} (${item.editionLabel}) esgotou.`
              : `${item.title}: a disponibilidade mudou${next.available === null ? '' : ` (restam ${next.available})`}.`,
        })
      }
      return { ...item, unitPriceEth: next.priceEth, available: next.available, nftVersion: event.version }
    })
    return touched ? { ...cart, items } : cart
  })

  if (changes.length > 0) {
    // A cotação do carrinho ficou velha: refaz o resumo e avisa o usuário em região viva (§7, cenário do carrinho).
    void queryClient.invalidateQueries({ queryKey: ['quote'] })
    for (const change of changes) toast.show(change.message, 'info', 9000)
  }
}

/** Aplica `order.updated`: atualiza o pedido e, ao terminar, o que a compra mexeu (carrinho e estoque). */
export function applyOrderUpdated(queryClient: QueryClient, raw: unknown, ledger: EventLedger, currentUserId: string | null) {
  const parsed = orderUpdatedEventSchema.safeParse(raw)
  if (!parsed.success) return
  const event: OrderUpdatedEvent = parsed.data
  // Defesa em profundidade: o servidor já isola por sala, mas evento de outro usuário é descartado (§7).
  if (!currentUserId || event.userId !== currentUserId) return
  if (!ledger.accept(event.eventId, `order:${event.resource.id}`, event.version)) return

  const key = ['orders', currentUserId, 'detail', event.resource.id]
  let applied = false
  queryClient.setQueryData<Order>(key, (order) => {
    if (!order || event.version <= order.version || order.status !== 'pending') return order
    applied = true
    const next = orderSchema.safeParse({
      ...order,
      status: event.data.status,
      txHash: event.data.txHash,
      explorerUrl: event.data.explorerUrl,
      rejectionReason: event.data.rejectionReason,
      version: event.version,
      updatedAt: event.occurredAt,
      settledAt: event.occurredAt,
    })
    return next.success ? next.data : order
  })

  // Sem o pedido em cache (outra tela), um refetch traz o estado oficial.
  if (!applied) void queryClient.invalidateQueries({ queryKey: key })
  void queryClient.invalidateQueries({ queryKey: ['orders', currentUserId, 'list'] })

  if (event.data.status === 'confirmed') {
    // A compra tirou itens do carrinho e baixou estoque no servidor.
    void queryClient.invalidateQueries({ queryKey: ['cart'] })
    void queryClient.invalidateQueries({ queryKey: ['nfts'], refetchType: 'active' })
    toast.success('Pedido confirmado.')
  } else if (event.data.status === 'rejected') {
    toast.error(event.data.rejectionReason ?? 'O pagamento foi recusado. Seus itens continuam no carrinho.')
  }
}

export type { NftUpdatedEvent }
