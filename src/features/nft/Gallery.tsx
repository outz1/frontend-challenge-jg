import { useState } from 'react'
import type { Nft } from '@/api/contracts'
import zoomIcon from '@/assets/icons/d-zoom.svg'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

/** Galeria do detalhe (Figma 70363:239): 4 miniaturas de 100 px e imagem principal de 444 px. */
export function Gallery({ nft }: { nft: Nft }) {
  const [index, setIndex] = useState(0)
  const current = nft.gallery[index] ?? nft.gallery[0]

  return (
    <div className="flex w-full flex-col-reverse gap-4 lg:w-[573px] lg:flex-row lg:items-center lg:gap-7">
      <ul aria-label="Miniaturas da galeria" className="flex gap-3 lg:w-[100px] lg:flex-col lg:gap-4">
        {nft.gallery.map((image, i) => (
          <li key={i} className="size-[72px] shrink-0 rounded-[6px] bg-surface-card sm:size-[100px]">
            <button
              type="button"
              aria-label={`Ver imagem ${i + 1} de ${nft.gallery.length}`}
              aria-pressed={i === index}
              onClick={() => setIndex(i)}
              className={cn('block size-full rounded-[8px] border', i === index ? 'border-brand' : 'border-transparent')}
            >
              <img
                srcSet={image.srcSet}
                sizes="100px"
                src={image.url}
                alt=""
                width={100}
                height={100}
                className="size-full rounded-[8px] object-cover"
              />
            </button>
          </li>
        ))}
      </ul>

      <div className="relative grid aspect-square w-full place-items-center rounded-[6px] bg-surface-card p-4 lg:size-[444px] lg:shrink-0">
        <img
          srcSet={current.srcSet}
          sizes="(min-width: 1024px) 404px, calc(100vw - 64px)"
          src={current.url}
          alt={current.alt}
          width={404}
          height={404}
          fetchPriority="high"
          className="size-full rounded-[24px] object-cover lg:size-[404px]"
        />
        <Sheet>
          <SheetTrigger
            aria-label="Ampliar imagem"
            className="absolute top-[15px] right-3 size-[30px] rounded-full"
          >
            <img src={zoomIcon} alt="" width={30} height={30} className="block" />
          </SheetTrigger>
          <SheetContent className="inset-0 m-auto h-fit w-[min(720px,94vw)] rounded-[12px] bg-surface-card p-4">
            <div className="flex items-center justify-between pb-3">
              <SheetTitle className="text-[18px] font-bold text-text-foreground">{nft.title}</SheetTitle>
              <SheetClose className="rounded-[6px] px-3 py-1 text-[16px] font-bold text-text-accent">Fechar</SheetClose>
            </div>
            <SheetDescription className="sr-only">Imagem ampliada do NFT.</SheetDescription>
            <img src={current.url} alt={current.alt} className="aspect-square w-full rounded-[12px] object-cover" />
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
