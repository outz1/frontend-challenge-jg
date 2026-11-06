# TEMPORÁRIO: plano para subir o Performance mobile do Lighthouse

Arquivo de apoio para continuar em outra IDE ou sessão (Cowork). **Apagar este arquivo quando a meta for atingida** e registrar o resultado em `lighthouse/RESULTADOS.md` e `docs/ESTADO.md` (o dono dos fatos é cada um deles; este plano só ordena o trabalho).

## Andamento (2026-11-06)

- Passos 1, 2 e 3 feitos, mais imagens responsivas e botão Voltar no skeleton do detalhe mobile (commits `bdef86a` a `b76024e`, decisão `docs/decisoes/0009-performance-mobile.md`). O passo 2 se resolveu com o 1: a galeria desktop escondida pedia a imagem do LCP antes, com prioridade baixa. O 4 e o 5 foram avaliados: o JS que sobra é de framework, e o CSS embutido deu no máximo 1 ponto (não adotado).
- Rodada oficial numa máquina de nuvem ociosa: mobile 92 (início) e 90 (detalhe), desktop 100 e 100, demais categorias mantidas (`lighthouse/RESULTADOS.md`). No mesmo ambiente, antes das mudanças: 87 e 84.
- **Pendente:** medir na máquina local. Aquela CPU tem índice de benchmark perto de 1100, contra cerca de 3300 na nuvem, e a limitação 4x a penaliza mais. Se der 90 ou mais, apagar este arquivo. Se não der, o próximo candidato é `zod/mini` nos contratos (cerca de 20 kB comprimidos a menos no caminho crítico).
- Ambiente de nuvem: o Playwright do projeto (1.64.1) procura o Chromium build 1248, e a máquina tinha o 1243. Foi preciso um link simbólico local (fora do repositório) para rodar Lighthouse e testes.

## Objetivo

Performance mobile >= 90 (mediana de 3 medições) em **início** (`/`) e **detalhe** (`/nft/nft-001`), sem remover funcionalidade, mocks, imagens ou fontes (§10: "sem simplificações exclusivas para melhorar a pontuação"). Acessibilidade, Boas práticas e SEO já passam (100, 100, 92) e não podem regredir. O desktop já passa (97 e 98).

## Ponto de partida (medição oficial, commit `8a4b424`)

| Alvo | Perf | LCP | TBT | CLS | FCP |
| --- | ---: | ---: | ---: | ---: | ---: |
| Início mobile | 65 | 4,3 s | 662 ms | 0,0002 | ~2,4 s |
| Detalhe mobile | 66 | 4,6 s | 590 ms | 0 | ~2,4 s |

Uma rodada anterior, com a máquina mais ociosa, deu 76 e 75 (TBT 357 e 331 ms). **A variação vem da carga da máquina** (limitação de CPU 4x amplifica ruído): meça sempre com o computador quieto (feche editor e navegador) e registre a carga (`lighthouse-summary.json` já guarda `loadAverage`). Relatórios completos em `lighthouse/reports/` (abrir os `.html`).

## O que os relatórios mostram (fatos, não hipóteses)

Dados de `home-mobile-run-2.json` e `detail-mobile-run-2.json`:

1. **Mobile baixa recursos da composição desktop escondida.** No início mobile aparece `hero-ape.webp` (a imagem do hero **desktop**, `Hero.tsx` tem `max-md:hidden`), com prioridade `High`. Um `<img>` dentro de `display:none` é baixado mesmo assim. O mesmo vale para a árvore desktop do detalhe (`DesktopDetail`, `hidden md:flex`), da sidebar de filtros e do banner em destaque (`aside hidden lg:flex`), das promoções e do diário (`hidden lg:flex`).
2. **No detalhe mobile, a imagem do LCP chega tarde e com prioridade baixa:** `nft-emerald-ape.webp` é pedida só em ~977 ms (depois do XHR `/api/nfts/nft-001`) com prioridade `Low`, apesar de `fetchPriority="high"` em `MobileDetail.tsx` e `Gallery.tsx`. O relatório (`lcp-discovery-insight`) diz: "a solicitação não é detectável no documento inicial" e "fetchpriority=high precisa ser aplicado". Provavelmente a ocorrência pedida é a da árvore desktop escondida, ou a prioridade se perde (investigar qual `<img>` dispara a requisição).
3. **Caminho crítico serial no arranque:** HTML, depois `index-*.js` (90 KB comprimidos) com `contracts`, `session` e `dist`, depois o chunk do MSW `browser-*.js` (169 KB comprimidos, 475 KB brutos), depois o worker iniciar, depois o XHR, depois render e imagens. As fontes (3 arquivos) só são descobertas depois do CSS.
4. **JavaScript sem uso na tela inicial:** `browser-*.js` 69 KB de 167 KB sem uso; `index-*.js` 33 a 35 KB de 89 KB. Total transferido ~384 KiB.
5. **Longas tarefas** (limitação 4x): 279 ms em `index-*.js`, 219 ms em `session-*.js`, 161 ms no handler do mock (`nft-001`), mais tarefas "Unattributable" de 120 a 190 ms. TBT vem delas.
6. CSS de 11 KB bloqueia a renderização (~150 ms estimados no `render-blocking-insight`).

