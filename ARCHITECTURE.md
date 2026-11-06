# Arquitetura

SPA de marketplace de NFTs. Blockchain, carteira, pagamento e backend são simulados no navegador, e nenhuma tela afirma executar uma transação real. A simulação preserva os limites de uma integração remota: contratos HTTP tipados, latência, falhas, persistência, autenticação, idempotência e eventos assíncronos. Requisitos em `docs/DESAFIO.md`; as decisões datadas ficam em `docs/decisoes/` e este documento as resume.

## Camadas

```text
rota → feature → query/mutation → módulo API → Axios → MSW → estado local (localStorage)
                                       ↑                      │
                                       └──── Socket.IO ←──────┘
```

1. `src/routes`: TanStack Router file-based. Search params validados com Zod; rotas privadas passam por `requireSession` em `beforeLoad`.
2. `src/features`: apresentação e coordenação de cada fluxo. Componentes não importam fixtures nem o banco simulado.
3. `src/api/contracts`: fonte única dos tipos (Zod), compartilhada entre cliente e handlers do mock.
4. `src/api`: instância Axios (`client.ts`) e `queries/` com `queryOptions` e mutations.
5. TanStack Query: cache, invalidação, estados assíncronos e mutations otimistas.
6. `src/realtime`: `socket.io-client`, descarte de duplicata e de evento antigo, reconciliação por REST.
7. `mocks/`: o outro lado da rede. MSW implementa os mesmos contratos; é a **única** camada com respostas fictícias. Componentes, hooks e o cliente Axios não contêm resposta falsa nem caminho de negócio alternativo.

O mock liga por `VITE_ENABLE_MOCKS` (`.env.mocks`, lido por `--mode mocks`). O build de demonstração e o deploy usam essa configuração.

## Contratos REST

Detalhes de cada rota, método e payload estão em `docs/decisoes/0002-contratos.md`; os schemas executáveis estão em `src/api/contracts/`. Resumo:

- Base `/api`, JSON, `Authorization: Bearer <token>` nas rotas privadas. O visitante envia `X-Guest-Id` (uuid gerado no cliente) nas rotas de carrinho.
- ETH é **string decimal** (`^\d+(\.\d{1,18})?$`); quantidade é inteiro; datas ISO 8601 UTC. Nenhuma conta ou exibição de ETH usa `number` (cálculo e formatação com `big.js`, e o slider de preço trabalha em centavos inteiros).
- Recursos mutáveis carregam `version`, o que o cliente compara com `event.version`.
- Envelope de erro único: `{ error: { code, message, fieldErrors?, retryAfterMs?, details? } }`. A tela mostra `fieldErrors` no campo correspondente.
- Listas paginadas: `{ items, page, pageSize, total, totalPages }`; arrays em query string vão separados por vírgula.

Recursos: sessão (`/auth/*`), NFTs (`/nfts`, `/nfts/featured`, `/nfts/:id`), favoritos, carrinho (`/cart`, itens, cupom), cotação (`POST /quotes`), pedidos (`POST /orders`, `GET /orders/:id`), perfil (dados, avatar, senha) e carteiras (cadastro, edição, conexão simulada).

| HTTP | `code` | Quando |
| --- | --- | --- |
| 401 | `unauthenticated`, `invalid_credentials`, `session_expired` | Sem sessão, credencial errada, sessão vencida |
| 403 | `forbidden` | Recurso de outro usuário |
| 404 | `not_found` | NFT, pedido, item ou carteira inexistente |
| 409 | `email_taken`, `wallet_kind_taken`, `wallet_not_connected` | Conflitos de conta e carteira |
| 409 | `availability_conflict` | Edição esgotada ou acima do limite |
| 409 | `quote_stale` | Cotação do pedido não bate com o estado atual (`details.quote` traz a nova) |
| 409 | `idempotency_conflict` | Mesma `Idempotency-Key` com conteúdo diferente |
| 422 | `validation_error`, `coupon_invalid`, `coupon_expired`, `wallet_rejected` | Validação por campo, cupom, recusa de conexão |
| 503 | `transient_error` | Falha transitória; seguro repetir |

