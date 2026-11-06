import type { Collection, Edition, Network, Nft } from '../../src/api/contracts'
import emeraldApe from '../../src/assets/images/nft-emerald-ape.webp'
import sageNomad from '../../src/assets/images/nft-sage-nomad.webp'
import neonVessel from '../../src/assets/images/nft-neon-vessel.webp'
import goldenBeat from '../../src/assets/images/nft-golden-beat.webp'
import heroApe from '../../src/assets/images/hero-ape.webp'

/** Registro do mock: o contrato público mais campos internos que nunca saem na resposta. */
export type NftRecord = Nft & { trendingScore: number }

type Art = { src: string; alt: string }

const ART: Record<string, Art> = {
  emerald: { src: emeraldApe, alt: 'Macaco de óculos redondos e jaqueta verde' },
  sage: { src: sageNomad, alt: 'Gorila de chapéu verde e moletom roxo' },
  neon: { src: neonVessel, alt: 'Chimpanzé de terno claro e gola alta verde' },
  golden: { src: goldenBeat, alt: 'Macaco laranja de fones verdes e jaqueta clara' },
  hero: { src: heroApe, alt: 'Macaco de óculos redondos e jaqueta verde, arte em destaque' },
}

type Seed = {
  title: string
  creator: string
  collection: Collection
  network: Network
  art: keyof typeof ART
  /** Preço da edição aberta em centavos de ETH (inteiro; evita float na geração). */
  cents: number
  compareAtCents?: number
  soldOut?: boolean
  rare?: boolean
}

/** As 9 primeiras reproduzem a primeira página do Figma (70342:2828), na ordem. */
const FIGMA_SEEDS: Seed[] = [
  { title: 'Emerald Ape #042', creator: 'Marina Costa', collection: 'arte-digital', network: 'ethereum', art: 'emerald', cents: 119 },
  { title: 'Sage Nomad #009', creator: 'Teo Almeida', collection: 'arte-digital', network: 'ethereum', art: 'sage', cents: 169 },
  { title: 'Neon Vessel #552', creator: 'Lia Duarte', collection: 'generativa', network: 'polygon', art: 'neon', cents: 199, compareAtCents: 229, rare: true },
  { title: 'Cosmic Bloom #118', creator: 'Marina Costa', collection: 'arte-3d', network: 'solana', art: 'sage', cents: 129 },
  { title: 'Violet Nomad #314', creator: 'Teo Almeida', collection: 'colecionaveis', network: 'ethereum', art: 'sage', cents: 139 },
  { title: 'Ivory Baron #088', creator: 'Caio Ramos', collection: 'fotografia', network: 'polygon', art: 'neon', cents: 179 },
  { title: 'Golden Beat #207', creator: 'Nina Prado', collection: 'musica', network: 'ethereum', art: 'golden', cents: 99 },
  { title: 'Golden Echo #073', creator: 'Nina Prado', collection: 'musica', network: 'solana', art: 'golden', cents: 69 },
  { title: 'Golden Signal #160', creator: 'Nina Prado', collection: 'musica', network: 'polygon', art: 'golden', cents: 39 },
]

const PREFIXES = ['Amber', 'Cobalt', 'Lunar', 'Onyx', 'Solar', 'Velvet', 'Jade', 'Crimson', 'Arctic']
const SUFFIXES = ['Ape', 'Nomad', 'Vessel', 'Bloom', 'Baron', 'Beat', 'Signal', 'Echo', 'Drift']
const CREATORS = ['Marina Costa', 'Teo Almeida', 'Lia Duarte', 'Caio Ramos', 'Nina Prado', 'Rafa Lima']
const COLLECTIONS: Collection[] = [
  'arte-digital', 'fotografia', 'musica', 'arte-3d', 'colecionaveis', 'generativa', 'jogos', 'assinaturas', 'utilidade',
]
const NETWORKS: Network[] = ['ethereum', 'polygon', 'solana']
const ARTS = ['emerald', 'sage', 'neon', 'golden'] as const

const GENERATED_COUNT = 27
const SOLD_OUT_INDEXES = new Set([4, 13, 21])

function generatedSeeds(): Seed[] {
  return Array.from({ length: GENERATED_COUNT }, (_, i) => {
    const n = i + FIGMA_SEEDS.length
    return {
      title: `${PREFIXES[(i * 5) % PREFIXES.length]} ${SUFFIXES[(i * 7) % SUFFIXES.length]} #${String(100 + ((i * 37) % 900)).padStart(3, '0')}`,
      creator: CREATORS[i % CREATORS.length],
      collection: COLLECTIONS[(i * 4 + 1) % COLLECTIONS.length],
      network: NETWORKS[(i * 2 + 1) % NETWORKS.length],
      art: ARTS[n % ARTS.length],
      cents: 20 + ((i * 53) % 1180),
      compareAtCents: i % 6 === 2 ? 20 + ((i * 53) % 1180) + 40 : undefined,
      soldOut: SOLD_OUT_INDEXES.has(i),
    }
  })
}

