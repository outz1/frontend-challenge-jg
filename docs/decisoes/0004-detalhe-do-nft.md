# 0004: Detalhe do NFT

Data: 2026-11-05. Status: aceita.

Requisitos em `docs/DESAFIO.md` §3 (Detalhes do NFT, "Catálogo e detalhe") e §8. Frames em `docs/FIGMA.md` (`10:244`, `15:5536`).

## Decisões

- **Contrato `Nft` ampliado** (`src/api/contracts/nft.ts`) com o que o Figma exibe e o contrato não tinha: `about` (parágrafos), `tokenId`, `collectionName`, `rating` (média como string, nunca float), `contract` (endereço, padrão, royalties). A galeria repete a mesma arte, como o Figma, com `alt` distinto por vista.
- **Regra de limite** em `src/features/nft/purchase.ts`: máximo = menor entre disponibilidade da edição e teto por pedido; 0 é esgotada. A quantidade é derivada do limite (sem efeito de sincronização), então trocar de edição ou receber evento de estoque reclampa sozinho.
- **Edição como radios nativos**: setas do teclado e leitura de grupo sem JS extra; esgotada fica `disabled`, riscada e com "(esgotada)" para leitores de tela.
- **Stepper com `aria-disabled`** (não `disabled`): o foco não se perde ao atingir o limite; o valor é um `<output>` em região viva.
- **Duas árvores no DOM**: `DesktopDetail` (≥768) e `MobileDetail` (<768), uma escondida por CSS, porque os frames são composições diferentes. Estado de compra compartilhado em `usePurchase`. Custo: imagens principais pedidas duas vezes (mesma URL, cache do navegador).
- **Carregamento**: `loader` da rota só dispara `prefetchQuery` (sem bloquear), então o preload por intenção aquece o cache e a tela mostra skeleton com as dimensões finais. Not found (`not_found`) e falha transitória têm telas próprias, com nova tentativa.
- **Relacionados** vêm de `GET /nfts?collection=<mesma>`; sem outros itens, a seção some.
- **Zoom** da imagem é um diálogo (Radix): foco preso, Esc fecha, foco volta ao botão.

## Desvios do Figma (levar para `ARCHITECTURE.md`)

- Os rótulos "Rede / Contrato / Direitos autorais" estão trocados com os textos no frame; foram alinhados (cada rótulo com o seu texto).
- Pílulas de edição desenhadas com borda CSS em vez dos SVGs de elipse (mesmo traço, largura se ajusta ao texto).
- Linhas e sublinhados (`Line 2`, `Line 6`) em CSS, mesma cor e espessura.
- Pontos do carrossel de "Mais desta coleção" omitidos: as 5 peças cabem na tela, os pontos não teriam função. No mobile os pontos da galeria são reais (um por imagem).
- Em mobile, abas, texto longo e "Mais desta coleção" não aparecem, porque o frame mobile não os tem.
- "Mercado" fica ativo no menu nas telas do fluxo de compra, como no Figma, mas segue inerte (fora do escopo).
- Avaliações (aba, nota) e compartilhar são exibidos, sem ação (fora do escopo, §3).
