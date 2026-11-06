import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { featuredOptions } from '@/api/queries/nfts'
import { Skeleton } from '@/components/ui/skeleton'

/** Banner "NFT EM DESTAQUE" da sidebar (Figma 70410:3791), alimentado por `GET /nfts/featured`. */
export function FeaturedBanner() {
  const { data, isPending, isError } = useQuery(featuredOptions())

  return (
    <aside
      aria-labelledby="featured-title"
      className="relative w-full overflow-hidden bg-gradient-to-b from-brand/10 to-brand/[0.03] pt-6 pb-1"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 px-5">
          <h2 id="featured-title" className="text-heading leading-8 font-bold text-text-accent">
            NFT EM DESTAQUE
          </h2>
          <p className="text-center text-[22px] leading-4 font-bold text-text-foreground">OFERTA LIMITADA</p>
        </div>
        {data ? (
          <Link
            to="/nft/$nftId"
            params={{ nftId: data.spotlight.id }}
            className="relative block h-[368px] w-full"
          >
            <img
              srcSet={data.spotlight.image.srcSet}
              sizes="310px"
              src={data.spotlight.image.url}
              alt={data.spotlight.image.alt}
              width={310}
              height={368}
              className="size-full rounded-[22px] object-cover"
            />
            <span className="sr-only">Ver {data.spotlight.title}</span>
          </Link>
        ) : isError ? (
          <p role="alert" className="flex h-[368px] items-center justify-center px-5 text-center text-body text-text-secondary">
            Não foi possível carregar o destaque.
          </p>
        ) : (
          isPending && <Skeleton className="h-[368px] w-full rounded-[22px]" />
        )}
      </div>
      {/* Ornamentos do Figma (70410:3799 a 3801). */}
      <span aria-hidden="true" className="pointer-events-none absolute top-[299px] left-4 size-[22px] rounded-[7px] border-2 border-[#46a358] opacity-20" />
      <span aria-hidden="true" className="pointer-events-none absolute top-[343px] left-[248px] size-[45px] rounded-full bg-[linear-gradient(145deg,rgba(210,138,76,0.3)_46%,rgba(210,138,76,0)_103%)]" />
      <span aria-hidden="true" className="pointer-events-none absolute top-[105px] left-[38px] size-[15px] rounded-full bg-[linear-gradient(145deg,rgba(210,138,76,0.3)_46%,rgba(210,138,76,0)_103%)]" />
    </aside>
  )
}
