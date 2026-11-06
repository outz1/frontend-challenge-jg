# Auditoria Lighthouse (§10)

Início (`/`) e detalhe do NFT (`/nft/nft-001`), mobile e desktop, build otimizado com o cenário padrão dos mocks. Três medições por página e perfil; as notas abaixo são a mediana. Relatórios completos em `lighthouse/reports/` (`<alvo>-run-<n>.html` e `.json`, mais `lighthouse-summary.json` com ambiente, versões e commit).

## Resultado (commit `b76024e`)

| Alvo | Performance | Acessibilidade | Boas práticas | SEO | LCP | CLS | TBT |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Início desktop | 100 | 100 | 100 | 92 | 0,81 s | 0,0001 | 0 ms |
| Detalhe desktop | 100 | 100 | 100 | 92 | 0,75 s | 0 | 0 ms |
| Início mobile | 92 | 100 | 100 | 92 | 3,07 s | 0 | 31 ms |
| Detalhe mobile | 90 | 100 | 100 | 92 | 3,40 s | 0 | 16 ms |

Metas do §10: Performance 90, Acessibilidade 95, Boas práticas 95, SEO 90. **Todas as metas foram atingidas nos quatro alvos** (o script saiu com código 0). Notas por execução da Performance: início desktop 100, 100, 99; detalhe desktop 100, 100, 100; início mobile 92, 92, 92; detalhe mobile 90, 90, 90.

## Ambiente e condições

- Lighthouse 13.6.0, Chromium 153.0.8010.12 (o do Playwright), Node v22.23.4.
- Linux 6.18 (x64), Intel Xeon 2,3 GHz (4 núcleos), 16 GiB, máquina de nuvem sem outros programas abertos. Carga do sistema: 1,39 antes e 0,77 depois (média de 1 minuto). Índice de benchmark de CPU do Lighthouse entre 3150 e 3390.
- Perfil mobile: emulação 390 por 844, limitação simulada padrão do Lighthouse (4G lenta, CPU 4 vezes mais lenta). Perfil desktop: configuração `desktop` do Lighthouse, 1440 por 1000.
- Servidor: `vite preview` do build gerado por `npm run build` (mocks ligados, MSW ativo, latência variável padrão de 150 a 749 ms). Imagens, fontes e funcionalidades são as da entrega; nada foi simplificado para a nota.
- Como reproduzir: `npm run build` e depois `npm run lighthouse` (`LH_RUNS` e `LH_TARGETS` restringem a rodada).

**A nota mobile depende da CPU da máquina.** A limitação de CPU é um multiplicador sobre a máquina que mede. A rodada anterior (commit `8a4b424`, notebook com i7-8650U, carga de 3 a 4, índice de benchmark perto de 1050 a 1180) deu 65 e 66 no mobile. Numa máquina como aquela, as notas desta versão devem ficar abaixo das da tabela. Por isso a comparação abaixo usa o mesmo ambiente antes e depois.

## O que mudou e quanto ajudou (mesmo ambiente, mediana mobile)

| Etapa | Início | Detalhe | Detalhe técnico |
| --- | ---: | ---: | --- |
| Antes (commit `127bc66`) | 87 | 84 | LCP 3,9 e 4,1 s; 384 KiB transferidos |
| Uma composição por viewport | 86 | 81 | TBT cai; LCP igual (diferença dentro do ruído de 1 execução) |
| Chunk do MSW de 174 para 110 kB comprimido | 89 | 84 | LCP 3,56 e 3,80 s |
| `modulepreload` do chunk do MSW | 92 | 88 | LCP 3,09 e 3,39 s |
| Variantes de 450 px em `srcset` | 92 | 87 | Imagem do LCP de 47 para 17 kB; ganho fora do caminho crítico simulado |
| Botão Voltar no skeleton do detalhe | 92 | 90 | FCP do detalhe de 2,66 para 2,05 s |

Detalhes e motivos em `docs/decisoes/0009-performance-mobile.md`. Resumo:

- **Composição desktop escondida:** o mobile baixava o hero desktop, a galeria desktop (que pedia a imagem do LCP com prioridade baixa, antes da ocorrência mobile) e executava as duas árvores. Agora só a árvore do viewport é montada.
- **Chunk do MSW:** 250 kB dos 475 kB eram a lista de sufixos públicos do `tldts`, usada pelo `tough-cookie` do MSW. O alias para `tldts-experimental` mantém API e dados em formato compacto.
- **Download em paralelo:** o chunk do MSW só começava a baixar depois que o bundle principal executava. A dica `modulepreload` no HTML baixa os dois juntos, sem mudar a ordem de execução.
- **Skeleton do detalhe mobile:** blocos de cor não contam como conteúdo, e o mobile não tem cabeçalho, então nada era pintado até a API responder. O botão Voltar real, já funcional, entra no skeleton.

## Tentativas que não ajudaram (registradas para não repetir)

- Baixar o código do app e o do mock em paralelo (`Promise.all`) piorou o TBT (de cerca de 350 para cerca de 1000 ms no mobile), porque a execução dos dois ficou depois do primeiro render.
- Pré-carregar as fontes não mudou a nota.
- Registrar o Service Worker do MSW por script inline antes dos bundles: nota igual (o Lighthouse simula a rede e não modela a instalação do worker).
- Baixar os chunks da rota atual antes do MSW subir: neutro no detalhe, pior no início.
- CSS embutido no HTML: no máximo 1 ponto, e o CSS deixa de ser reaproveitado do cache entre páginas.

## O que ainda pesa

- **LCP do detalhe mobile (3,4 s):** a imagem depende da resposta de `GET /nfts/nft-001`, que tem a latência variável do mock (§6). Mudar a latência seria simplificação para a nota.
- **JavaScript de framework no caminho crítico:** react-dom, MSW, zod, axios e o router somam a maior parte dos 324 KiB transferidos. Trocar `zod` por `zod/mini` reduziria cerca de 20 kB comprimidos, com reescrita dos contratos.
