import { createFileRoute } from '@tanstack/react-router'
import { nftDetailOptions } from '@/api/queries/nfts'
import { NftDetailPage } from '@/features/nft/NftDetailPage'

export const Route = createFileRoute('/nft/$nftId')({
  // Dispara o fetch já na navegação (inclusive no preload por intenção), sem bloquear a tela:
  // o componente mostra o skeleton enquanto a query resolve.
  loader: ({ context, params }) => {
    void context.queryClient.prefetchQuery(nftDetailOptions(params.nftId))
  },
  component: NftDetailRoute,
})

function NftDetailRoute() {
  const { nftId } = Route.useParams()
  return <NftDetailPage nftId={nftId} />
}
