import { Heart } from 'lucide-react'
import heartOutline from '@/assets/icons/heart-outline.svg'
import mHeart from '@/assets/icons/m-heart.svg'
import { useFavorite } from '@/api/queries/favorites'
import { cn } from '@/lib/utils'

/** "Favoritar" do desktop (Figma 70342:2757). `aria-pressed` expressa o estado; o texto também muda (não só a cor). */
export function FavoriteButton({ nftId }: { nftId: string }) {
  const { isFavorite, toggle, isReady } = useFavorite(nftId)
  return (
    <button
      type="button"
      aria-pressed={isFavorite}
      aria-busy={!isReady}
      onClick={toggle}
      className={cn(
        'flex h-10 w-[130px] items-center justify-center gap-2 rounded-[6px] border border-brand text-[14px] leading-5 font-medium text-text-accent',
        isFavorite && 'bg-brand/15',
        !isReady && 'opacity-60',
      )}
    >
      {isFavorite ? (
        <Heart size={20} className="fill-current" aria-hidden="true" />
      ) : (
        <img src={heartOutline} alt="" width={20} height={20} className="block" />
      )}
      {isFavorite ? 'Favoritado' : 'Favoritar'}
    </button>
  )
}

/** Coração redondo do mobile: no topo do detalhe (35 px, Figma 70410:4157) e sobre os cards (28 px). */
export function FavoriteIconButton({ nftId, title, size = 35 }: { nftId: string; title: string; size?: 35 | 28 }) {
  const { isFavorite, toggle, isReady } = useFavorite(nftId)
  return (
    <button
      type="button"
      aria-pressed={isFavorite}
      aria-busy={!isReady}
      aria-label={isFavorite ? `Remover ${title} dos favoritos` : `Favoritar ${title}`}
      onClick={toggle}
      className={cn(
        'grid shrink-0 place-items-center rounded-full border border-line bg-[#2f1d15]',
        size === 35 ? 'size-[35px]' : 'size-[28px]',
      )}
    >
      {isFavorite ? (
        <Heart size={size === 35 ? 16 : 14} className="fill-text-accent text-text-accent" aria-hidden="true" />
      ) : (
        <img src={mHeart} alt="" width={size === 35 ? 16 : 14} height={size === 35 ? 14 : 12} className="block" />
      )}
    </button>
  )
}
