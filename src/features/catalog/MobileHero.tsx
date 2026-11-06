import heroApe from '@/assets/images/hero-ape.webp'
import heroApe450 from '@/assets/images/hero-ape-450.webp'
import sageNomad from '@/assets/images/nft-sage-nomad.webp'
import sageNomad450 from '@/assets/images/nft-sage-nomad-450.webp'
import mask from '@/assets/icons/m-hero-mask.svg'
import arrowRight from '@/assets/icons/m-arrow-right.svg'
import dots from '@/assets/icons/m-hero-dots.svg'

/** Banner compacto do mobile (Figma 70395:240). No tablet e no desktop vale o `Hero`. */
export function MobileHero() {
  return (
    <section
      aria-labelledby="mobile-hero-title"
      className="relative flex h-[190px] w-full flex-col items-center justify-center gap-[10px] overflow-hidden rounded-[12px] p-4 md:hidden"
    >
      <img src={mask} alt="" className="pointer-events-none absolute top-0 left-0 block h-[190px] w-[366px] max-w-none" />
      <div className="relative flex w-full flex-col items-center gap-4">
        <div className="flex w-full items-center gap-2">
          <div className="flex min-w-0 flex-1 flex-col items-start">
            <div className="flex w-full flex-col gap-[6px]">
              <p className="text-[12px] leading-4 font-medium text-text-foreground">Bem-vindo à Kurio</p>
              <h1 id="mobile-hero-title" className="w-[190px] text-[18px] leading-[29px] font-bold text-text-foreground">
                SEJA DONO DA <span className="block">CULTURA DIGITAL</span>
              </h1>
              <p className="text-[12px] leading-[18px] text-text-secondary">
                Descubra NFTs selecionados de criadores do mundo todo.
              </p>
            </div>
            <a href="#catalogo" className="flex items-center gap-2 text-[12px] leading-[14px] font-bold text-text-accent">
              EXPLORAR
              <img src={arrowRight} alt="" width={10} height={12} className="block -rotate-90" />
            </a>
          </div>
          <div className="relative size-[138px] shrink-0">
            <img
              srcSet={`${heroApe450} 450w, ${heroApe} 900w`}
              sizes="138px"
              src={heroApe}
              alt="Macaco de óculos redondos e jaqueta verde, arte em destaque"
              width={138}
              height={138}
              fetchPriority="high"
              className="size-[138px] rounded-[16px] object-cover"
            />
            <img
              srcSet={`${sageNomad450} 450w, ${sageNomad} 900w`}
              sizes="58px"
              src={sageNomad}
              alt=""
              width={58}
              height={58}
              className="absolute top-[88px] left-[14px] size-[58px] rounded-[16px] object-cover"
            />
          </div>
        </div>
        <img src={dots} alt="" width={33} height={7} className="block" />
      </div>
    </section>
  )
}
