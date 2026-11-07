# Estado do projeto

Atualizado em 2026-11-07.

**Situação:** Início, Detalhe, Login, Cadastro, Favoritos, Carrinho, Pagamento, Confirmação, **Perfil e Carteiras** funcionam de ponta a ponta contra o mock (decisões `0003` a `0007`). Verificado em navegador por scripts ad hoc (não versionados), em desktop (1440) e mobile (414): compra completa até o recibo; 16 cenários de falha do checkout (recusa e nova tentativa, timeout com recuperação do mesmo pedido, cotação desatualizada, edição esgotada, clique repetido, refresh com pedido pendente, conexão recusada, mudança de preço por Socket.IO durante o checkout); e 21 checagens de Perfil e Carteiras (rota privada com retorno, validação por campo, usuário em uso, senha, avatar, secundária igual à principal, isolamento entre usuários). O recibo (`/order/:orderId`, Figma `70376:239`) só abre para pedido confirmado e usa o snapshot do pedido. Tempo real: `socket.io-client` real servido pelo MSW, com descarte de duplicata e de evento antigo, reconexão com reconciliação por REST, isolamento por usuário e liberação de listeners no logout. `typecheck`, `lint` e `build` passam. A suíte Playwright está versionada em `e2e/` (13 arquivos, 12 áreas do §9 mais regressão visual, desktop e mobile): `npm run test` deu **112 passados e 4 pulados** (casos só de desktop) em 2026-11-06, e os itens do §9 abaixo foram marcados com essa evidência. Os testes revelaram duas falhas reais, já corrigidas: o foco não voltava ao botão ao fechar a revisão do pedido, e o checkout mobile não avisava item indisponível. Sem deploy.

**Figma:** todas as telas foram lidas e comparadas com o frame em 1x (método e desvios em `docs/decisoes/0008-fidelidade-visual-e-desvios.md`): Início, Detalhe, Carrinho, Pagamento, Confirmação, Login, Cadastro, Perfil e Carteiras, em desktop e mobile. O Carrinho, o Login e o Cadastro foram reescritos nessa rodada, e o Início ganhou as promoções e o diário. Confirmação, Perfil e Carteiras não têm frame mobile: adaptados do padrão das telas mobile existentes. `docs/TEMP-EXPORTS-FIGMA.md` ficou obsoleto e pode ser apagado.

**Infra de teste e auditoria (2026-11-06):** `playwright.config.ts` (desktop 1440 e mobile 390, traces, baselines em `e2e/*-snapshots`), `vercel.json` (fallback de SPA) e `lighthouse/run.mjs` (4 alvos, 3 medições, mediana, ambiente; relatórios em `lighthouse/reports/`) foram portados de `/home/edu/Desktop/jg-mockk`, um projeto de terceiro sobre o mesmo Figma, e adaptados às nossas rotas. Scripts `test`, `test:update` e `lighthouse` no `package.json`. Falta escrever os testes em `e2e/` e rodar as 3 medições oficiais. O `jg-mockk` serve só de referência: nenhum relatório, baseline ou teste dele entra aqui, porque descrevem outra implementação. Ele confirma, a partir do Figma, campos que ainda estão em aberto aqui: Perfil (nome de exibição, usuário, e-mail, ENS, apelido da carteira, avatar, senha) e Carteiras (decisão pendente, ver `docs/FIGMA.md`).

**Lighthouse (2026-11-06):** 3 medições por alvo, relatórios e ambiente em `lighthouse/` (`RESULTADOS.md`). A primeira rodada oficial (notebook com carga de 3 a 4) deu 65 e 66 no mobile; a auditoria achou e corrigiu um CLS de 0,29 no detalhe desktop (rodapé que pulava). Depois das otimizações mobile (decisão `0009`: uma composição por viewport, chunk do MSW menor e baixado em paralelo, imagens de 450 px em `srcset`, botão Voltar no skeleton do detalhe), a rodada oficial atinge todas as metas (commit `f65abe8`, depois da revisão visual de 2026-11-07): Performance 92 e 90 no mobile e 99 e 100 no desktop, Acessibilidade 100, Boas práticas 100 e SEO 92. Essa rodada foi feita numa máquina de nuvem ociosa e mais rápida (índice de CPU do Lighthouse perto de 3300, contra cerca de 1100 no notebook). No mesmo ambiente, a versão anterior dava 87 e 84, ou seja, o ganho é real, mas no notebook a nota mobile deve ficar abaixo. Falta confirmar na máquina local (`docs/TEMP-PERFORMANCE-MOBILE.md`).

**Documentação (2026-11-06):** `README.md` e `ARCHITECTURE.md` completos. Checkout limpo comprovado: um clone novo do repositório rodou `npm ci`, `lint`, `typecheck`, `build` e testes Playwright (detalhe e regressão visual) sem nada fora do repositório.

