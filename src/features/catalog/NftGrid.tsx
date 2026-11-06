import { ApiRequestError } from '@/api/client'
import type { NftSummary } from '@/api/contracts'
import { NftCard, NftCardSkeleton } from './NftCard'

const GRID =
  'grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 md:gap-x-6 md:gap-y-12 lg:gap-x-[34px] lg:gap-y-[72px]'

export function NftGrid({ items }: { items: NftSummary[] }) {
  return (
    <ul className={GRID}>
      {items.map((nft, index) => (
        // No mobile a segunda coluna desce 32px, como no Figma (Column R, 70395:244).
        <li key={nft.id} className={index % 2 === 1 ? 'translate-y-8 md:translate-y-0' : undefined}>
          <NftCard nft={nft} priority={index < 3} />
        </li>
      ))}
    </ul>
  )
}

export function NftGridSkeleton({ count }: { count: number }) {
  return (
    <div className={GRID} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className={index % 2 === 1 ? 'translate-y-8 md:translate-y-0' : undefined}>
          <NftCardSkeleton />
        </div>
      ))}
    </div>
  )
}

export function EmptyState({ onClear, filtered }: { onClear: () => void; filtered: boolean }) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 bg-surface-card px-6 py-12 text-center">
      <h3 className="text-heading font-bold text-text-foreground">Nenhum NFT encontrado</h3>
      <p className="max-w-[420px] text-body text-text-secondary">
        {filtered
          ? 'Nenhum item corresponde à busca e aos filtros atuais. Ajuste os critérios ou limpe os filtros.'
          : 'O catálogo está vazio no momento.'}
      </p>
      {filtered && (
        <button type="button" onClick={onClear} className="rounded-[6px] bg-brand px-4 py-2 text-[16px] font-bold text-ink">
          Limpar filtros
        </button>
      )}
    </div>
  )
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const message =
    error instanceof ApiRequestError && error.transient
      ? 'Não conseguimos falar com o servidor. Verifique a conexão e tente novamente.'
      : 'Não foi possível carregar o catálogo.'
  return (
    <div role="alert" className="flex min-h-[300px] flex-col items-center justify-center gap-4 bg-surface-card px-6 py-12 text-center">
      <h3 className="text-heading font-bold text-text-foreground">Algo deu errado</h3>
      <p className="max-w-[420px] text-body text-text-secondary">{message}</p>
      <button type="button" onClick={onRetry} className="rounded-[6px] bg-brand px-4 py-2 text-[16px] font-bold text-ink">
        Tentar novamente
      </button>
    </div>
  )
}
