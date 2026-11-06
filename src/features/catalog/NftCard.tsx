import { Link } from '@tanstack/react-router'
import type { NftSummary } from '@/api/contracts'
import { Skeleton } from '@/components/ui/skeleton'
import { formatEth } from '@/lib/eth'
import { cn } from '@/lib/utils'

/** Fundo do card mobile (Figma 70410:4136). No desktop o card é plano em surface-card. */
const MOBILE_CARD_BG = 'bg-[linear-gradient(139.5deg,#241612_12%,#2f1d15_106.6%)] md:bg-none md:bg-surface-card'

export function NftCard({ nft, priority = false }: { nft: NftSummary; priority?: boolean }) {
  return (
    <Link
      to="/nft/$nftId"
      params={{ nftId: nft.id }}
      className="group flex w-full max-w-[258px] flex-col gap-2 justify-self-center md:gap-3 lg:h-[356px]"
    >
      <div
        className={cn(
          'relative h-[200px] rounded-[20px] px-1 pt-3 pb-5 md:h-[300px] md:rounded-none md:pt-6 md:pb-[26px]',
          MOBILE_CARD_BG,
        )}
      >
        <img
          srcSet={nft.image.srcSet}
          sizes="(min-width: 768px) 258px, 50vw"
          src={nft.image.url}
          alt={nft.image.alt}
          width={250}
          height={250}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className={cn(
            'aspect-square w-full rounded-[16px] object-cover md:rounded-[15px]',
            nft.soldOut && 'opacity-60',
          )}
        />
        {nft.rare && !nft.soldOut && (
          <span className="absolute top-4 left-0 flex h-6 items-center bg-brand px-2 text-[13px] leading-4 font-medium text-ink md:hidden">
            RARO
          </span>
        )}
        {nft.soldOut && (
          <span className="absolute top-4 left-0 flex h-8 items-center bg-brand px-2 text-[13px] leading-4 font-medium text-ink">
            ESGOTADO
          </span>
        )}
      </div>
      <div className="flex flex-col pl-2 md:gap-3 md:pl-0">
        <p className="text-[15px] md:text-[16px] md:leading-4 group-hover:underline">{nft.title}</p>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[16px] leading-4 md:text-[18px]">
          <span className="font-bold whitespace-nowrap text-text-accent">{formatEth(nft.priceEth)} ETH</span>
          {nft.compareAtEth && (
            <span className="font-normal whitespace-nowrap text-brand-secondary">
              <span className="sr-only">preço anterior </span>
              {formatEth(nft.compareAtEth)} ETH
            </span>
          )}
        </p>
      </div>
    </Link>
  )
}

/** Mesmas dimensões do card real, para a troca por conteúdo não deslocar o layout (§8). */
export function NftCardSkeleton() {
  return (
    <div className="flex w-full max-w-[258px] flex-col gap-2 justify-self-center md:gap-3 lg:h-[356px]">
      <Skeleton className="h-[200px] rounded-[20px] md:h-[300px] md:rounded-none" />
      <div className="flex flex-col gap-2 pl-2 md:gap-3 md:pl-0">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
  )
}
