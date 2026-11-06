import heroApe from '@/assets/images/hero-ape.webp'
import heroApe450 from '@/assets/images/hero-ape-450.webp'
import heroDots from '@/assets/icons/hero-dots.svg'

export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="mx-auto mt-8 flex w-full max-md:hidden max-w-page flex-col-reverse items-center gap-8 px-4 py-8 min-[1240px]:px-0 lg:h-[450px] lg:flex-row lg:justify-between lg:py-0 lg:pl-10"
    >
      <div className="flex w-full max-w-[600px] flex-col items-start gap-11 lg:items-end">
        <div className="flex w-full flex-col gap-8">
          <div className="flex flex-col gap-1">
            <div className="flex flex-col gap-2 text-text-foreground">
              <p className="text-[14px] leading-4 font-medium tracking-[0.1em]">Bem-vindo à Kurio</p>
              <h1 id="hero-title" className="text-[28px] leading-[44px] font-bold sm:text-display sm:leading-[70px]">
                SEJA DONO DO FUTURO <span className="block">DA ARTE DIGITAL</span>
              </h1>
            </div>
            <p className="max-w-[557px] text-body text-text-secondary">
              Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie
              artistas e tenha uma parte da cultura da internet.
            </p>
          </div>
          <a
            href="#catalogo"
            className="flex h-10 w-[140px] items-center justify-center rounded-[6px] bg-brand py-[10px] pr-9 pl-7 text-[16px] leading-5 font-bold text-ink"
          >
            EXPLORAR
          </a>
        </div>
        <img src={heroDots} alt="" className="hidden h-2 w-10 lg:block" />
      </div>

      <img
        srcSet={`${heroApe450} 450w, ${heroApe} 900w`}
        sizes="(min-width: 1024px) 450px, 100vw"
        src={heroApe}
        alt="Macaco de óculos redondos e jaqueta verde, arte em destaque"
        width={450}
        height={450}
        fetchPriority="high"
        className="aspect-square w-full max-w-[450px] rounded-3xl object-cover"
      />
    </section>
  )
}
