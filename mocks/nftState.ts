import Big from 'big.js'
import { db, persist } from './db'
import type { NftRecord } from './fixtures/nfts'
import { maxFor } from './cart'

type Listener = (nft: NftRecord) => void
const listeners = new Set<Listener>()

/** Quem precisa saber de mudanças em NFTs (Socket.IO) se inscreve aqui; REST lê o mesmo `db`. */
export function onNftChanged(listener: Listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

type EditionPatch = { available?: number | null; priceEth?: string }

/**
 * Único caminho para mudar preço ou estoque de um NFT: atualiza o estado, recalcula os derivados,
 * sobe a versão, persiste e notifica. Assim REST e eventos nunca divergem (§6).
 */
export function mutateNft(nftId: string, patches: Record<string, EditionPatch>): NftRecord | null {
  const nft = db.nfts.find((n) => n.id === nftId)
  if (!nft) return null

  for (const edition of nft.editions) {
    const patch = patches[edition.id]
    if (!patch) continue
    if (patch.available !== undefined) edition.available = patch.available
    if (patch.priceEth !== undefined) edition.priceEth = patch.priceEth
  }

  const available = nft.editions.filter((e) => maxFor(e) > 0)
  nft.soldOut = available.length === 0
  const pool = available.length > 0 ? available : nft.editions
  nft.priceEth = pool.reduce((min, e) => (new Big(e.priceEth).lt(min) ? e.priceEth : min), pool[0].priceEth)
  nft.version += 1

  db.nftState[nft.id] = {
    version: nft.version,
    editions: Object.fromEntries(nft.editions.map((e) => [e.id, { available: e.available, priceEth: e.priceEth }])),
  }
  persist()
  listeners.forEach((l) => l(nft))
  return nft
}
