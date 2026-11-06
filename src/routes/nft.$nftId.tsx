import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/nft/$nftId')({
  component: NftDetailPlaceholder,
})

function NftDetailPlaceholder() {
  const { nftId } = Route.useParams()
  return (
    <section className="mx-auto max-w-page px-4 py-16">
      <h1 className="text-heading font-bold">NFT {nftId}</h1>
    </section>
  )
}