Timeout de rede e falta de conexão não têm corpo: o Axios rejeita sem `response` e o cliente os normaliza em `ApiRequestError` (`network` ou `timeout`).

### Pedido e idempotência

`POST /orders` exige `Idempotency-Key` e envia o `quoteId` que o usuário viu. A chave é por usuário e guarda a impressão digital de `quoteId + walletId + network + collector`: mesma chave e mesmo conteúdo devolvem o mesmo pedido (200 com `Idempotent-Replayed: true`); conteúdo diferente gera `idempotency_conflict`.

O servidor recalcula a cotação ao criar. Estoque zerado vira `availability_conflict`; cotação expirada ou com preço, estoque, cupom ou taxa diferentes vira `quote_stale` com a cotação nova, e nenhum pedido é criado. **Quem fecha o pedido é a cotação do servidor, nunca uma conta do cliente.**

Estados `pending`, `confirmed` e `rejected`; os dois últimos são terminais. O pedido nasce `pending` e a simulação o decide em cerca de 2,5 s. O resultado fica gravado no pedido: após refresh, o mock fecha o que venceu ou reagenda. A confirmação tira do carrinho só o que foi comprado, baixa o estoque das edições limitadas (gera `nft.updated`) e o recibo é o próprio pedido, um snapshot imutável de linhas e valores. A recusa preserva o carrinho. A tela de confirmação só abre para pedido confirmado: pendente volta ao acompanhamento e recusado volta ao checkout.

No cliente, a tentativa de envio (chave e corpo) fica em `sessionStorage`. Se o envio estoura por timeout ou queda de rede, a tela só permite "Verificar pedido", que repete a mesma chave e recebe o mesmo pedido. Um pedido em andamento vive na URL (`/checkout?order=<id>`) e sobrevive a refresh.

## Eventos Socket.IO

Envelope comum: `{ eventId, type, resource: { type, id }, version, occurredAt, userId?, data }`.

| Evento | Recurso | `data` | Efeito |
| --- | --- | --- | --- |
| `nft.updated` | `nft` | preço, preço de referência, e por edição preço e disponibilidade | Atualiza catálogo, detalhe e carrinho; avisa quando o NFT está no carrinho |
| `order.updated` | `order` | estado, hash da transação, motivo de recusa | Atualiza o pedido; leva ao recibo ou à recusa |

Cliente para servidor (com ack): `subscribe` e `unsubscribe` de NFTs. `eventId` é estável (a reentrega traz o mesmo id), e a `version` é por recurso.

## Política de sessão

- **Token** em `localStorage` (`kurio:token`); a sessão é lida por `GET /auth/session` (query `['session']`). Sem token, nem chama a API. Como o backend é simulado no navegador, o token fica em `localStorage`; uma API real usaria cookie seguro e `HttpOnly`.
- **TTL** de 30 min no mock, para a expiração aparecer numa demonstração.
- **Recuperável após refresh:** a sessão volta pelo token. Rotas privadas (checkout, pedido, perfil, carteiras) redirecionam o visitante para `/login?redirect=<destino>`, e o login devolve ao destino (só caminhos internos, `safeRedirect`).
- **Expiração** (`session_expired` ou `unauthenticated` com token enviado): o interceptor do Axios limpa o token e avisa `onSessionLost`; o app descarta o cache privado e leva a `/login?redirect=<href atual>&reason=expired`. No checkout, o carrinho e o rascunho do formulário permanecem, e depois de entrar a tela volta ao `/checkout`.
- **Logout e troca de usuário:** o logout é local e imediato (token e cache privado saem antes da resposta; `POST /auth/logout` segue em segundo plano). Todo cache é descartado (`dropPrivateCache`), o socket fecha e libera listeners e subscriptions, e a próxima conexão usa a nova identidade. As chaves privadas ainda carregam o id do dono (`['favorites', userId]`, `['cart', owner]`) como segunda barreira.
- **Credenciais fictícias**, senha nunca em claro: o mock guarda só o hash SHA-256 com sal, responde igual a e-mail desconhecido e senha errada, e confere a senha atual na troca de senha.

## Estado do carrinho

