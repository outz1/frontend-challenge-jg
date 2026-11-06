import { useEffect } from 'react'
import { subscribeNfts } from './socket'

/** Assina `nft.updated` dos NFTs informados enquanto o componente estiver montado. */
export function useNftSubscription(ids: string[]) {
  // A chave por conteúdo evita reassinar a cada render com um array novo de mesmo conteúdo.
  const key = [...new Set(ids)].sort().join(',')
  useEffect(() => {
    if (!key) return
    return subscribeNfts(key.split(','))
  }, [key])
}
