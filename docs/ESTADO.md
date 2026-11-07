# Estado do projeto

Atualizado em 2026-11-07.

**Situação:** Início, Detalhe, Login, Cadastro, Favoritos, Carrinho, Pagamento, Confirmação, **Perfil e Carteiras** funcionam de ponta a ponta contra o mock (decisões `0003` a `0009`). Verificado em desktop (1440) e mobile (390 e 414), primeiro em navegador e hoje pela suíte Playwright versionada: compra completa até o recibo; os cenários de falha do checkout (recusa e nova tentativa, timeout com recuperação do mesmo pedido, cotação desatualizada, edição esgotada, clique repetido, refresh com pedido pendente, conexão recusada, mudança de preço por Socket.IO durante o checkout); e Perfil e Carteiras (rota privada com retorno, validação por campo, usuário em uso, senha, avatar, secundária igual à principal, isolamento entre usuários). O recibo (`/order/:orderId`, Figma `70376:239`) só abre para pedido confirmado e usa o snapshot do pedido. Tempo real: `socket.io-client` real servido pelo MSW, com descarte de duplicata e de evento antigo, reconexão com reconciliação por REST, isolamento por usuário e liberação de listeners no logout. `typecheck`, `lint` e `build` passam. A suíte Playwright está versionada em `e2e/` (desktop e mobile): `npm run test` deu **126 passados e 6 pulados** (4 casos só de desktop e os 2 de reflow, que definem as larguras no próprio teste) num checkout limpo em 2026-11-07, e os itens abaixo foram marcados com essa evidência. A suíte tem 14 arquivos: as 12 áreas do §9, a regressão visual e a acessibilidade automática (axe e reflow). Os testes revelaram duas falhas reais, já corrigidas: o foco não voltava ao botão ao fechar a revisão do pedido, e o checkout mobile não avisava item indisponível. Publicado na Vercel (ver Deploy).

**Figma:** todas as telas foram lidas e comparadas com o frame em 1x (método e desvios em `docs/decisoes/0008-fidelidade-visual-e-desvios.md`): Início, Detalhe, Carrinho, Pagamento, Confirmação, Login, Cadastro, Perfil e Carteiras, em desktop e mobile. O Carrinho, o Login e o Cadastro foram reescritos nessa rodada, e o Início ganhou as promoções e o diário. Confirmação, Perfil e Carteiras não têm frame mobile: adaptados do padrão das telas mobile existentes.

**Lighthouse (2026-11-06):** 3 medições por alvo, relatórios e ambiente em `lighthouse/` (`RESULTADOS.md`). A primeira rodada oficial (notebook com carga de 3 a 4) deu 65 e 66 no mobile; a auditoria achou e corrigiu um CLS de 0,29 no detalhe desktop (rodapé que pulava). Depois das otimizações mobile (decisão `0009`: uma composição por viewport, chunk do MSW menor e baixado em paralelo, imagens de 450 px em `srcset`, botão Voltar no skeleton do detalhe), a rodada oficial atinge todas as metas (commit `f65abe8`, depois da revisão visual de 2026-11-07): Performance 92 e 90 no mobile e 99 e 100 no desktop, Acessibilidade 100, Boas práticas 100 e SEO 92. Essa rodada foi feita numa máquina de nuvem ociosa e mais rápida (índice de CPU do Lighthouse perto de 3300, contra cerca de 1100 no notebook). No mesmo ambiente, a versão anterior dava 87 e 84, ou seja, o ganho é real, mas no notebook a nota mobile deve ficar abaixo. Medir também numa máquina local mais lenta é opcional.

**Documentação (2026-11-06):** `README.md` e `ARCHITECTURE.md` completos. Checkout limpo comprovado: um clone novo do repositório rodou `npm ci`, `lint`, `typecheck`, `build` e testes Playwright (detalhe e regressão visual) sem nada fora do repositório.

**Deploy (2026-11-06):** publicado na Vercel em https://frontend-challenge-jg.vercel.app, e republicado depois de integrar o trabalho de performance mobile e a revisão pré-deploy (commit `a4bde56`); a primeira publicação era de `b4f9be1`. Na primeira publicação, a suíte Playwright rodou contra a URL publicada (`E2E_BASE_URL`): desktop 53 e mobile 50 passados, 4 pulados, cobrindo acesso direto, refresh, login, compra até o recibo e tempo real. O teste de sessão expirada no checkout foi ajustado porque, na rede mais lenta, a expiração de uso único chegava por uma consulta em segundo plano antes do clique; o app já se comportava certo.

