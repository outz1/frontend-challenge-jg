# 0009: Performance mobile

Data: 2026-11-06. Status: aceita.

Requisitos em `docs/DESAFIO.md` §10 (metas, sem simplificações para a nota) e §8 (skeleton sem layout shift). Medições em `lighthouse/RESULTADOS.md`.

## Contexto

O mobile ficava abaixo de 90 em Performance no início e no detalhe. Os relatórios mostravam três causas: o mobile baixava e executava a composição desktop escondida por CSS; o chunk do MSW (475 kB) só começava a baixar depois do bundle principal; e o detalhe mobile não pintava nada até a API responder.

## Decisões

- **Uma composição por viewport.** As telas com frames diferentes no mobile e no desktop montam só a árvore do viewport atual, com `useMediaQuery` (`MD_UP` e `LG_UP` em `src/hooks/useMediaQuery.ts`): detalhe (`DesktopDetail` ou `MobileDetail`), hero, sidebar de filtros com o banner em destaque, busca com drawer, cabeçalho, rodapé, promoções e diário. Substitui as "duas árvores no DOM" de `0004`. O app só roda no cliente, então a primeira renderização já usa o valor real da media query (sem piscada). As classes `hidden`/`md:flex` ficam como segunda garantia.
- **Pedaços exclusivos do desktop carregados sob demanda:** promoções e diário (`HomeSections`) e o Select de ordenação (Radix, `SortSelect`). O fallback do Select mostra o mesmo texto na mesma caixa, sem layout shift.
- **Chunk do MSW menor:** o `tough-cookie` do MSW só usa `getDomain` do `tldts`. Um alias no `vite.config.ts` troca para `tldts-experimental` (mesma API e mesma lista de sufixos públicos, em formato compacto). O chunk cai de 475 kB (174 kB comprimido) para 315 kB (110 kB). O app e o mock não usam cookies.
- **`modulepreload` do chunk do MSW** no HTML (plugin `kurio:preload-mocks`): baixa em paralelo com o bundle principal. A ordem de execução continua a mesma (mock antes do primeiro render), por isso o TBT não sobe como na tentativa com `Promise.all`.
- **Imagens responsivas:** variantes de 450 px das artes (`scripts/image-variants.mjs`, versionadas em `src/assets/images/*-450.webp`) e `srcSet` opcional no contrato `nftImageSchema`, preenchido pelo mock. Os componentes declaram `sizes` conforme o espaço exibido. Telas de alta densidade continuam recebendo o original de 900 px.
- **Botão Voltar no skeleton do detalhe mobile:** sem cabeçalho no mobile, a tela de carga não tinha saída nem conteúdo pintável. O botão real fica na mesma posição do detalhe carregado.

## Não adotado (medido sem ganho)

- Registrar o Service Worker por script inline antes dos bundles: o Lighthouse simula a rede e não modela a instalação do worker.
- Baixar os chunks da rota atual antes do MSW subir (`router.loadRouteChunk`): neutro ou pior.
- CSS embutido no HTML: no máximo 1 ponto, e perde o cache do CSS entre páginas.
- Reduzir a latência do mock (150 a 749 ms): é requisito do §6, mexer seria simplificação para a nota.