**Deploy (2026-11-06):** publicado na Vercel em https://frontend-challenge-jg.vercel.app, a partir do commit `b4f9be1` (os commits seguintes só mexem em testes e documentação). A suíte Playwright rodou contra a URL publicada (`E2E_BASE_URL`): desktop 53 e mobile 50 passados, 4 pulados, cobrindo acesso direto, refresh, login, compra até o recibo e tempo real. O teste de sessão expirada no checkout foi ajustado porque, na rede mais lenta, a expiração de uso único chegava por uma consulta em segundo plano antes do clique; o app já se comportava certo.

**Revisão antes do deploy (2026-11-07):** (1) Figma: os 15 frames comparados de novo com o app, mais tablet de 820 px (método e resultado em `docs/decisoes/0008-fidelidade-visual-e-desvios.md`); corrigidos a mancha clara sobre a tab bar mobile (traços do ícone de scan esticados pela barra toda, defeito que a baseline visual tinha registrado), o rodapé (bloco de 1200 px e colunas a cada 303 px), o título cortado no carrinho mobile, o alinhamento de "Meu perfil" e o tamanho do título do cadastro mobile. Baselines visuais regeneradas e revisadas. (2) README: cada comando, cenário, cupom, credencial, controle do mock e linha da tabela de falhas tem teste ou foi verificado; os que não tinham teste ganharam (cupons `WELCOME5` e `EXPIRED20`, cenários `error-503` e `timeout`, `?reset=1`). `dev` carrega com mocks e `dev:real` mostra o estado de erro sem API, como o README descreve. (3) O teste de avatar falhava porque o caminho de saída do Playwright tem acento ("inválido") e, com ele, o Chromium não entrega o arquivo ao input; passou a usar buffer. (4) Sem overflow horizontal em 390, 768 e 1440 px nas 11 rotas (início com filtros na URL, detalhe, NFT inexistente, rota inexistente, login, cadastro, carrinho, pagamento, perfil, carteiras); o perfil em 768 px estourava 50 px e passou a uma coluna até 1024 px. (5) Checkout limpo (clone novo do commit `675185d`): `npm ci`, `lint`, `typecheck`, `build` e `npm run test` com **120 passados, 4 pulados (casos só de desktop) e 0 falhas**, relatório HTML em `playwright-report/`.

**Próximo passo:** (1) medir o mobile na máquina local e, confirmado, apagar `docs/TEMP-PERFORMANCE-MOBILE.md`; (2) publicar de novo na Vercel (`npx vercel --prod`), porque o deploy é de `b4f9be1` e não tem as otimizações; (3) enviar o link do repositório e a URL pública.

Pendências abertas: "Mercado, Criadores, Aprenda" do Header são botões inertes (fora do escopo, §3); `nft.updated` só chega para NFTs assinados (catálogo, detalhe e carrinho assinam; relacionados do detalhe não).

Marcar `[x]` somente com evidência (teste passando, relatório gerado, URL no ar). Os números `§N` apontam para o enunciado, que é o dono dos requisitos.

## Fidelidade visual e responsividade (20)

- [x] Tokens do Figma extraídos: tipografia, cores, espaçamentos (§8), em `src/styles/tokens.css`
- [ ] Telas desktop e mobile: Início, Detalhe, Carrinho, Pagamento, Login, Cadastro (§3)
- [ ] Perfil, Carteiras e Confirmação funcionam em mobile sem frame (§3)
- [ ] Sem overflow horizontal e sem perda de conteúdo com zoom em 390, 768 e 1440 (§8)
- [ ] shadcn/ui adaptado à identidade visual (§8)
- [ ] Assets e fontes acessíveis localmente; substituições documentadas (§8)
- [ ] Estados não desenhados seguem o padrão visual (§1)

## Fluxos e experiência (20)

Catálogo e detalhe (§3)
- [ ] Destaques, catálogo, busca, filtros combináveis, ordenação, paginação
- [ ] Estado na URL, sobrevive a refresh e histórico; filtro reinicia página
- [ ] Resultado vazio, falha e resposta fora de ordem tratados
- [ ] Detalhe: galeria, informações, edição, quantidade, acesso direto, NFT inexistente, edição indisponível, limite
- [ ] Favoritos persistem por usuário autenticado

Carrinho (§3)
- [ ] Adicionar, alterar, remover, respeitando disponibilidade por NFT e edição
- [ ] Persiste após refresh; itens do visitante preservados ao autenticar
- [ ] Cupom: aplicar, remover, inválido, expirado
- [ ] Subtotal, desconto, taxa de rede e total conforme a API, com precisão decimal
- [ ] Reflete mudança de preço e disponibilidade com o carrinho aberto

