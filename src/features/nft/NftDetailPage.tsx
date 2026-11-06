import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ApiRequestError } from '@/api/client'
import type { Nft } from '@/api/contracts'
import { nftDetailOptions } from '@/api/queries/nfts'
import { DesktopDetail } from './DesktopDetail'
import { DetailSkeleton } from './DetailSkeleton'
import { MobileDetail } from './MobileDetail'
import { usePurchase } from './purchase'
import { useNftSubscription } from '@/realtime/useNftSubscription'

export function NftDetailPage({ nftId }: { nftId: string }) {
  const query = useQuery(nftDetailOptions(nftId))

  if (query.isPending) return <DetailSkeleton />

  if (query.isError) {
    if (query.error instanceof ApiRequestError && query.error.code === 'not_found') return <NftNotFound />
    return <NftLoadError onRetry={() => void query.refetch()} />
  }

  // `key` zera edição e quantidade ao navegar entre NFTs.
  return <NftDetail key={query.data.id} nft={query.data} />
}

function NftDetail({ nft }: { nft: Nft }) {
  const purchase = usePurchase(nft)
  useNftSubscription([nft.id])
  return (
    <>
      <DesktopDetail nft={nft} purchase={purchase} />
      <MobileDetail nft={nft} purchase={purchase} />
    </>
  )
}

function NftNotFound() {
  return (
    <section className="mx-auto flex max-w-page flex-col items-center gap-4 px-6 py-24 text-center">
      <p className="text-[14px] tracking-[0.1em] text-text-accent">ERRO 404</p>
      <h1 className="text-heading font-bold text-text-foreground">NFT não encontrado</h1>
      <p className="max-w-[420px] text-body text-text-secondary">
        Este NFT não existe ou foi removido do catálogo. Volte ao início para continuar explorando.
      </p>
      <Link to="/" className="rounded-[6px] bg-brand px-7 py-[10px] text-[16px] font-bold text-ink">
        Voltar ao início
      </Link>
    </section>
  )
}

function NftLoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <section role="alert" className="mx-auto flex max-w-page flex-col items-center gap-4 px-6 py-24 text-center">
      <h1 className="text-heading font-bold text-text-foreground">Algo deu errado</h1>
      <p className="max-w-[420px] text-body text-text-secondary">
        Não foi possível carregar este NFT. Verifique a conexão e tente novamente.
      </p>
      <div className="flex gap-3">
        <button type="button" onClick={onRetry} className="rounded-[6px] bg-brand px-4 py-2 text-[16px] font-bold text-ink">
          Tentar novamente
        </button>
        <Link to="/" className="rounded-[6px] border border-brand px-4 py-2 text-[16px] font-bold text-text-accent">
          Voltar ao início
        </Link>
      </div>
    </section>
  )
}