## Tentativas que NÃO ajudaram (não repetir)

- Carregar app e mock em paralelo (`Promise.all([import('./app'), enableMocking()])` com `main.tsx` mínimo): o TBT subiu (de ~350 para ~1000 ms no mobile e de ~0 para ~260 ms no desktop), porque a execução dos dois ficou depois do primeiro render.
- `<link rel="preload" as="font">` para Roboto Mono 400 e 700: sem efeito mensurável (62 a 64 com e sem).

## Plano em ordem (maior efeito esperado, menor risco primeiro)

Cada passo: implementar, rodar a bateria rápida de verificação (abaixo), medir 1 vez por alvo (`LH_RUNS=1`), e só então seguir. Commits pequenos, um por passo.

### 1. Montar só a composição do viewport atual (desktop ou mobile)

Hoje as duas árvores existem no DOM e uma é escondida por CSS. Trocar por montagem condicional com `useMediaQuery` (`src/hooks/useMediaQuery.ts`, já usado no checkout, carrinho e auth) e `React.lazy` para os pedaços exclusivos de desktop:

- Início: `Hero` (desktop), `FiltersPanel`, `FeaturedBanner`, o `Select` do `Toolbar`, `Promos` e `Journal` (`HomeSections.tsx`) só no desktop; `MobileHero` e `MobileSearchBar` só no mobile.
- Detalhe: `DesktopDetail` ou `MobileDetail` (em `NftDetailPage.tsx`, hoje renderiza as duas); o carrossel `RelatedNfts` já é só desktop.
- Cuidado: `useMediaQuery` usa `useSyncExternalStore` com `getServerSnapshot` falso; como o app é só cliente (`createRoot`), a primeira renderização já usa o valor real. Não deve haver "piscada", mas confira o CLS.
- Efeito esperado: some o download do `hero-ape.webp` desktop e de imagens da árvore escondida no mobile, menos trabalho do React e menos JS executado (os chunks lazy do desktop nem carregam).
- Risco: testes que assumem as duas árvores no DOM (os helpers `visible(...)` em `e2e/support.ts` continuam válidos). Rode a suíte inteira.

### 2. Prioridade e descoberta da imagem do LCP no detalhe mobile

- Descobrir qual `<img>` dispara a requisição `nft-emerald-ape.webp` (DevTools, Network, Initiator) e por que a prioridade é `Low`. Depois do passo 1 a árvore desktop não existe no mobile; confirme.
- Garantir `fetchPriority="high"`, sem `loading="lazy"`, e que a imagem seja pedida assim que o dado existir. Se o gargalo for esperar o XHR, avaliar `queryClient.prefetchQuery` no `loader` da rota (já dispara o fetch sem bloquear; ver `src/routes/nft.$nftId.tsx`) e o `link rel="preload"` da imagem do hero na rota inicial (a imagem do hero mobile é fixa).
- Efeito esperado: LCP do detalhe cai bem se a imagem deixar de esperar a árvore e a prioridade.

### 3. Encurtar o arranque do MSW

- **Registrar o Service Worker cedo:** script inline curto em `index.html` chamando `navigator.serviceWorker.register('/mockServiceWorker.js')` antes dos bundles; `worker.start()` reaproveita o registro e evita parte da espera. Medir.
- **Emagrecer o chunk `browser-*.js`:** 69 KB sem uso. Verificar com `rollup-plugin-visualizer` (devDependency a adicionar só para análise) o que entra nele: handlers, fixtures, `zod`, `big.js`, `msw`, `socket.io-binding`. `mocks/socket` e o cliente do socket já carregam sob demanda (não mexer: o `engine.io-client` precisa ser importado dinamicamente por causa do `WebSocket`; ver `docs/decisoes/0006`). Avaliar carregar handlers por domínio sob demanda, mantendo o worker um só.
- Restrição: o mock continua na camada de rede (MSW); nenhuma resposta fictícia em componentes ou no Axios.

### 4. Reduzir o JavaScript inicial do app