/** Centavos de ETH (inteiro) para string decimal com 2 casas, sem aritmética de ponto flutuante. */
function eth(cents: number): string {
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`
}

function buildEditions(id: string, seed: Seed): Edition[] {
  const open = seed.cents
  const soldOut = seed.soldOut === true
  // Ordem do seletor no Figma (70342:2696): 1/1, 1/10, 1/50, ABERTA.
  return [
    { id: `${id}-1`, label: '1/1', kind: 'unique', supply: 1, available: soldOut ? 0 : 1, maxPerOrder: 1, priceEth: eth(open + 150) },
    { id: `${id}-10`, label: '1/10', kind: 'limited', supply: 10, available: soldOut ? 0 : 1 + (open % 6), maxPerOrder: 2, priceEth: eth(open + 60) },
    { id: `${id}-50`, label: '1/50', kind: 'limited', supply: 50, available: soldOut ? 0 : 12 + (open % 30), maxPerOrder: 3, priceEth: eth(open + 20) },
    { id: `${id}-open`, label: 'ABERTA', kind: 'open', supply: null, available: soldOut ? 0 : null, maxPerOrder: 5, priceEth: eth(open) },
  ]
}

const NETWORK_LABEL: Record<Network, string> = { ethereum: 'Ethereum', polygon: 'Polygon', solana: 'Solana' }
const ACCESSORIES = ['Óculos', 'Chapéu', 'Fones', 'Terno', 'Moletom', 'Jaqueta']
const COLORS = ['Esmeralda', 'Violeta', 'Âmbar', 'Marfim', 'Dourado', 'Carmim']
const RARITIES = ['Raro', 'Comum', 'Épico', 'Lendário']
const RATINGS = ['4.8', '4.6', '4.9', '4.7']

/** "Emerald Ape #042" -> série "Kurio Apes" e token "#0042". */
function seriesOf(title: string) {
  const [, word = 'Editions'] = title.replace(/\s#\d+$/, '').split(' ')
  return `Kurio ${word === 'Echo' ? 'Echoes' : `${word}s`}`
}
function tokenOf(title: string) {
  return `#${(title.match(/#(\d+)$/)?.[1] ?? '0').padStart(4, '0')}`
}

/** Data fixa: o catálogo é determinístico entre execuções (§6). */
const BASE_TIME = Date.parse('2026-10-31T12:00:00.000Z')
const DAY_MS = 24 * 60 * 60 * 1000

export function buildNftFixtures(): NftRecord[] {
  const seeds = [...FIGMA_SEEDS, ...generatedSeeds()]
  return seeds.map((seed, index) => {
    const id = `nft-${String(index + 1).padStart(3, '0')}`
    const art = ART[seed.art]
    const image = { url: art.src, alt: `${seed.title}: ${art.alt}` }
    return {
      id,
      title: seed.title,
      creator: seed.creator,
      collection: seed.collection,
      network: seed.network,
      image,
      priceEth: eth(seed.cents),
      compareAtEth: seed.compareAtCents ? eth(seed.compareAtCents) : null,
      soldOut: seed.soldOut === true,
      rare: seed.rare === true,
      createdAt: new Date(BASE_TIME - index * DAY_MS).toISOString(),
      version: 1,
      description: `Um colecionável digital finalizado à mão da coleção Kurio Editions, verificado na ${NETWORK_LABEL[seed.network]}, com arte desbloqueável e acesso para colecionadores.`,
      about: [
        `${seed.title} é uma obra digital finalizada à mão da coleção Kurio Editions. Cada atributo fica armazenado nos metadados do token e verificado na ${NETWORK_LABEL[seed.network]}. A obra explora identidade, movimento e luz em um mundo digital sem fronteiras.`,
        `A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência registrada na rede. ${seed.creator} recebe 5% de direitos autorais nas vendas secundárias, apoiando novos trabalhos e lançamentos da comunidade.`,
      ],
      tokenId: tokenOf(seed.title),
      collectionName: seriesOf(seed.title),
      rating: { average: RATINGS[index % RATINGS.length], count: 19 + ((index * 7) % 40) },
      contract: {
        address: `0x${(0x7a42 + index * 997).toString(16).toUpperCase()}...${(0x19e8 + index * 1337).toString(16).toUpperCase()}`,
        standard: 'ERC-721',
        royaltyPercent: '5',
      },
      // O Figma repete a mesma arte nas miniaturas; só o texto alternativo muda.
      gallery: [1, 2, 3, 4].map((view) => ({ url: art.src, alt: `${seed.title}, vista ${view}` })),
      editions: buildEditions(id, seed),
      attributes: [
        { name: 'Acessório', value: ACCESSORIES[index % ACCESSORIES.length] },
        { name: 'Cor', value: COLORS[index % COLORS.length] },
        { name: 'Raridade', value: RARITIES[index % RARITIES.length] },
      ],
      trendingScore: (index * 7919) % 101,
    }
  })
}
