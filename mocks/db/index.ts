import { buildNftFixtures, type NftRecord } from '../fixtures/nfts'

/**
 * Estado em memória do mock. REST e eventos leem daqui, então uma mudança aparece nos dois (§6).
 * Persistência local e reset completo entram junto com sessão e carrinho.
 */
export const db = {
  nfts: buildNftFixtures() as NftRecord[],
}

export function resetDb() {
  db.nfts = buildNftFixtures()
}