Pagamento e confirmação (§3)
- [ ] Validação dos campos e revisão antes do envio
- [ ] Carteira e rede; simulação de conexão, recusa e desconexão
- [ ] Revalidação de preço, disponibilidade, cupom e taxas; mudança exige nova confirmação
- [ ] Sem pedido duplicado em clique repetido ou reenvio após timeout
- [ ] Pedido pendente, confirmado e recusado, com recuperação após refresh e reconexão
- [ ] Confirmação só para pedido confirmado; recibo é snapshot imutável
- [ ] Falha preserva itens; sucesso remove só itens e quantidades comprados

Conta e sessão (§3)
- [ ] Cadastro com conflito, login com retorno ao fluxo, logout
- [ ] Sessão recuperável após refresh; expiração na navegação e no checkout com retomada
- [ ] Perfil: dados, avatar, senha; carteiras principal e secundária; erros da API exibidos
- [ ] Checkout, perfil, carteiras, favoritos e pedidos exigem autenticação
- [ ] Rota inexistente e acesso direto a qualquer tela previstos
- [ ] Ações fora do escopo não aparentam sucesso funcional

## Integração e estado (15)

- [ ] Contratos tipados entre transporte, estado e interface (§4)
- [ ] Carregamento, vazio, erro, sucesso e atualização em segundo plano (§4)
- [ ] Invalidação coerente após mutations e eventos (§4)
- [ ] Cancelamento ou descarte de resposta obsoleta (§4)
- [ ] Isolamento por usuário e por parâmetros da consulta (§4)
- [ ] Recuperação de falha sem duplicar operação (§4)
- [ ] Atualização otimista com rollback em pelo menos uma interação (§4)
- [ ] Contratos REST mínimos definidos e documentados: sessão, NFTs, favoritos, carrinho, cotação, pedidos, perfil, carteiras (§5)
- [ ] Erros representados: validação, sessão inválida, permissão, inexistente, conflito de disponibilidade, falha transitória (§5)
- [ ] Idempotência de pedido na API simulada (§5)
- [ ] Política de cache, retries e sincronização documentada (§4)

## Tempo real (10)

- [ ] `socket.io-client` real conectado ao mock via MSW (§6, §7)
- [ ] `nft.updated` atualiza catálogo, detalhe e carrinho (§7)
- [ ] `order.updated` atualiza pedido e mostra confirmação ou recusa (§7)
- [ ] Eventos com id estável, recurso e versão; duplicata e evento antigo ignorados (§7)
- [ ] Reconciliação com REST após reconexão (§7)
- [ ] Evento de sessão anterior não afeta outro usuário (§7)
- [ ] Listeners e subscriptions liberados no ciclo de vida (§7)
- [ ] Cenário: NFT no carrinho muda de preço ou disponibilidade, UI avisa, resumo atualiza, checkout bloqueia cotação velha (§7)
- [ ] Queda de conexão com pedido pendente recupera estado sem nova compra (§7)
- [ ] Feedback acessível para mudanças em tempo real (§8)

## Mocking (10)

- [ ] MSW só na camada de rede, sem mock em componentes, hooks ou Axios (§6)
- [ ] Estado consistente entre catálogo, favoritos, carrinho, perfil, carteiras e pedidos; persistência local e reset (§6)
- [ ] Ativação por configuração; disponível no build de demonstração (§6)
- [ ] Mudança nos dados reflete em REST e em eventos (§6)
- [ ] Fixtures variadas para filtros e paginação; pelo menos dois usuários (§6)
- [ ] Rede configurável e reproduzível: lentidão, latência variável, timeout, conexão indisponível, erros HTTP (§6)
- [ ] Cenário: sucesso e resultado vazio
- [ ] Cenário: latência variável e respostas fora de ordem
- [ ] Cenário: falha de conexão e HTTP 4xx/5xx
- [ ] Cenário: sessão expirada e acesso não autorizado
- [ ] Cenário: conflito de cadastro ou validação
- [ ] Cenário: cupom inválido ou expirado
- [ ] Cenário: preço alterado ou edição esgotada durante a compra
- [ ] Cenário: timeout após criar pedido, recuperação por idempotência
- [ ] Cenário: pagamento confirmado e pagamento recusado
- [ ] Transporte do Socket.IO no mock e limitações documentados (§6)

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
- [ ] Cada teste parte de estado isolado; relógio, latência e disparo de eventos controlados
- [x] Testes de tempo real passam pelo cliente Socket.IO; os de REST pelos handlers MSW
- [x] Relatório HTML e traces das falhas

## Acessibilidade (5)

- [ ] Teclado completo e foco visível (§8)
- [ ] Foco controlado em diálogos e drawers (§8)
- [ ] Semântica, labels e erros associados aos campos (§8)
- [ ] Alt text em imagens relevantes (§8)
- [ ] Contraste legível; estado não depende só de cor (§8)
- [ ] Feedback acessível para mutations (§8)
- [ ] Skeleton respeita movimento reduzido (§8)

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
- [x] Versão publicada corresponde ao código entregue
- [ ] Link do repositório e URL pública enviados
