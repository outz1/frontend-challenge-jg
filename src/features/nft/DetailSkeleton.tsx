import { Skeleton } from '@/components/ui/skeleton'
import { MD_UP, useMediaQuery } from '@/hooks/useMediaQuery'

/** Mesmas dimensões do detalhe carregado, para não haver layout shift (§8). Uma composição por viewport. */
export function DetailSkeleton() {
  const desktop = useMediaQuery(MD_UP)
  return (
    <div role="status" aria-label="Carregando NFT">
      <div aria-hidden="true">{desktop ? <DesktopDetailSkeleton /> : <MobileDetailSkeleton />}</div>
    </div>
  )
}

function DesktopDetailSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-24 px-4 pt-8 pb-16 min-[1240px]:px-0">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-40" />
        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="flex w-full flex-col-reverse gap-4 lg:w-[573px] lg:flex-row lg:items-center lg:gap-7">
            <div className="flex gap-3 lg:w-[100px] lg:flex-col lg:gap-4">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="size-[72px] shrink-0 sm:size-[100px]" />
              ))}
            </div>
            <Skeleton className="aspect-square w-full lg:size-[444px] lg:shrink-0" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 lg:h-[448px]">
            <div className="flex flex-col gap-3">
              <Skeleton className="h-9 w-2/3" />
              <Skeleton className="h-6 w-full" />
            </div>
            <Skeleton className="h-[90px] w-full" />
            <Skeleton className="h-7 w-[209px]" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-[100px] w-[308px]" />
          </div>
        </div>
      </div>
      {/* Detalhes do NFT e "Mais desta coleção": o rodapé fica onde ficará depois da carga. */}
      <Skeleton className="h-[340px] w-full" />
      <Skeleton className="h-[364px] w-full" />
    </div>
  )
}

function MobileDetailSkeleton() {
  return (
    <div>
      <Skeleton className="h-[506px] w-full rounded-none" />
      <Skeleton className="-mt-[114px] h-[504px] w-full rounded-t-[31px] rounded-b-none" />
    </div>
  )
}