- Visualizer no `index-*.js` e `session-*.js` (186 KB brutos: provável axios, zod, router). Remover o que a rota inicial não usa: dividir por rota (`autoCodeSplitting` já está ligado no plugin do TanStack Router; conferir se `routes-*.js` e os chunks por rota estão sendo carregados só quando a rota abre), adiar `lucide-react` para os ícones usados, e Radix (`select`, `slider`, `dialog`) só quando o componente aparece.
- Checar duplicação (`duplicated-javascript-insight`) e JS legado (`legacy-javascript-insight`) nos relatórios.

### 5. Só se sobrar gap: CSS crítico e fontes

- CSS de 11 KB bloqueante: avaliar inline do crítico ou `media`/split. Ganho pequeno (~150 ms estimados).
- Fonte 500 (Medium) é carregada: ver se há uso real; se não houver, não importar. Cuidado com o Figma (usa Medium em vários textos).

### Não fazer sem avaliar

- Render do shell antes do MSW com o cliente HTTP esperando uma promessa de "mock pronto": move a execução pesada para depois do FCP e tende a **piorar o TBT** (mesmo efeito da tentativa paralela). Só testar se os passos 1 a 4 não bastarem, medindo.
- Remover MSW, trocar por dados estáticos, reduzir fixtures ou imagens apenas para a nota: proibido pelo §10.

## Como medir

Pré-requisitos: Node 20.19 ou superior, `npm ci`, Chromium do Playwright (`npx playwright install chromium`).

```bash
npm run build                                          # build com mocks
LH_TARGETS=home-mobile,detail-mobile LH_RUNS=1 npm run lighthouse   # teste rápido (alvo e nº de execuções)
npm run lighthouse                                     # oficial: 4 alvos x 3 execuções, mediana
```

- Alvos: `home-desktop`, `detail-desktop`, `home-mobile`, `detail-mobile`. O script escreve `lighthouse/reports/` (apague a pasta antes da rodada oficial para não misturar) e imprime as medianas; sai com código 1 se algum alvo ficar abaixo das metas.
- Compare sempre com a carga da máquina parecida: a nota mobile varia (56 a 76 no mesmo código) conforme a CPU ocupada. Em ambiente de nuvem sem navegador, os passos de código (1 a 4) podem ser feitos e **a medição fica para a máquina local**.
- Para investigar: abra o `.html` do relatório (Opportunities, Diagnostics, Treemap) e os insights `lcp-discovery`, `network-dependency-tree`, `render-blocking`, `duplicated-javascript`, `legacy-javascript`.

## Verificação a cada passo (não regredir)

```bash
npm run lint && npm run typecheck
npm run test          # 112 passados, 4 pulados (casos só de desktop); constrói e serve o app sozinho
```

- A regressão visual (`e2e/13-visual.spec.ts`) deve continuar igual: se uma baseline mudar, é porque o layout mudou de fato. Só use `npm run test:update` depois de conferir a imagem.
- Confira manualmente em 390 px e 1440 px: início, detalhe, carrinho, pagamento (sem piscada na troca de composição, sem CLS).

## Critério de aceite

1. Mediana de Performance mobile >= 90 em início e detalhe (3 medições, máquina quieta), com Acessibilidade >= 95, Boas práticas >= 95 e SEO >= 90 mantidos; desktop continua >= 90.
2. Lint, typecheck e a suíte Playwright inteira passando.
3. `lighthouse/reports/` regenerado e commitado, `lighthouse/RESULTADOS.md` atualizado (tabela, ambiente com carga, causas e o que mudou) e `docs/ESTADO.md` ajustado (item "Metas ... do §10" marcado `[x]` só com a evidência).
4. Se não chegar a 90: registrar o melhor resultado, as causas restantes e o que foi tentado (como já está feito), sem simplificar o produto.
5. Remover este arquivo (`docs/TEMP-PERFORMANCE-MOBILE.md`) no commit final.

## Regras do projeto (resumo)

- Docs em português, sem travessões; código, identificadores e commits em inglês, com o rodapé `Co-Authored-By` usado no histórico.
- Mocks só na camada de rede; ETH sempre string decimal; eventos de tempo real nunca simulados na UI.
- Ao fechar um bloco: atualizar `docs/ESTADO.md` e propor o commit. Sem push sem pedido explícito.
- Deploy: Vercel em https://frontend-challenge-jg.vercel.app (publicado pela CLI com `npx vercel --prod` (não confirmei ligação com o Git da Vercel, então publique de novo manualmente depois de mudar o app)). A suíte pode rodar contra a URL publicada com `E2E_BASE_URL`.