**Revisão antes do deploy (2026-11-07):** (1) Figma: os 15 frames comparados de novo com o app, mais tablet de 820 px (método e resultado em `docs/decisoes/0008-fidelidade-visual-e-desvios.md`); corrigidos a mancha clara sobre a tab bar mobile (traços do ícone de scan esticados pela barra toda, defeito que a baseline visual tinha registrado), o rodapé (bloco de 1200 px e colunas a cada 303 px), o título cortado no carrinho mobile, o alinhamento de "Meu perfil" e o tamanho do título do cadastro mobile. Baselines visuais regeneradas e revisadas. (2) README: cada comando, cenário, cupom, credencial, controle do mock e linha da tabela de falhas tem teste ou foi verificado; os que não tinham teste ganharam (cupons `WELCOME5` e `EXPIRED20`, cenários `error-503` e `timeout`, `?reset=1`). `dev` carrega com mocks e `dev:real` mostra o estado de erro sem API, como o README descreve. (3) O teste de avatar falhava porque o caminho de saída do Playwright tem acento ("inválido") e, com ele, o Chromium não entrega o arquivo ao input; passou a usar buffer. (4) Sem overflow horizontal em 390, 768 e 1440 px nas 11 rotas (início com filtros na URL, detalhe, NFT inexistente, rota inexistente, login, cadastro, carrinho, pagamento, perfil, carteiras); o perfil em 768 px estourava 50 px e passou a uma coluna até 1024 px. (5) Checkout limpo (clone novo do commit `675185d`): `npm ci`, `lint`, `typecheck`, `build` e `npm run test` com **120 passados, 4 pulados (casos só de desktop) e 0 falhas**, relatório HTML em `playwright-report/`. (6) Acessibilidade: axe-core (WCAG 2.1 AA) em todas as telas, desktop e mobile, achou só `<dl>` com filhos inválidos nos resumos do carrinho e do pagamento, corrigido; nenhuma violação de contraste, label ou alt. Em 320 px (zoom de 400%) as abas do catálogo e a quantidade do carrinho mobile estouravam a largura e o banner mobile cortava texto; corrigidos. As duas verificações viraram `e2e/14-acessibilidade.spec.ts`. Checkout limpo final: **126 passados, 6 pulados, 0 falhas**. `docs/TEMP-EXPORTS-FIGMA.md` e `docs/figma-exports/` apagados.

**Próximo passo:** (1) enviar o link do repositório e a URL pública; (2) opcional, medir o mobile numa máquina local mais lenta: as notas do Lighthouse mobile dependem da CPU de quem mede (ver `lighthouse/RESULTADOS.md`). Os arquivos temporários foram apagados e o deploy foi refeito com as otimizações mobile.

Pendências abertas: "Mercado, Criadores, Aprenda" do Header são botões inertes (fora do escopo, §3); `nft.updated` só chega para NFTs assinados (catálogo, detalhe e carrinho assinam; relacionados do detalhe não).

Marcar `[x]` somente com evidência (teste passando, relatório gerado, URL no ar). Os números `§N` apontam para o enunciado, que é o dono dos requisitos.

Legenda da evidência: `eNN` é o arquivo `e2e/NN-*.spec.ts` (suíte verde em 2026-11-07, desktop e mobile); `Figma` é a revisão lado a lado de 2026-11-07 (`docs/decisoes/0008`); `axe` e `reflow` são os testes de `e2e/14-acessibilidade.spec.ts`. Itens sem teste próprio citam o código ou a documentação que os sustenta.

## Fidelidade visual e responsividade (20)

