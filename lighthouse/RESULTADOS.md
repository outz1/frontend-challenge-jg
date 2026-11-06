# Auditoria Lighthouse (§10)

Início (`/`) e detalhe do NFT (`/nft/nft-001`), mobile e desktop, build otimizado com o cenário padrão dos mocks. Três medições por página e perfil; as notas abaixo são a mediana. Relatórios completos em `lighthouse/reports/` (`<alvo>-run-<n>.html` e `.json`, mais `lighthouse-summary.json` com ambiente e versões).

## Resultado (commit `8a4b424`)

| Alvo | Performance | Acessibilidade | Boas práticas | SEO | LCP | CLS | TBT |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Início desktop | 97 | 100 | 100 | 92 | 1,20 s | 0,0002 | 21 ms |
| Detalhe desktop | 98 | 100 | 100 | 92 | 1,14 s | 0,0001 | 0 ms |
| Início mobile | **65** | 100 | 100 | 92 | 4,30 s | 0,0002 | 662 ms |
| Detalhe mobile | **66** | 100 | 100 | 92 | 4,57 s | 0 | 590 ms |

Metas do §10: Performance 90, Acessibilidade 95, Boas práticas 95, SEO 90. **Todas as metas foram atingidas, exceto Performance no mobile.** Notas por execução da Performance: início desktop 97, 96, 97; detalhe desktop 98, 97, 98; início mobile 61, 67, 65; detalhe mobile 65, 67, 66.

## Ambiente e condições

- Lighthouse 13.6.0, Chromium 156.0.8078.4 (o do Playwright), Node v24.19.0.
- Linux 7.1 (x64), Intel Core i7-8650U 1,9 GHz, 16 GiB. Carga do sistema durante a rodada: 3,86 antes e 1,78 depois (média de 1 minuto), com editor e navegador abertos. O índice de benchmark de CPU do Lighthouse ficou perto de 1040 a 1060.
- Perfil mobile: emulação 390 por 844, limitação simulada padrão do Lighthouse (4G lenta, CPU 4 vezes mais lenta). Perfil desktop: configuração `desktop` do Lighthouse, 1440 por 1000.
- Servidor: `vite preview` do build gerado por `npm run build` (mocks ligados, MSW ativo). Imagens, fontes e funcionalidades são as da entrega; nada foi simplificado para a nota.
- Como reproduzir: `npm run build` e depois `npm run lighthouse` (`LH_RUNS` e `LH_TARGETS` restringem a rodada).

## O que foi corrigido por causa da auditoria

A primeira rodada deu CLS 0,2857 no detalhe desktop e Performance 84. A causa era o rodapé: o skeleton do detalhe era mais baixo que a página carregada, e o rodapé descia quando os dados chegavam. O skeleton passou a espelhar a estrutura da página (galeria e coluna de informações com 448 px, seção de detalhes e carrossel). O CLS caiu a zero e a nota subiu a 98.

## Por que o mobile não atinge 90

O Início e o detalhe mobile ficam abaixo da meta só em Performance, por TBT (cerca de 600 ms) e LCP (cerca de 4,3 s). Causa, com base nos relatórios:

- **Custo de JavaScript sob CPU 4 vezes mais lenta.** O arranque executa cerca de 700 a 800 ms de script do chunk do MSW (`browser-*.js`, 475 kB, 174 kB comprimido) e 400 a 650 ms do chunk principal do app. O total transferido é de 384 KiB, dos quais cerca de 100 KiB sem uso na tela inicial.
- **O MSW faz parte do que é auditado.** O enunciado pede a auditoria com o cenário padrão dos mocks e sem simplificações. Uma versão sem mocks (`npm run dev:real` apontando para uma API real) não carregaria esse chunk.
- **LCP descoberto tarde.** No detalhe, a imagem principal só existe depois que o JavaScript busca o NFT, então o relatório aponta 828 ms de atraso no início do carregamento do recurso (a requisição não aparece no HTML inicial). No início, a imagem do hero demora a renderizar depois do JavaScript.
- **Variação por ambiente.** Uma rodada anterior, feita com a máquina mais ociosa, mediu 76 e 75 (TBT de 357 e 331 ms, LCP de 4,07 e 4,38 s) nesses dois perfis. Com a carga de 3 a 4 de hoje, a mesma limitação de CPU simulada amplifica o ruído e dá 65 e 66. Os relatórios da rodada anterior não foram arquivados.

## Tentativas que não ajudaram (registradas para não repetir)

- Baixar o código do app e o do mock em paralelo (`Promise.all`) piorou o TBT (de cerca de 350 para cerca de 1000 ms no mobile), porque a execução dos dois ficou depois do primeiro render.
- Pré-carregar as fontes não mudou a nota (62 a 64 com e sem preload, mesma carga de CPU).

## Próximos ganhos possíveis

- Dividir o chunk principal e adiar o que a tela inicial não usa (a auditoria aponta cerca de 100 KiB).
- Servir a imagem do hero com `<link rel="preload">` específico para a rota inicial.
- Medir em máquina ociosa para uma comparação sem ruído.