- **O servidor decide.** O mock calcula o limite (menor entre disponibilidade da edição e teto por pedido) e responde `availability_conflict` com `details`. A UI mostra o limite como dica e usa o valor devolvido.
- **Visitante e usuário:** o carrinho do visitante é chaveado por `X-Guest-Id`. Login e cadastro enviam `guestCartId` e o servidor funde os itens na mesma resposta (soma limitada pela disponibilidade; o cupom do visitante é mantido se a conta não tem um). Outro usuário nunca vê esses itens.
- **Totais:** subtotal, desconto, taxa de rede e total vêm de `POST /quotes`, refeita quando `cart.version` muda (`placeholderData` evita piscar). A cotação da API é a referência para fechar o pedido.
- **Quantidade:** muda na tela na hora e o envio é agrupado (350 ms), então cliques rápidos viram uma só chamada com o valor final. As mutations do carrinho têm `scope` único, rodam em série e nunca chegam fora de ordem.
- **Ao vivo:** mudança de preço ou estoque de um NFT no carrinho atualiza o item (cada item guarda `nftVersion`), refaz a cotação e avisa em região viva (`role="status"`). O checkout não fecha uma cotação velha.
- **Persistência:** itens e cupom vivem no estado do mock e sobrevivem a refresh e ao login.

## Cache, retries e sincronização

Política em `src/api/queryClient.ts`:

| Item | Política |
| --- | --- |
| Frescor | `staleTime` de 30 s; `gcTime` de 5 min |
| Foco e reconexão | Refaz em segundo plano ao voltar à aba e ao reconectar |
| Retries | Só falha transitória (sem resposta, timeout, 503), no máximo 2 vezes, com backoff exponencial (1 s, 2 s, limitado a 4 s) |
| 4xx | Nunca repete: erro de negócio não melhora tentando de novo |
| Mutations | Não repetem sozinhas; o reenvio seguro depende de chave de idempotência |
| Obsoleto | O `signal` do Axios cancela requisição obsoleta; respostas fora de ordem são descartadas pela chave da consulta |
| Isolamento | Chaves de consulta carregam parâmetros e dono; o catálogo usa `keepPreviousData` na troca de filtro e página |

Atualizações otimistas com rollback: favoritos (`onMutate` guarda o anterior e cancela refetch, `onError` restaura e avisa, `onSettled` reconcilia com a API) e a quantidade do carrinho (valor local até a API responder). Detalhe, perfil e carteiras gravam no cache o que a API devolveu, sem refetch.

A rota de detalhe só dispara `prefetchQuery` no `loader` (sem bloquear), então o preload por intenção aquece o cache e a tela mostra skeleton com as dimensões finais.

## Reconciliação entre REST e Socket.IO

REST é a fonte de verdade; o evento é um sinal rápido.

- **Duplicata e evento antigo:** um `EventLedger` descarta `eventId` repetido e versão menor ou igual à já vista. Além disso, cada entrada de cache (detalhe, listas, destaque, item do carrinho) só muda se a versão do evento for maior que a dela, então uma resposta REST mais nova nunca é sobrescrita por um evento atrasado.
- **Reconexão:** em toda conexão, invalida pedidos; em reconexão, invalida NFTs ativos, carrinho e cotação, que são refeitos por REST. Assim, o que mudou durante a queda aparece sem depender de evento.
- **Pedido pendente:** a consulta do pedido repete a cada 3 s enquanto ele está `pending`, para cobrir socket fora do ar. A queda de conexão com pedido pendente recupera o estado sem nova compra.
- **Isolamento:** evento de pedido com `userId` diferente do usuário atual é descartado, mesmo com o servidor já filtrando por usuário.
- **Ciclo de vida:** o `RealtimeProvider` mantém uma conexão por identidade (visitante ou usuário). Logout e troca de usuário fecham a conexão e soltam listeners; as assinaturas têm contagem de referência (`useNftSubscription`) e são refeitas a cada reconexão.

## Transporte do Socket.IO no mock e limitações

O cliente é o `socket.io-client` real, só com `transports: ['websocket']`, no `path: '/realtime'`. O outro lado é o `@mswjs/socket.io-binding`, que intercepta o WebSocket no navegador.

