import { useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import type { NftListQuery } from '@/api/contracts'
import { nftListOptions } from '@/api/queries/nfts'
import { Skeleton } from '@/components/ui/skeleton'
import { formatEth } from '@/lib/eth'
import { cn } from '@/lib/utils'

const PER_PAGE = 5
const GAP = 24

type Props = {
  id: string
  title: string
  query: NftListQuery
  /** Itens que não devem aparecer (o próprio NFT ou o que já está no carrinho). */
  exclude?: string[]
  /** `detail` é "Mais desta coleção" (70364:239); `cart` é "Colecionadores também viram" (70371:239). */
  variant?: 'detail' | 'cart'
}

/**
 * Carrossel de NFTs com cinco cartões por página. Cada página é um ponto de paginação real, operável por
 * teclado; sem mais de uma página os pontos não aparecem, e sem itens a seção inteira some.
 */
export function NftShowcase({ id, title, query, exclude = [], variant = 'detail' }: Props) {
  const { data, isPending, isError } = useQuery(nftListOptions(query))
  const items = data?.items.filter((item) => !exclude.includes(item.id)).slice(0, PER_PAGE * 3) ?? []
  const list = useRef<HTMLUListElement>(null)
  const [page, setPage] = useState(0)
  const pages = Math.ceil(items.length / PER_PAGE)

  if (!isPending && (isError || items.length === 0)) return null

  const go = (next: number) => {
    const el = list.current
    if (el) el.scrollTo({ left: next * (el.clientWidth + GAP), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }

  return (
    <section aria-labelledby={id} className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <h2 id={id} className="text-[17px] leading-4 font-bold text-text-accent">
          {title}
        </h2>
        <hr className="h-px border-0 bg-brand/30" />
      </div>
      <ul
        ref={list}
        onScroll={(e) => setPage(Math.round(e.currentTarget.scrollLeft / (e.currentTarget.clientWidth + GAP)))}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {isPending
          ? Array.from({ length: PER_PAGE }, (_, i) => (
              <li key={i} aria-hidden="true" className="flex w-[calc((100%-96px)/5)] shrink-0 flex-col gap-3">
                <Skeleton className="h-[255px] rounded-none" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/3" />
              </li>
            ))
          : items.map((item) => (
              <li key={item.id} className="w-[calc((100%-96px)/5)] shrink-0 snap-start">
                <Link to="/nft/$nftId" params={{ nftId: item.id }} className="group flex flex-col gap-2">
                  <div className={cn('h-[255px] bg-surface-card', variant === 'cart' ? 'grid place-items-center' : 'px-1 pt-4 pb-7')}>
                    <img
                      src={item.image.url}
                      alt={item.image.alt}
                      width={213}
                      height={213}
                      loading="lazy"
                      decoding="async"
                      className={cn('object-cover', variant === 'cart' ? 'size-[212px] rounded-[17px]' : 'size-full rounded-[13px]')}
                    />
                  </div>
                  <span className="flex flex-col gap-2">
                    <span className="text-[15px] group-hover:underline">{item.title}</span>
                    <span className="text-[16px] leading-4 font-bold text-text-accent">{formatEth(item.priceEth)} ETH</span>
                  </span>
                </Link>
              </li>
            ))}
      </ul>
      {pages > 1 && (
        <div role="group" aria-label="Páginas do carrossel" className="flex items-center justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Ir para o grupo ${i + 1} de ${pages}`}
              aria-current={i === page ? 'true' : undefined}
              onClick={() => go(i)}
              className={cn('size-3 rounded-full border border-brand', i === page && 'bg-brand')}
            />
          ))}
        </div>
      )}
    </section>
  )
}
