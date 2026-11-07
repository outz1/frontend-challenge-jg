# Desafio Frontend: Marketplace de NFTs

Implementar o NFT Marketplace em React + TypeScript a partir do layout do Figma. APIs, autenticação, carteiras e pagamentos são 100% simulados com MSW. Avaliação de 100 pontos; deploy público é obrigatório.

## Fontes (um fato, um dono)

- Requisitos: `docs/DESAFIO.md` (enunciado, seções 1 a 12). Não copiar requisitos para outros arquivos, referenciar por seção (`§N`).
- Layout: https://www.figma.com/design/DWOkjTyFcXkNJxIJkueTlB/Frontend-Challenge--Copy-?node-id=0-1&p=f&t=oxGiAUzjI3dhNAf0-0 (fiz o fork do projeto e o acesso ja deve estar liberado)
- Progresso e checklist de entrega: `docs/ESTADO.md`.
- Decisões: `docs/decisoes/`, um arquivo por decisão, criado quando a decisão surgir.

O enunciado foi movido para `docs/DESAFIO.md`; o `README.md` da raiz é o da solução (§12).

## Invariantes

Stack obrigatória, todas com uso efetivo: React, TypeScript, TanStack Router, TanStack Query, Axios, Socket.IO (`socket.io-client`), Tailwind CSS, shadcn/ui, MSW, Playwright, Lighthouse. Build tool e libs extras são livres (Vite é a recomendação implícita do deploy).

- REST sempre via Axios. Dado remoto sempre via TanStack Query. Rotas, search params e guarda de rotas privadas via TanStack Router.
- Mocks só na camada de rede (MSW). Nenhuma resposta fictícia ou caminho de negócio alternativo em componentes, hooks ou cliente Axios.
- Tempo real: `socket.io-client` real, servido pelo MSW (`@mswjs/socket.io-binding`). Nunca simular evento chamando setter, callback ou cache.
- ETH trafega e calcula como string decimal, sem `number`/float em conta ou exibição. Quantidade é inteira. A cotação da API é a referência para fechar o pedido.
- Pedido: criação idempotente por chave. Mesma chave com mesmo conteúdo devolve o mesmo pedido; conteúdo diferente gera conflito. Estados pendente, confirmado e recusado; confirmado e recusado são terminais. Tela de confirmação só para pedido confirmado pela simulação.
- Eventos `nft.updated` e `order.updated` carregam id estável, recurso e versão. Tolerar duplicata e evento antigo, reconciliar com REST após reconexão, liberar listeners ao fim do ciclo de vida.
- Sessão recuperável após refresh; expiração tratada na navegação e no checkout com retomada de contexto. Logout e troca de usuário limpam cache privado e subscriptions. Credenciais fictícias, senha nunca em claro (hash no mock).
- Mock consistente entre catálogo, favoritos, carrinho, perfil, carteiras e pedidos. Persistência local permitida; reset restaura cenário conhecido. Mudança no mock aparece em REST e em eventos.
- Busca, filtros, ordenação e página vivem na URL e sobrevivem a refresh e histórico. Mudar filtro reinicia a paginação.
- Skeleton com shimmer em tudo que depende de dados, sem layout shift e respeitando `prefers-reduced-motion`. Acessibilidade conforme §8.
- Ao menos uma atualização otimista com rollback. Política de cache, retries e sincronização documentada.
- Entrega roda de checkout limpo, sem serviço privado ou backend real. Lockfile, assets, fontes, fixtures e config do Lighthouse versionados.

## Eliminatórios (§11)

Ausência de uso efetivo da stack, fluxos principais só visuais, compra confirmada sem resposta da simulação, exposição de dados entre usuários, eventos simulados direto na UI, ausência de testes E2E executáveis.

Peso por critério: fidelidade visual 20, fluxos 20, integração e estado 15, tempo real 10, mocking 10, testes 10, acessibilidade 5, performance 5, arquitetura e documentação 5.

## Mapa de roteamento

| Preciso de | Leia |
| --- | --- |
| Escopo e o que está fora dele | docs/DESAFIO.md §1, §3 |
| Telas, fluxos, regras de carrinho, pagamento, conta | docs/DESAFIO.md §3 |
| Router, Query, cache, otimista, rotas inexistentes | docs/DESAFIO.md §4 |
| Contratos REST e erros esperados | docs/DESAFIO.md §5 |
| MSW, fixtures, cenários, falhas de rede, socket no mock | docs/DESAFIO.md §6 |
| Eventos Socket.IO e cenário de cotação desatualizada | docs/DESAFIO.md §7 |
| Responsividade, skeleton, acessibilidade, assets | docs/DESAFIO.md §8 |
| Testes Playwright (12 áreas, viewports, visual, traces) | docs/DESAFIO.md §9 |
| Lighthouse (metas, 3 medições, relatórios) | docs/DESAFIO.md §10 |
| Entrega, deploy, README e ARCHITECTURE.md | docs/DESAFIO.md §12 |
| O que já foi feito e o que falta | docs/ESTADO.md |
| Frames, node IDs e tokens do Figma | docs/FIGMA.md |

## Documentos a entregar

- `README.md` da solução: setup, variáveis de ambiente, credenciais fictícias, seleção e reset de cenários, comandos, como reproduzir cada falha.
- `ARCHITECTURE.md`: contratos REST e eventos, política de sessão, estado do carrinho, cache e retries, reconciliação REST x Socket.IO, transporte do socket no mock e limitações, limitações gerais, decisões de UX, desvios do Figma e de acessibilidade, assets substituídos.
- Lighthouse: relatórios HTML/JSON, versões das ferramentas, ambiente, mediana de 3 medições por página e perfil, LCP/CLS/TBT, justificativa de metas não atingidas.
- Playwright: relatório HTML, traces das falhas, baselines visuais versionadas.

## Comandos obrigatórios

Scripts do `package.json` (npm):

- `npm run dev`: dev com mocks (`--mode mocks`, lê `.env.mocks`). `npm run dev:real`: sem mocks.
- `npm run build`: gera rotas, typecheck e build de demonstração com mocks. `npm run preview`: serve o build na porta 4173.
- `npm run typecheck`, `npm run lint`.
- Testes e auditoria: `npm run test` (Playwright; `test:update` regenera baselines) e `npm run lighthouse` (precisa de `npm run build` antes).

## Convenções

- Docs em português. Código, identificadores e commits em inglês (o histórico git existente está em inglês).
- Estilo do código novo segue o que já existir ao redor.
- Ao fechar um bloco de trabalho, atualizar `docs/ESTADO.md` e propor o commit.
