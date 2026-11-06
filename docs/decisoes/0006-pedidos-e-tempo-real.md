# 0006: Pedidos, carteiras, perfil e tempo real

Data: 2026-11-05. Status: aceita.

Requisitos em `docs/DESAFIO.md` §3, §5, §6 e §7. Contratos em `0002`.

## Estado central do mock

- `mocks/db` guarda usuários, sessões, favoritos, carrinhos, carteiras, pedidos, chaves de idempotência, cotações e `nftState` (preço e estoque por edição). Tudo persiste em `localStorage`; `?reset=1` restaura o cenário conhecido.
- **Toda mudança em NFT passa por `mutateNft`** (`mocks/nftState.ts`): atualiza, recalcula `soldOut` e o menor preço, sobe `version`, persiste e notifica. REST e eventos leem a mesma fonte, então nunca divergem (§6).

## Pedidos

- **Idempotência** (`Idempotency-Key`): a chave é por usuário e guarda a impressão digital de `quoteId + walletId + network + collector`. Mesma chave e mesmo conteúdo devolve o mesmo pedido (200 e `Idempotent-Replayed: true`); conteúdo diferente é `idempotency_conflict`.
- **Revalidação**: o servidor recalcula a cotação na hora de criar. Estoque zerado vira `availability_conflict`; cotação expirada ou com preço, estoque, cupom ou taxa diferentes vira `quote_stale` com a cotação nova em `details.quote`, e nenhum pedido é criado. Quem decide o fechamento é a cotação do servidor, nunca conta do cliente.
- **Liquidação**: o pedido nasce `pending` e é decidido em ~2,5 s (`payment-slow`: ~20 s). `settleAt` e o resultado ficam gravados no pedido; após refresh, `resumeSettlements` fecha o que venceu ou reagenda. A leitura (`GET`) também fecha o que venceu. Confirmado e recusado são terminais: `settle` não faz nada se o pedido já saiu de `pending`.
- **Efeitos da confirmação**: sai do carrinho só o comprado, o estoque das edições limitadas baixa (gera `nft.updated`) e o recibo é o próprio pedido, snapshot das linhas e valores. Recusa preserva o carrinho.
- **Isolamento**: pedido de outro usuário responde 403 (e nunca aparece na lista).
- **Timeout após criar** (`order-timeout`, uso único): o pedido é criado e a resposta demora 15 s. O cliente (timeout de 10 s) estoura e repete a mesma chave: recebe o mesmo pedido, sem duplicar.

## Carteiras e perfil

Carteira principal e secundária por usuário (`wallet_kind_taken`), endereço validado por rede, conexão e desconexão simuladas no servidor (`wallet-rejected` recusa uma vez). Mudar rede ou endereço derruba a conexão. Perfil: nome e e-mail (`email_taken`), avatar como data URL (PNG, JPEG ou WebP até 2 MB, erros por campo) e troca de senha (senha atual conferida pelo hash).

## Tempo real

- **Transporte**: `socket.io-client` real; o WebSocket é interceptado pelo MSW (`ws.link`) com `@mswjs/socket.io-binding`. Só `transports: ['websocket']`; sem long-polling.
- **`path: '/realtime'`** em vez do `/socket.io` padrão: o MSW remove o prefixo `/socket.io/` ao comparar e o padrão passaria a capturar qualquer WebSocket da origem, inclusive o HMR do Vite.
- **Carga do cliente com `import()` dinâmico**: o `engine.io-client` guarda o construtor de `WebSocket` quando o módulo é avaliado; importado de forma estática, pegaria o nativo antes de o MSW iniciar e o mock nunca veria a conexão. Uma geração (`generation`) descarta aberturas obsoletas se houver logout durante o carregamento.
- **Limitações do binding** (cobertas em `mocks/socket/index.ts`): handshake fixo (`sid: "test"`) e sempre aceito, então o `auth` é lido do pacote CONNECT cru e token inválido recebe CONNECT_ERROR; sem acks, então `subscribe` e `unsubscribe` respondem o ACK cru; sem ping, então o servidor envia `2` a cada 20 s; sem salas, então o registro de conexões faz o papel de sala por usuário e por NFT; uma só namespace.
- **Recusa de conexão no mock** dispara `error` antes de `close`: durante o handshake o Engine.IO só reage a `error`.

## Consumo de eventos (`src/realtime`)

- **Ciclo de vida**: `RealtimeProvider` mantém uma conexão por identidade (visitante ou usuário). Logout e troca de usuário fecham, soltam listeners e abrem outra com o novo `auth`. Assinaturas têm contagem de referência (`useNftSubscription`) e são refeitas a cada reconexão.
- **Duplicata e evento antigo**: `EventLedger` descarta `eventId` repetido e versão menor ou igual à já vista. Cada entrada de cache (detalhe, listas, destaque, item do carrinho) só muda se a versão do evento for maior que a dela, então um REST mais novo nunca é sobrescrito por evento atrasado. Por isso o item do carrinho passou a carregar `nftVersion`.
- **Isolamento**: evento de pedido com `userId` diferente do usuário atual é descartado (defesa em profundidade; o servidor já filtra por usuário).
- **Reconciliação**: em toda conexão invalida pedidos; em reconexão invalida NFTs ativos, carrinho e cotação (refaz por REST).
- **Carrinho ao vivo**: mudança de preço ou estoque atualiza o item, refaz a cotação e avisa em região viva (`role="status"`).

## Cache: `removeQueries` e a sessão

Descartar o cache de sessão com `queryClient.clear()` ou `removeQueries()` global deixa quem observa a query de sessão preso ao objeto antigo (a conexão da Ana sobrevivia ao logout). Agora a sessão é gravada primeiro e `dropPrivateCache` remove todo o resto.

## Controles do mock (`window.__kurioMock`)

`updateNft`, `resendLast`, `emitStale`, `disconnect(stayDown?)`, `reconnect`, `connections`. Passam pelo servidor simulado e chegam ao `socket.io-client` real; nunca tocam estado da UI.
