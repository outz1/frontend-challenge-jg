import { useState } from 'react'
import { Link, useCanGoBack, useRouter } from '@tanstack/react-router'
import { useAddToCart } from '@/api/queries/cart'
import type { Nft } from '@/api/contracts'
import backArrow from '@/assets/icons/m-back-arrow.svg'
import cartIcon from '@/assets/icons/m-cart.svg'
import mStar from '@/assets/icons/m-star.svg'
import { toast } from '@/components/ui/toast'
import { withEthUnit } from '@/lib/eth'
import { cn } from '@/lib/utils'
import { EditionPicker } from './EditionPicker'
import { FavoriteIconButton } from './FavoriteButton'
import { QuantityStepper } from './QuantityStepper'
import type { Purchase } from './purchase'

const ROUND_BTN = 'grid size-[35px] place-items-center rounded-full border border-line bg-[#2f1d15]'

/** Detalhe abaixo de 768 px (Figma 15:5536): hero, folha de detalhes e buy bar fixa. */
export function MobileDetail({ nft, purchase }: { nft: Nft; purchase: Purchase }) {
  const { edition, quantity, max, soldOut, message: limit } = purchase
  const [index, setIndex] = useState(0)
  const image = nft.gallery[index] ?? nft.gallery[0]
  const attributes = nft.attributes.map((a) => a.value).join(', ')
  const router = useRouter()
  const add = useAddToCart()
  const input = { nftId: nft.id, editionId: edition.id, quantity }
  const busy = soldOut || add.isPending

  return (
    <div className="md:hidden">
      <div className="relative -mb-[114px] h-[506px] bg-[linear-gradient(137.6deg,#241612_12%,#2f1d15_106.6%)] px-[26px] pt-[23px]">
        <div className="flex items-center justify-between pb-2">
          <BackButton />
          <FavoriteIconButton nftId={nft.id} title={nft.title} />
        </div>
        <img
          srcSet={image.srcSet}
          sizes="calc(100vw - 52px)"
          src={image.url}
          alt={image.alt}
          width={361}
          height={356}
          fetchPriority="high"
          className="h-[356px] w-full rounded-[24px] object-cover"
        />
        {/* Pontos sobre a base da imagem, como no Figma (15:5657); cada um troca a imagem. */}
        <ul aria-label="Imagens da galeria" className="absolute inset-x-0 top-[355px] z-10 flex items-center justify-center gap-[6px]">
          {nft.gallery.map((_, i) => (
            <li key={i}>
              <button
                type="button"
                aria-label={`Ver imagem ${i + 1} de ${nft.gallery.length}`}
                aria-pressed={i === index}
                onClick={() => setIndex(i)}
                className="grid size-5 place-items-center"
              >
                <span className={cn('block size-[7px] rounded-full', i === index ? 'bg-brand' : 'bg-text-foreground/60')} />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <section
        aria-labelledby="m-nft-title"
        className="relative flex min-h-[504px] flex-col gap-3 rounded-t-[31px] bg-surface-card px-6 pt-8 pb-[190px]"
      >
        <div className="flex items-center justify-between gap-3">
          <h1 id="m-nft-title" className="text-[20px] leading-5 font-bold text-text-foreground">
            {nft.title}
          </h1>
          <p className="flex shrink-0 items-center gap-1 rounded-[32px] border border-brand px-[6px] py-[5px] text-[14px] leading-4 text-text-secondary">
            <img src={mStar} alt="" width={12} height={11} className="block" />
            <span className="font-medium text-text-foreground">
              <span className="sr-only">Nota </span>
              {nft.rating.average}
            </span>
            <span>
              <span className="sr-only"> de 5, </span>({nft.rating.count})
              <span className="sr-only"> avaliações</span>
            </span>
          </p>
        </div>
        <p className="text-body text-text-secondary">{nft.description}</p>
        <EditionPicker editions={nft.editions} value={edition.id} onChange={purchase.selectEdition} />
        <ul className="flex flex-col gap-3 text-[15px] text-brand-secondary">
          <li>ID do token: {nft.tokenId}</li>
          <li>Coleção: {nft.collectionName}</li>
          <li>Atributos: {attributes}</li>
        </ul>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-30 flex flex-col gap-5 rounded-t-[40px] bg-surface-card px-6 pt-5 pb-9 shadow-[0_0_10px_rgba(10,6,4,0.45)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[15px] leading-4 font-medium text-text-secondary">Qtd.</span>
            <QuantityStepper variant="compact" value={quantity} max={max} onChange={purchase.setQuantity} />
          </div>
          <p className="text-[20px] leading-4 font-bold text-text-accent">{withEthUnit(edition.priceEth)}</p>
        </div>
        <p role="status" className={cn('-mt-3 text-[13px] leading-4 text-text-accent', !limit && 'sr-only')}>
          {limit}
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-disabled={busy}
            onClick={() => !busy && add.mutate(input, { onSuccess: () => void router.navigate({ to: '/cart' }) })}
            className="h-[60px] w-[196px] rounded-[40px] bg-[linear-gradient(100deg,#d28a4c_4%,rgba(210,138,76,0.8)_122%)] text-[16px] leading-5 font-bold text-ink aria-disabled:cursor-not-allowed aria-disabled:opacity-60"
          >
            {add.isPending ? 'Adicionando…' : soldOut ? 'Esgotado' : 'Comprar NFT'}
          </button>
          <button
            type="button"
            aria-disabled={busy}
            aria-label="Adicionar ao carrinho"
            onClick={() => !busy && add.mutate(input, { onSuccess: () => toast.success(`${nft.title} adicionado ao carrinho.`) })}
            className="grid size-[60px] place-items-center rounded-[40px] border border-line bg-[#2f1d15] aria-disabled:cursor-not-allowed aria-disabled:opacity-60"
          >
            <img src={cartIcon} alt="" width={20} height={20} className="block" />
          </button>
        </div>
      </div>
    </div>
  )
}

/** Volta no histórico quando há para onde voltar; em acesso direto leva ao Início. */
function BackButton() {
  const router = useRouter()
  const canGoBack = useCanGoBack()
  const content = <img src={backArrow} alt="" width={13} height={7} className="block rotate-90" />
  return canGoBack ? (
    <button type="button" aria-label="Voltar" onClick={() => router.history.back()} className={ROUND_BTN}>
      {content}
    </button>
  ) : (
    <Link to="/" aria-label="Voltar ao início" className={ROUND_BTN}>
      {content}
    </Link>
  )
}
