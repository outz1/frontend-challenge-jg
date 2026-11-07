import { Link, useRouter } from '@tanstack/react-router'
import { useAddToCart } from '@/api/queries/cart'
import type { Nft } from '@/api/contracts'
import linkedin from '@/assets/icons/share-linkedin.svg'
import message from '@/assets/icons/share-message.svg'
import twitter from '@/assets/icons/share-twitter.svg'
import { withEthUnit } from '@/lib/eth'
import { cn } from '@/lib/utils'
import { EditionPicker } from './EditionPicker'
import { FavoriteButton } from './FavoriteButton'
import { Gallery } from './Gallery'
import { QuantityStepper } from './QuantityStepper'
import { RelatedNfts } from './RelatedNfts'
import { Stars } from './Rating'
import type { Purchase } from './purchase'

/** Detalhe a partir de 768 px (Figma 10:244). */
export function DesktopDetail({ nft, purchase }: { nft: Nft; purchase: Purchase }) {
  const { edition, quantity, max, soldOut, message: limit } = purchase
  const attributes = nft.attributes.map((a) => a.value).join(', ')
  const router = useRouter()
  const add = useAddToCart()

  function buy() {
    if (soldOut || add.isPending) return // clique repetido não duplica a inclusão
    add.mutate(
      { nftId: nft.id, editionId: edition.id, quantity },
      { onSuccess: () => void router.navigate({ to: '/cart' }) },
    )
  }

  return (
    <div className="mx-auto hidden w-full max-w-page flex-col gap-24 px-4 pt-8 pb-16 md:flex min-[1240px]:px-0">
      <section className="flex flex-col gap-3" aria-labelledby="nft-title">
        <nav aria-label="Trilha de navegação" className="text-[15px] leading-4 font-bold text-text-foreground">
          <ol className="flex gap-1">
            <li>
              <Link to="/" className="hover:underline">
                Início
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link to="/" hash="catalogo" className="hover:underline">
                Mercado
              </Link>
            </li>
          </ol>
        </nav>

        <div className="flex flex-col gap-8 lg:flex-row">
          <Gallery nft={nft} />

          <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 lg:h-[448px]">
            <div className="flex flex-col gap-3">
              <h1 id="nft-title" className="text-[28px] font-bold text-text-foreground">
                {nft.title}
              </h1>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[22px] leading-4 font-bold text-text-accent">{withEthUnit(edition.priceEth)}</p>
                <p className="flex items-center gap-1 text-[15px] text-text-foreground">
                  <Stars average={nft.rating.average} />
                  <span>
                    <span className="sr-only">Nota {nft.rating.average} de 5, </span>
                    {nft.rating.count} avaliações de colecionadores
                  </span>
                </p>
              </div>
              <hr className="h-px border-0 bg-brand/30" />
            </div>

            <div className="flex flex-col gap-3">
              <h2 className="text-[15px] leading-4 font-bold text-text-foreground">Sobre este NFT:</h2>
              <p className="h-[66px] text-body text-text-secondary">{nft.description}</p>
            </div>

            <EditionPicker editions={nft.editions} value={edition.id} onChange={purchase.selectEdition} />

            <div className="relative">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <QuantityStepper value={quantity} max={max} onChange={purchase.setQuantity} />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={buy}
                    aria-disabled={soldOut || add.isPending}
                    className="h-10 w-[130px] rounded-[6px] bg-brand text-[14px] leading-5 font-bold text-ink aria-disabled:cursor-not-allowed aria-disabled:opacity-60"
                  >
                    {add.isPending ? 'ADICIONANDO…' : soldOut ? 'ESGOTADO' : 'COMPRAR'}
                  </button>
                  <FavoriteButton nftId={nft.id} />
                </div>
              </div>
              {/* O aviso de limite não ocupa espaço no fluxo: a coluna mantém os 448 px do Figma. */}
              <p role="status" className={cn('absolute top-full left-0 mt-1 text-[14px] leading-5 text-text-accent', !limit && 'sr-only')}>
                {limit}
              </p>
            </div>

            <div className="flex w-full max-w-[308px] flex-col gap-3">
              <ul className="flex flex-col gap-3 text-[15px] text-brand-secondary">
                <li>ID do token: {nft.tokenId}</li>
                <li>Coleção: {nft.collectionName}</li>
                <li>Atributos: {attributes}</li>
              </ul>
              <div className="flex items-center gap-2">
                <p className="text-[15px] leading-4 font-bold text-text-foreground">Compartilhar este NFT:</p>
                {[
                  { label: 'LinkedIn', icon: linkedin, w: 15, h: 14 },
                  { label: 'Mensagem', icon: message, w: 18, h: 18 },
                  { label: 'Twitter', icon: twitter, w: 16, h: 12 },
                ].map((share) => (
                  <button
                    key={share.label}
                    type="button"
                    aria-disabled="true"
                    aria-label={`Compartilhar no ${share.label} (indisponível nesta demonstração)`}
                    title="Indisponível nesta demonstração"
                    className="cursor-not-allowed"
                  >
                    <img src={share.icon} alt="" width={share.w} height={share.h} className="block" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="detalhes-titulo" className="flex flex-col gap-3">
        <div className="flex flex-col">
          <div className="flex flex-wrap gap-x-8 gap-y-2">
            <h2 id="detalhes-titulo" className="w-[161px] border-b-[3px] border-brand pb-3 text-[17px] leading-4 font-bold text-text-accent">
              Detalhes do NFT
            </h2>
            <button
              type="button"
              aria-disabled="true"
              title="Indisponível nesta demonstração"
              className="cursor-not-allowed text-[17px] leading-4 text-text-foreground"
            >
              Avaliações de colecionadores ({nft.rating.count})
            </button>
          </div>
          <hr className="h-px border-0 bg-brand/30" />
        </div>
        <div className="flex flex-col gap-3 text-body text-text-secondary">
          {nft.about.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <h3 className="mt-3 -mb-3 font-bold text-text-foreground">Rede:</h3>
          <p>
            Cunhado na {networkName(nft.network)} com procedência imutável e metadados armazenados no IPFS.
          </p>
          <h3 className="-mb-3 font-bold text-text-foreground">Contrato:</h3>
          <p>
            {nft.contract.address} • Contrato inteligente {nft.contract.standard} verificado.
          </p>
          <h3 className="-mb-3 font-bold text-text-foreground">Direitos autorais:</h3>
          <p>
            Direitos autorais do criador: {nft.contract.royaltyPercent}% nas vendas secundárias, pagos automaticamente
            pelos mercados compatíveis.
          </p>
        </div>
      </section>

      <RelatedNfts nft={nft} />
    </div>
  )
}

function networkName(network: Nft['network']) {
  return { ethereum: 'Ethereum', polygon: 'Polygon', solana: 'Solana' }[network]
}
