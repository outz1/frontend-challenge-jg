# Estado do projeto

Atualizado em 2026-11-06.

**Situação:** Início, Detalhe, Login, Cadastro, Favoritos, Carrinho, Pagamento, Confirmação, **Perfil e Carteiras** funcionam de ponta a ponta contra o mock (decisões `0003` a `0007`). Verificado em navegador por scripts ad hoc (não versionados), em desktop (1440) e mobile (414): compra completa até o recibo; 16 cenários de falha do checkout (recusa e nova tentativa, timeout com recuperação do mesmo pedido, cotação desatualizada, edição esgotada, clique repetido, refresh com pedido pendente, conexão recusada, mudança de preço por Socket.IO durante o checkout); e 21 checagens de Perfil e Carteiras (rota privada com retorno, validação por campo, usuário em uso, senha, avatar, secundária igual à principal, isolamento entre usuários). O recibo (`/order/:orderId`, Figma `70376:239`) só abre para pedido confirmado e usa o snapshot do pedido. Tempo real: `socket.io-client` real servido pelo MSW, com descarte de duplicata e de evento antigo, reconexão com reconciliação por REST, isolamento por usuário e liberação de listeners no logout. `typecheck`, `lint` e `build` passam. A suíte Playwright está versionada em `e2e/` (13 arquivos, 12 áreas do §9 mais regressão visual, desktop e mobile): `npm run test` deu **112 passados e 4 pulados** (casos só de desktop) em 2026-11-06, e os itens do §9 abaixo foram marcados com essa evidência. Os testes revelaram duas falhas reais, já corrigidas: o foco não voltava ao botão ao fechar a revisão do pedido, e o checkout mobile não avisava item indisponível. Sem deploy.

**Figma:** todas as telas foram lidas e comparadas com o frame em 1x (método e desvios em `docs/decisoes/0008-fidelidade-visual-e-desvios.md`): Início, Detalhe, Carrinho, Pagamento, Confirmação, Login, Cadastro, Perfil e Carteiras, em desktop e mobile. O Carrinho, o Login e o Cadastro foram reescritos nessa rodada, e o Início ganhou as promoções e o diário. Confirmação, Perfil e Carteiras não têm frame mobile: adaptados do padrão das telas mobile existentes. `docs/TEMP-EXPORTS-FIGMA.md` ficou obsoleto e pode ser apagado.

**Infra de teste e auditoria (2026-11-06):** `playwright.config.ts` (desktop 1440 e mobile 390, traces, baselines em `e2e/*-snapshots`), `vercel.json` (fallback de SPA) e `lighthouse/run.mjs` (4 alvos, 3 medições, mediana, ambiente; relatórios em `lighthouse/reports/`) foram portados de `/home/edu/Desktop/jg-mockk`, um projeto de terceiro sobre o mesmo Figma, e adaptados às nossas rotas. Scripts `test`, `test:update` e `lighthouse` no `package.json`. Falta escrever os testes em `e2e/` e rodar as 3 medições oficiais. O `jg-mockk` serve só de referência: nenhum relatório, baseline ou teste dele entra aqui, porque descrevem outra implementação. Ele confirma, a partir do Figma, campos que ainda estão em aberto aqui: Perfil (nome de exibição, usuário, e-mail, ENS, apelido da carteira, avatar, senha) e Carteiras (decisão pendente, ver `docs/FIGMA.md`).

**Próximo passo:** (1) Lighthouse, `ARCHITECTURE.md`, `README.md` e deploy.

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

- [ ] Config do Lighthouse versionada
- [ ] 3 medições por página e perfil, mediana por categoria
- [ ] Metas de Performance, Accessibility, Best Practices e SEO do §10
- [ ] LCP, CLS e TBT registrados
- [ ] Relatórios HTML/JSON, versões das ferramentas, ambiente e condições
- [ ] Justificativa e causa para qualquer meta não atingida
- [ ] Auditoria com imagens, fontes e funcionalidades reais, sem simplificação só para a nota

## Arquitetura e documentação (5)

- [ ] `README.md` da solução (enunciado já movido para `docs/DESAFIO.md`) (§12)
- [ ] `ARCHITECTURE.md` completo (§12)
- [ ] Scripts: dev com mocks, build, preview, typecheck, lint, Playwright, Lighthouse (§12)
- [ ] Lockfile, assets, mocks, fixtures, testes e config de auditoria versionados (§12)
- [ ] Executa de checkout limpo, sem serviço privado (§12)

## Entrega (§12)

- [ ] Deploy público (Vercel, Netlify ou Cloudflare Pages) com mocks e tempo real funcionando
- [ ] Acesso direto e refresh de rotas funcionam no ambiente publicado (fallback de SPA)
- [ ] Versão publicada corresponde ao código entregue
- [ ] Link do repositório e URL pública enviados