- [x] Tokens do Figma extraídos: tipografia, cores, espaçamentos (§8), em `src/styles/tokens.css`
- [x] Telas desktop e mobile: Início, Detalhe, Carrinho, Pagamento, Login, Cadastro (§3) (Figma, 1440 e 414; e13 com baselines)
- [x] Perfil, Carteiras e Confirmação funcionam em mobile sem frame (§3) (reflow e axe nas rotas em 320 e 390; e08 e e06 no projeto mobile)
- [x] Sem overflow horizontal e sem perda de conteúdo com zoom em 390, 768 e 1440 (§8) (reflow também em 320 px, equivalente a zoom de 400%; banner mobile cresce em vez de cortar texto)
- [x] shadcn/ui adaptado à identidade visual (§8) (`src/components/ui`: Dialog, Sheet, Select, Slider e Toast sobre Radix com os tokens; Figma)
- [x] Assets e fontes acessíveis localmente; substituições documentadas (§8) (`@fontsource`, `src/assets`, `ARCHITECTURE.md` "Assets substituídos e origem")
- [x] Estados não desenhados seguem o padrão visual (§1) (vazio, erro, 404 e skeletons conferidos em 2026-11-07; e12, e02)

## Fluxos e experiência (20)

Catálogo e detalhe (§3)
- [x] Destaques, catálogo, busca, filtros combináveis, ordenação, paginação (e01; banner em destaque via `GET /nfts/featured`)
- [x] Estado na URL, sobrevive a refresh e histórico; filtro reinicia página (e01)
- [x] Resultado vazio, falha e resposta fora de ordem tratados (e01, e12; fora de ordem: latência variável do mock e descarte pela chave da consulta, `ARCHITECTURE.md` "Cache, retries e sincronização")
- [x] Detalhe: galeria, informações, edição, quantidade, acesso direto, NFT inexistente, edição indisponível, limite (e02, e09)
- [x] Favoritos persistem por usuário autenticado (e04)

Carrinho (§3)
- [x] Adicionar, alterar, remover, respeitando disponibilidade por NFT e edição (e05, e02, e09)
- [x] Persiste após refresh; itens do visitante preservados ao autenticar (e05)
- [x] Cupom: aplicar, remover, inválido, expirado (e05: `KURIO10`, `WELCOME5`, `EXPIRED20`, inválido)
- [x] Subtotal, desconto, taxa de rede e total conforme a API, com precisão decimal (e05)
- [x] Reflete mudança de preço e disponibilidade com o carrinho aberto (e10, e09)

Pagamento e confirmação (§3)
- [x] Validação dos campos e revisão antes do envio (e11, e06)
- [x] Carteira e rede; simulação de conexão, recusa e desconexão (e07 recusa; conexão e "Desconectar" em `WalletSection.tsx`)
- [x] Revalidação de preço, disponibilidade, cupom e taxas; mudança exige nova confirmação (e07, e09; o mock compara a cotação inteira, linhas, cupom, taxa e totais, em `quoteFingerprint`)
- [x] Sem pedido duplicado em clique repetido ou reenvio após timeout (e07, e11)
- [x] Pedido pendente, confirmado e recusado, com recuperação após refresh e reconexão (e07, e10)
- [x] Confirmação só para pedido confirmado; recibo é snapshot imutável (e06)
- [x] Falha preserva itens; sucesso remove só itens e quantidades comprados (e07, e06)

Conta e sessão (§3)
- [x] Cadastro com conflito, login com retorno ao fluxo, logout (e03)
- [x] Sessão recuperável após refresh; expiração na navegação e no checkout com retomada (e03)
- [x] Perfil: dados, avatar, senha; carteiras principal e secundária; erros da API exibidos (e08)
- [x] Checkout, perfil, carteiras, favoritos e pedidos exigem autenticação (e03, e04, e06; `beforeLoad` em checkout, perfil, carteiras e recibo)
- [x] Rota inexistente e acesso direto a qualquer tela previstos (e02; reflow abre cada rota direto)
- [x] Ações fora do escopo não aparentam sucesso funcional (`aria-disabled` e aviso "Indisponível nesta demonstração"; lista em `ARCHITECTURE.md` "Limitações")

## Integração e estado (15)

