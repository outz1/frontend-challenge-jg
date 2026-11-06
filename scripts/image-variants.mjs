// Gera as variantes de 450 px das artes servidas em `srcset` (cards, galeria e detalhe exibem até ~404 px).
// Os originais de 900 px seguem para telas de alta densidade. Rodar após trocar uma arte: `node scripts/image-variants.mjs`.
import sharp from 'sharp'

const dir = new URL('../src/assets/images/', import.meta.url)
const names = ['hero-ape', 'nft-emerald-ape', 'nft-golden-beat', 'nft-neon-vessel', 'nft-sage-nomad']

for (const name of names) {
  const info = await sharp(new URL(`${name}.webp`, dir).pathname)
    .resize(450, 450)
    .webp({ quality: 80, effort: 6 })
    .toFile(new URL(`${name}-450.webp`, dir).pathname)
  console.log(`${name}-450.webp`, `${(info.size / 1024).toFixed(1)} KB`)
}