- **`path` próprio** porque o MSW remove o prefixo `/socket.io/` ao comparar rotas e o padrão capturaria qualquer WebSocket da origem, inclusive o HMR do Vite.
- **Carga com `import()` dinâmico:** o `engine.io-client` guarda o construtor de `WebSocket` ao ser avaliado; importado de forma estática, pegaria o nativo antes de o MSW iniciar e o mock nunca veria a conexão.
- **Limitações do binding** (cobertas em `mocks/socket/index.ts`): handshake fixo (`sid: "test"`) e sempre aceito, então o `auth` é lido do pacote CONNECT cru e token inválido recebe CONNECT_ERROR; sem acks, então `subscribe` e `unsubscribe` respondem o ACK cru; sem ping, então o servidor envia `2` a cada 20 s; sem salas, então o registro de conexões faz o papel de sala por usuário e por NFT; uma só namespace; sem long-polling.
- Toda mudança em NFT passa por `mutateNft` (`mocks/nftState.ts`), que atualiza o estado, sobe a `version`, persiste e notifica. REST e eventos leem a mesma fonte, então nunca divergem.
- Os controles `window.__kurioMock` (documentados no README) agem no servidor simulado e chegam ao cliente real; nenhuma simulação toca estado da UI.

## Limitações

- O backend existe só no navegador (estado em `localStorage`, `kurio:mock-db`). **Várias abas** da mesma origem não compartilham o estado em memória do mock: mudanças feitas em uma só aparecem em outra depois de recarregar, e o tempo real não atravessa abas.
- Segurança do mock é demonstrativa: hash SHA-256 e token ficam no navegador; uma API real exigiria cookie `HttpOnly`, hash lento no servidor e TLS.
- A carteira, a rede e o pagamento são simulados; "Ver no Etherscan", compartilhar, Google, Facebook, "Ler mais", Atividade, Ofertas e afins não executam ação e avisam disso (fora do escopo, §3).
- O catálogo tem 36 NFTs determinísticos reutilizando as artes exportadas do Figma, e as contagens das facetas vêm das fixtures, não dos números ilustrativos do Figma.
- O MSW entra no pacote de produção do deploy de demonstração, o que pesa no mobile: Performance 65 e 66 contra a meta de 90 (`lighthouse/RESULTADOS.md`). As demais categorias atingem as metas.
- Várias telas existem em duas árvores no DOM (desktop e mobile, uma escondida por CSS) porque os frames são composições diferentes; isso duplica algumas requisições de imagem (mesma URL, cache do navegador).
- Perfil, Carteiras e Confirmação não têm frame mobile: foram adaptados do padrão das telas mobile existentes.

## Decisões de UX

- **Estado na URL:** busca, filtros, aba, ordenação e página vivem nos search params; qualquer mudança de filtro reinicia a página; valor inválido na URL cai no padrão em vez de quebrar a rota. A busca por digitação usa `replace` com debounce (350 ms) para não empilhar histórico.
- **Skeleton com shimmer** em tudo que depende de dado, com as dimensões do conteúdo final (sem layout shift); respeita `prefers-reduced-motion`. A auditoria achou um CLS de 0,29 no detalhe desktop (skeleton mais baixo que a página) e foi corrigido.
- **Sem ação fingida:** botões fora do escopo ficam visíveis, com `aria-disabled` e aviso, para nenhuma ação aparentar sucesso.
- **Compra:** revisão antes do envio; conexão da carteira acontece ao enviar; mudança de preço, estoque, cupom ou taxa exige nova confirmação; o botão de envio espera a cotação nova; uma trava síncrona impede pedido duplicado por clique repetido.
- **Avisos e feedback de mutations** por região viva (`role="status"`/`alert`); erros de formulário ficam no campo, associados por `aria-describedby`, com foco no primeiro inválido.
- **Diálogos** (login, revisão do pedido, recibo, zoom, busca) com foco preso, Esc e retorno do foco ao elemento que os abriu; a revisão devolve o foco ao botão "Confirmar compra". Durante o envio ou a espera pela liquidação o diálogo não fecha.
- **Quantidade** limitada pelo servidor: o botão no limite usa `aria-disabled` (o foco não se perde) e uma mensagem explica o limite.
- **Perfil e carteiras:** ENS e código de indicação ficam opcionais; "Igual à carteira principal" copia os dados no servidor; o campo "Nome de usuário" do cadastro vira `name` e o servidor deriva o `username`. Ver `docs/decisoes/0007-campos-perfil-e-carteiras.md`.
- **Toast** no topo no mobile e embaixo no desktop, para não cobrir as ações dos diálogos.

