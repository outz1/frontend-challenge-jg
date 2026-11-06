import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import type { Nft, NftListQuery } from '@/api/contracts'
import { nftListOptions } from '@/api/queries/nfts'
import { Skeleton } from '@/components/ui/skeleton'
import { formatEth } from '@/lib/eth'

const RELATED_COUNT = 5

/** "Mais desta coleção" (Figma 70364:239): outros NFTs da mesma coleção, vindos de `GET /nfts`. */
export function RelatedNfts({ nft }: { nft: Nft }) {
  const query: NftListQuery = {
    tab: 'all',
    collection: [nft.collection],
    network: [],
    sort: 'recent',
    page: 1,
    pageSize: RELATED_COUNT + 1,
  }
  const { data, isPending, isError } = useQuery(nftListOptions(query))
  const items = data?.items.filter((item) => item.id !== nft.id).slice(0, RELATED_COUNT) ?? []

  // Sem outros itens na coleção a seção inteira some, em vez de mostrar um título vazio.
  if (!isPending && (isError || items.length === 0)) return null

  return (
    <section aria-labelledby="mais-colecao" className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <h2 id="mais-colecao" className="text-[17px] leading-4 font-bold text-text-accent">
          Mais desta coleção
        </h2>
        <hr className="border-0 border-t-[0.3px] border-brand" />
      </div>
      <ul className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
        {isPending
          ? Array.from({ length: RELATED_COUNT }, (_, i) => (
              <li key={i} aria-hidden="true" className="flex flex-col gap-3">
                <Skeleton className="h-[255px] rounded-none" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/3" />
              </li>
            ))
          : items.map((item) => (
              <li key={item.id}>
                <Link to="/nft/$nftId" params={{ nftId: item.id }} className="group flex flex-col gap-3">
                  <div className="h-[255px] bg-surface-card px-1 pt-4 pb-7">
                    <img
                      src={item.image.url}
                      alt={item.image.alt}
                      width={213}
                      height={213}
                      loading="lazy"
                      decoding="async"
                      className="size-full rounded-[13px] object-cover"
                    />
                  </div>
                  <span className="flex flex-col">
                    <span className="text-[15px] group-hover:underline">{item.title}</span>
                    <span className="text-[16px] leading-4 font-bold text-text-accent">{formatEth(item.priceEth)} ETH</span>
                  </span>
                </Link>
              </li>
            ))}
      </ul>
    </section>
  )
}
