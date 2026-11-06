import type { Nft, NftListQuery } from '@/api/contracts'
import { NftShowcase } from './NftShowcase'

/** "Mais desta coleção" (Figma 70364:239): outros NFTs da mesma coleção, vindos de `GET /nfts`. */
export function RelatedNfts({ nft }: { nft: Nft }) {
  const query: NftListQuery = { tab: 'all', collection: [nft.collection], network: [], sort: 'recent', page: 1, pageSize: 16 }
  return <NftShowcase id="mais-colecao" title="Mais desta coleção" query={query} exclude={[nft.id]} />
}