## Desvios do Figma

Resumo; o método de verificação e a lista completa estão em `docs/decisoes/0008-fidelidade-visual-e-desvios.md`, `0003`, `0004` e `0007`.

- Contagens da sidebar do catálogo vêm da API simulada; o catálogo de demonstração tem mais itens que os nove do frame.
- Ordenação: seletor de 320 px em vez de 300 px (o texto "Listados recentemente" encosta na seta).
- Header e rodapé somem abaixo de 768 px e a navegação passa para a tab bar, como no frame mobile; Favoritos e o botão central da tab bar ficam indisponíveis.
- Filtro selecionado ganha sublinhado além da cor, para o estado não depender só de cor.
- Etiqueta "ESGOTADO" (estado não desenhado) no estilo da etiqueta "RARO", que só existe no mobile.
- Detalhe: rótulos "Rede / Contrato / Direitos autorais" alinhados com seus textos (no frame estão trocados); pílulas de edição e linhas finas em CSS no lugar dos SVGs, mesmo traço; avaliações e compartilhar sem ação.
- Carrinho: terceira linha "Edição" em cada item desktop e botão de remover no cartão mobile, que o frame desenha só como ícone sobreposto; "Conectar e finalizar" leva ao Pagamento.
- Login: o fundo do modal desktop é o hero, e não a página inteira.
- Cadastro: "Nome de usuário" do frame é o `name` do contrato.
- Pagamento mobile mantém o formulário "Perfil do colecionador", exigido pelo contrato e ausente do frame mobile; o frame desktop traz como primeira opção de carteira um cartão com os três logos, e a implementação lista WalletConnect, MetaMask e Coinbase Wallet como opções.
- Perfil e Carteiras: Código de indicação e Nome ENS (obrigatórios no frame) são opcionais; "Adicionar" da carteira principal só aparece quando não há principal.
- Carrinho mobile do Figma soma 8,14 ETH e exibe 8,92 ETH: os valores vêm da cotação da API, não do frame.
- Linhas finas de 0,3 px do frame viram 1 px com 30% de opacidade, que reproduz o aspecto no navegador.

## Desvios de acessibilidade

- O Figma não define estados de foco: os controles usam o foco padrão do navegador e do Radix, e os campos de formulário usam a própria borda como indicador. O foco visível não foi auditado tela a tela.
- Placeholders do frame que fazem as vezes de rótulo (login e cadastro) mantêm um `label` acessível, visualmente oculto.
- Ícones decorativos têm `alt=""`; imagens de NFT têm `alt` descritivo. As imagens das promoções e do "Diário da Cunhagem" são decorativas: o título do cartão já descreve o conteúdo.
- O stepper de quantidade e os botões no limite usam `aria-disabled`, e não `disabled`, para preservar o foco.
- A auditoria de acessibilidade do Lighthouse deu 100 em início e detalhe, desktop e mobile. O contraste de checkout, carrinho e conta não foi auditado automaticamente.

## Assets substituídos e origem

- **Fonte:** Roboto Mono (400, 500 e 700) via `@fontsource/roboto-mono`, empacotada localmente; sem CDN.
- **Imagens de NFT, hero, promoções e "Diário da Cunhagem":** exportadas do Figma e convertidas para WebP e redimensionadas (a arte original tem 1254 px e cerca de 2 MB), em `src/assets/images`. O catálogo reutiliza as quatro artes de NFT, como o próprio Figma.
- **Ícones:** SVGs exportados do Figma em `src/assets/icons`, usados nas posições do frame. A marca do Google é composta por sete vetores posicionados como no Figma.
- **Variantes de estado:** onde o Figma desenha um ícone em um só estado (por exemplo o botão de diminuir do stepper mobile), há duas variantes do SVG, ativa e desativada.
- O Figma, o enunciado e os relatórios de auditoria não são assets de execução: ficam fora do bundle.