- [x] Contratos tipados entre transporte, estado e interface (§4) (Zod em `src/api/contracts`, `parse` em cada query e mutation)
- [x] Carregamento, vazio, erro, sucesso e atualização em segundo plano (§4) (e12, e01, e09)
- [x] Invalidação coerente após mutations e eventos (§4) (e09, e10; `ARCHITECTURE.md` "Cache, retries e sincronização")
- [x] Cancelamento ou descarte de resposta obsoleta (§4) (`signal` do Axios em todas as queries de `src/api/queries`)
- [x] Isolamento por usuário e por parâmetros da consulta (§4) (e03 troca de usuário, e08 carteiras, e06 recibo de outro usuário)
- [x] Recuperação de falha sem duplicar operação (§4) (e07 timeout com o mesmo pedido)
- [x] Atualização otimista com rollback em pelo menos uma interação (§4) (e04, favoritos)
- [x] Contratos REST mínimos definidos e documentados: sessão, NFTs, favoritos, carrinho, cotação, pedidos, perfil, carteiras (§5) (`ARCHITECTURE.md` "Contratos REST")
- [x] Erros representados: validação, sessão inválida, permissão, inexistente, conflito de disponibilidade, falha transitória (§5) (`errorCodeSchema` em `src/api/contracts/common.ts`; e03, e02, e07, e12)
- [x] Idempotência de pedido na API simulada (§5) (e07; `ARCHITECTURE.md` "Pedido e idempotência")
- [x] Política de cache, retries e sincronização documentada (§4) (`ARCHITECTURE.md`; e12 cobre a repetição do 503)

## Tempo real (10)

- [x] `socket.io-client` real conectado ao mock via MSW (§6, §7) (e09, e10)
- [x] `nft.updated` atualiza catálogo, detalhe e carrinho (§7) (detalhe e09, carrinho e10; catálogo conferido em 2026-11-07 com `__kurioMock.updateNft`, card de 1,19 para 1,39 ETH sem recarregar)
- [x] `order.updated` atualiza pedido e mostra confirmação ou recusa (§7) (e10, e06, e07)
- [x] Eventos com id estável, recurso e versão; duplicata e evento antigo ignorados (§7) (e10)
- [x] Reconciliação com REST após reconexão (§7) (e10)
- [x] Evento de sessão anterior não afeta outro usuário (§7) (e10)
- [x] Listeners e subscriptions liberados no ciclo de vida (§7) (e10)
- [x] Cenário: NFT no carrinho muda de preço ou disponibilidade, UI avisa, resumo atualiza, checkout bloqueia cotação velha (§7) (e09, e10)
- [x] Queda de conexão com pedido pendente recupera estado sem nova compra (§7) (e10)
- [x] Feedback acessível para mudanças em tempo real (§8) (avisos do carrinho e do checkout em `role="status"`; e10)

## Mocking (10)

- [x] MSW só na camada de rede, sem mock em componentes, hooks ou Axios (§6) (`src/` só importa `mocks/` no `main.tsx`, sob `VITE_ENABLE_MOCKS`)
- [x] Estado consistente entre catálogo, favoritos, carrinho, perfil, carteiras e pedidos; persistência local e reset (§6) (e05, e08, e06; e12 cobre `?reset=1`)
- [x] Ativação por configuração; disponível no build de demonstração (§6) (`.env.mocks`; `dev:real` sem mock mostra o erro de API)
- [x] Mudança nos dados reflete em REST e em eventos (§6) (e09: o pedido fecha pelo preço novo que o evento anunciou)
- [x] Fixtures variadas para filtros e paginação; pelo menos dois usuários (§6) (36 NFTs, 9 coleções, 3 redes; Ana e Bruno)
- [x] Rede configurável e reproduzível: lentidão, latência variável, timeout, conexão indisponível, erros HTTP (§6) (e12: `slow`, `timeout`, `offline`, `error-500`, `error-503`)
- [x] Cenário: sucesso e resultado vazio (e06, e12)
- [x] Cenário: latência variável e respostas fora de ordem (cenário `default`, latência de 150 a 749 ms derivada da URL, em `mocks/network.ts`)
- [x] Cenário: falha de conexão e HTTP 4xx/5xx (e12, e03, e07)
- [x] Cenário: sessão expirada e acesso não autorizado (e03, e06)
- [x] Cenário: conflito de cadastro ou validação (e03, e08)
- [x] Cenário: cupom inválido ou expirado (e05)
- [x] Cenário: preço alterado ou edição esgotada durante a compra (e07)
- [x] Cenário: timeout após criar pedido, recuperação por idempotência (e07)
- [x] Cenário: pagamento confirmado e pagamento recusado (e06, e07)
- [x] Transporte do Socket.IO no mock e limitações documentados (§6) (`ARCHITECTURE.md` "Transporte do Socket.IO no mock e limitações")

