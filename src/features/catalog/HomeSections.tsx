import promoArrow from '@/assets/icons/promo-arrow.svg'
import promoMask from '@/assets/icons/promo-mask.svg'
import journal1 from '@/assets/images/journal-1.webp'
import journal2 from '@/assets/images/journal-2.webp'
import journal3 from '@/assets/images/journal-3.webp'
import journal4 from '@/assets/images/journal-4.webp'
import promoCurated from '@/assets/images/promo-curated.webp'
import promoGenesis from '@/assets/images/promo-genesis.webp'
import { UNAVAILABLE_NOTICE } from '@/features/auth/form-utils'

const PROMOS = [
  {
    key: 'genesis',
    title: ['Lançamentos gênesis', 'de edição limitada'],
    text: 'Colecione edições escassas diretamente dos criadores antes da revelação pública.',
    image: promoGenesis,
    /** Medidas do Figma (70353:239 e 70353:240): cada cartão desloca imagem, texto e botão alguns pixels. */
    imageClass: 'left-[-5px] w-[292px] rounded-[18px]',
    textWidth: 'w-[263px]',
    right: 'right-[30px]',
    buttonRight: 'right-[30px]',
  },
  {
    key: 'curated',
    title: ['Arte digital selecionada', 'e muito mais'],
    text: 'Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.',
    image: promoCurated,
    imageClass: 'left-[2px] w-[287px] rounded-[17px]',
    textWidth: 'w-[252px]',
    right: 'right-[35px]',
    buttonRight: 'right-[35px]',
  },
] as const

/** Dois cartões promocionais do Início (Figma 70353:241). Só existem no desktop; no mobile o frame não os traz. */
export function Promos() {
  return (
    <section aria-label="Destaques" className="mx-auto hidden w-full max-w-page justify-between px-4 lg:flex min-[1240px]:px-0">
      {PROMOS.map((promo) => (
        <article key={promo.key} className="relative h-[250px] w-[586px] overflow-hidden rounded-[8px] bg-surface-card">
          <img
            src={promo.image}
            alt=""
            width={292}
            height={250}
            loading="lazy"
            decoding="async"
            className={`absolute top-0 h-[250px] object-cover ${promo.imageClass}`}
          />
          <h2 className={`absolute top-[37px] text-right text-[18px] leading-6 font-bold text-text-foreground ${promo.right}`}>
            {promo.title[0]}
            <br />
            {promo.title[1]}
          </h2>
          <p className={`absolute top-[94px] text-right text-[14px] leading-6 text-text-secondary ${promo.textWidth} ${promo.right}`}>{promo.text}</p>
          <a
            href="#catalogo"
            className={`absolute top-[164px] flex h-10 w-[140px] items-center justify-center rounded-[6px] bg-brand text-[14px] leading-5 font-medium text-ink ${promo.buttonRight}`}
          >
            Explorar
            <span aria-hidden="true" className="relative block size-[18px]">
              <span className="absolute inset-[23.76%_17.71%_26.04%_19.79%] flex items-center justify-center" style={{ containerType: 'size' }}>
                <span className="block h-[100cqw] w-[100cqh] flex-none -rotate-90">
                  <span className="relative block size-full">
                    <span className="absolute inset-[-6.67%_-8.3%]">
                      <img src={promoArrow} alt="" className="block size-full max-w-none" />
                    </span>
                  </span>
                </span>
              </span>
            </span>
          </a>
          <img src={promoMask} alt="" aria-hidden="true" width={586} height={250} className="pointer-events-none absolute inset-0 block size-full max-w-none" />
        </article>
      ))}
    </section>
  )
}

const POSTS = [
  { image: journal1, meta: '12 de setembro  |  Leitura de 6 min', title: 'Como funciona a propriedade de NFTs', text: 'Aprenda a colecionar, negociar e verificar ativos digitais.' },
  { image: journal2, meta: '13 de setembro  |  Leitura de 2 min', title: '10 artistas digitais para acompanhar', text: 'Conheça criadores que moldam a cultura digital.' },
  { image: journal3, meta: '15 de setembro  |  Leitura de 3 min', title: 'Raridade, atributos e procedência', text: 'Entenda raridade, procedência, direitos autorais e utilidade.' },
  { image: journal4, meta: '15 de setembro  |  Leitura de 2 min', title: 'Como proteger sua carteira', text: 'Proteja sua carteira, seus ativos e sua identidade.' },
]

/** "Diário da Cunhagem" (Figma 70343:253). Os artigos ficam fora do escopo (§3): "Ler mais" avisa que está indisponível. */
export function Journal() {
  return (
    <section aria-labelledby="diario-titulo" className="mx-auto hidden w-full max-w-page flex-col gap-10 px-4 lg:flex min-[1240px]:px-0">
      <div className="flex flex-col items-center gap-3 text-center">
        <h2 id="diario-titulo" className="text-[28px] leading-[normal] font-bold text-text-primary">
          Diário da Cunhagem
        </h2>
        <p className="text-[14px] text-text-secondary">Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.</p>
      </div>
      <ul className="flex items-stretch gap-6">
        {POSTS.map((post) => (
          <li key={post.title} className="flex w-[268px] flex-col overflow-hidden rounded-[8px] bg-surface-card">
            <img src={post.image} alt="" width={268} height={195} loading="lazy" decoding="async" className="h-[195px] w-full object-cover" />
            <div className="flex flex-1 flex-col items-start gap-2 px-4 pt-3 pb-4">
              <p className="text-[12px] leading-4 font-medium whitespace-pre-wrap text-text-secondary">{post.meta}</p>
              <h3 className="text-[16px] leading-[normal] font-bold text-text-primary">{post.title}</h3>
              <p className="text-[12px] leading-4 font-medium text-text-secondary">{post.text}</p>
              <button
                type="button"
                aria-disabled="true"
                title={UNAVAILABLE_NOTICE}
                className="flex cursor-not-allowed gap-1 text-[12px] text-text-accent"
              >
                <span className="leading-[14px] font-bold">Ler mais</span>
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