## Testes Playwright (10)

Executáveis com os mocks, Chromium, viewports desktop e mobile (§9).

- [x] 1. Busca, filtros combinados, ordenação, paginação, restauração pelo histórico
- [x] 2. Acesso direto ao detalhe e recurso inexistente
- [x] 3. Cadastro, login, expiração de sessão, logout, troca de usuário
- [x] 4. Favoritos, com falha de mutation e recuperação
- [x] 5. Carrinho: quantidades, remoção, cupom, persistência após refresh e login
- [x] 6. Compra completa do catálogo ao recibo confirmado
- [x] 7. Falha de pagamento, clique repetido, timeout com recuperação do mesmo pedido
- [x] 8. Perfil, avatar, senha e carteiras, com erros de validação
- [x] 9. Mudança de preço ou disponibilidade via Socket.IO durante o checkout
- [x] 10. Eventos duplicados ou antigos, desconexão, retomada de pedido pendente
- [x] 11. Teclado, foco de diálogos, validação de formulários
- [x] 12. Skeletons em carga lenta, feedback de falha, nova tentativa
- [x] Regressão visual de início, detalhe, carrinho e pagamento, baselines versionadas, dados estáveis
- [x] Cada teste parte de estado isolado; relógio, latência e disparo de eventos controlados (contexto novo e mock zerado por teste; latência e falhas pelos cenários; eventos pelos controles do mock. Nenhum teste depende do relógio real: expiração de sessão e demora de pagamento vêm de cenários, não de tempo decorrido)
- [x] Testes de tempo real passam pelo cliente Socket.IO; os de REST pelos handlers MSW
- [x] Relatório HTML e traces das falhas

## Acessibilidade (5)

- [x] Teclado completo e foco visível (§8) (e11)
- [x] Foco controlado em diálogos e drawers (§8) (e11)
- [x] Semântica, labels e erros associados aos campos (§8) (e11; axe sem violações, inclusive com os erros do checkout na tela)
- [x] Alt text em imagens relevantes (§8) (axe; Lighthouse Acessibilidade 100)
- [x] Contraste legível; estado não depende só de cor (§8) (axe em todas as telas, desktop e mobile; edição esgotada também riscada e com texto)
- [x] Feedback acessível para mutations (§8) (toasts em `role="status"`/`alert`; e04, e05)
- [x] Skeleton respeita movimento reduzido (§8) (e12)

## Performance (5)

Início e detalhe, mobile e desktop, build otimizado, cenário padrão dos mocks (§10).

- [x] Config do Lighthouse versionada
- [x] 3 medições por página e perfil, mediana por categoria
- [x] Metas de Performance, Accessibility, Best Practices e SEO do §10 (commit `f65abe8`: Performance 99 e 100 no desktop e 92 e 90 no mobile; Accessibility 100, Best Practices 100 e SEO 92 em todos os alvos; ambiente e ressalva de CPU em `lighthouse/RESULTADOS.md`)
- [x] LCP, CLS e TBT registrados
- [x] Relatórios HTML/JSON, versões das ferramentas, ambiente e condições
- [x] Justificativa e causa para qualquer meta não atingida
- [x] Auditoria com imagens, fontes e funcionalidades reais, sem simplificação só para a nota

## Arquitetura e documentação (5)

- [x] `README.md` da solução (enunciado já movido para `docs/DESAFIO.md`) (§12)
- [x] `ARCHITECTURE.md` completo (§12)
- [x] Scripts: dev com mocks, build, preview, typecheck, lint, Playwright, Lighthouse (§12)
- [x] Lockfile, assets, mocks, fixtures, testes e config de auditoria versionados (§12)
- [x] Executa de checkout limpo, sem serviço privado (§12)

## Entrega (§12)

- [x] Deploy público (Vercel, Netlify ou Cloudflare Pages) com mocks e tempo real funcionando
- [x] Acesso direto e refresh de rotas funcionam no ambiente publicado (fallback de SPA)
- [x] Versão publicada corresponde ao código entregue (deploy refeito do commit `a4bde56`, depois de juntar o branch de performance ao `main`)
- [ ] Link do repositório e URL pública enviados
