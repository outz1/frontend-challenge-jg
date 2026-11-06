# 0002: Contratos REST e eventos Socket.IO

Data: 2026-11-05. Status: proposta.

Dono dos tipos: `src/api/contracts/` (Zod). Este documento descreve rotas, erros e eventos; os schemas são a fonte executável e não se copia forma de campo para cá. Requisitos: `docs/DESAFIO.md` §5 e §7. Campos de formulário (perfil, pagamento, carteira) são refinados ao implementar cada tela; o schema acompanha.

## Convenções

- Base `/api`, JSON, `Authorization: Bearer <token>` nas rotas privadas. Visitante usa `X-Guest-Id` (uuid gerado no cliente) só nas rotas de carrinho.
- ETH é string decimal `^\d+(\.\d{1,18})?$`. Quantidade é inteiro. Datas ISO 8601 UTC.
- Recursos mutáveis carregam `version` (inteiro crescente por recurso). É o que o cliente compara com `event.version`.
- Envelope de erro único: `{ error: { code, message, fieldErrors?, retryAfterMs?, details? } }`.
- Lista paginada: `{ items, page, pageSize, total, totalPages }`. Arrays em query string vão separados por vírgula.

## Erros

| HTTP | `code` | Quando |
| --- | --- | --- |
| 401 | `unauthenticated` | Sem token ou token desconhecido |
| 401 | `invalid_credentials` | Login com e-mail ou senha errados |
| 401 | `session_expired` | Token válido que expirou; o cliente guarda o contexto e retoma após novo login |
| 403 | `forbidden` | Recurso de outro usuário |
| 404 | `not_found` | NFT, pedido, item ou carteira inexistente |
| 409 | `email_taken` | Cadastro ou perfil com e-mail em uso |
| 409 | `availability_conflict` | Edição esgotada ou acima do limite; `details` traz disponível e limite |
| 409 | `quote_stale` | Cotação do pedido não bate com o estado atual; `details.quote` traz a nova |
| 409 | `idempotency_conflict` | Mesma `Idempotency-Key` com conteúdo diferente |
| 409 | `wallet_kind_taken` | Já existe carteira principal ou secundária |
| 409 | `wallet_not_connected` | Pedido sem carteira conectada |
| 422 | `validation_error` | `fieldErrors` por campo (`{ campo: [mensagens] }`) |
| 422 | `coupon_invalid`, `coupon_expired` | Cupom |
| 422 | `wallet_rejected` | Usuário recusou a conexão simulada |
| 503 | `transient_error` | Falha transitória; seguro repetir; `retryAfterMs` opcional |

Timeout de rede não tem corpo: o Axios rejeita sem `response`. Pedido enviado e sem resposta se resolve repetindo a mesma `Idempotency-Key`.

## Rotas

| Recurso | Método e rota | Request | Response |
| --- | --- | --- | --- |
| Sessão | `POST /auth/signup` | nome, e-mail, senha, `guestCartId?` | 201 `AuthResponse` (usuário, token, `expiresAt`) |
| | `POST /auth/login` | e-mail, senha, `guestCartId?` | 200 `AuthResponse` |
| | `GET /auth/session` | | 200 usuário e `expiresAt` |
| | `POST /auth/logout` | | 204 |
| NFTs | `GET /nfts` | `q`, `tab`, `collection`, `network`, `minPrice`, `maxPrice`, `sort`, `page`, `pageSize` | 200 `NftListResponse` (itens e facetas com contagens) |
| | `GET /nfts/featured` | | 200 `{ hero, spotlight }` |
| | `GET /nfts/:id` | | 200 `Nft` (edições, galeria, `version`) |
| Favoritos | `GET /favorites` | | 200 `{ nftIds }` |
| | `PUT /favorites/:nftId` | | 200 `{ nftIds }` (idempotente) |
| | `DELETE /favorites/:nftId` | | 200 `{ nftIds }` |
| Carrinho | `GET /cart` | | 200 `Cart` |
| | `POST /cart/items` | `nftId`, `editionId`, `quantity` | 200 `Cart` (soma se a linha existe) |
| | `PATCH /cart/items/:itemId` | `quantity` | 200 `Cart` |
| | `DELETE /cart/items/:itemId` | | 200 `Cart` |
| | `PUT /cart/coupon` | `code` | 200 `Cart` |
| | `DELETE /cart/coupon` | | 200 `Cart` |
| Cotação | `POST /quotes` | `network` | 200 `Quote` (linhas, subtotal, desconto, taxa, total, `issues`, `expiresAt`) |
| Pedidos | `POST /orders` | header `Idempotency-Key`; `quoteId`, `walletId`, `network`, `collector` | 201 `Order` novo; 200 `Order` em reenvio com `Idempotent-Replayed: true` |
| | `GET /orders/:id` | | 200 `Order` (também é o recibo) |
| | `GET /orders` | `page`, `pageSize` | 200 lista paginada |
| Perfil | `GET /profile` | | 200 `Profile` |
| | `PATCH /profile` | campos do perfil | 200 `Profile` |
| | `PUT /profile/avatar` | `multipart/form-data`, campo `file` (png, jpeg ou webp, até 2 MB) | 200 `Profile` |
| | `PUT /profile/password` | senha atual e nova | 204 |
| Carteiras | `GET /wallets` | | 200 `{ items }` |
| | `POST /wallets` | `kind`, `network`, `address`, `label?` | 201 `Wallet` |
| | `PATCH /wallets/:id` | campos editáveis | 200 `Wallet` |
| | `POST /wallets/:id/connect` | `network` | 200 `Wallet` conectada |
| | `POST /wallets/:id/disconnect` | | 200 `Wallet` desconectada |

Decisões que vale registrar:

- **Visitante e login:** o carrinho do visitante vive no mock, chaveado por `X-Guest-Id`. Login e cadastro aceitam `guestCartId` e o servidor funde o carrinho (soma quantidades, limitado pela disponibilidade) na mesma resposta, sem passo extra que possa falhar no meio.
- **Cotação como fecho do pedido:** o pedido envia o `quoteId` que o usuário viu. Se preço, disponibilidade, cupom ou taxa mudaram, o servidor responde `quote_stale` com a cotação nova e o checkout exige nova confirmação (§3, §7). Nenhum total é calculado no cliente para fechar pedido.
- **Conexão de carteira no servidor:** conectar, recusar e desconectar são rotas, para o estado sobreviver a refresh e não existir simulação dentro de componente (§6).
- **Pedido:** estados `pending`, `confirmed`, `rejected`; os dois últimos são terminais. O recibo é o próprio `Order`, snapshot imutável de linhas e valores. A mesma chave com o mesmo conteúdo devolve o mesmo pedido; conteúdo diferente gera `idempotency_conflict`. O conteúdo é comparado por `quoteId`, `walletId`, `network` e `collector`.
- **Avatar:** o mock guarda o arquivo como data URL no estado persistido e devolve em `avatarUrl`.

## Eventos Socket.IO

Transporte: `socket.io-client` real, handshake com `auth: { token }`, path padrão `/socket.io`, servido pelo MSW. Cada usuário entra automaticamente na sala `user:<id>`; eventos de pedido e carrinho só vão para ela.

Cliente para servidor (com ack):

| Evento | Payload | Efeito |
| --- | --- | --- |
| `subscribe` | `{ resources: [{ type: 'nft', id }] }` | Passa a receber `nft.updated` desses NFTs |
| `unsubscribe` | idem | Libera a inscrição |

Servidor para cliente, todos com o mesmo envelope:

```
{ eventId, type, resource: { type, id }, version, occurredAt, userId?, data }
```

| Evento | Recurso | `data` | Efeito no cliente |
| --- | --- | --- | --- |
| `nft.updated` | `nft` | preço, preço de referência e, por edição, preço e disponibilidade | Atualiza catálogo, detalhe e carrinho; avisa quando o NFT está no carrinho |
| `order.updated` | `order` | estado, hash da transação, motivo de recusa | Atualiza o pedido; abre confirmação ou recusa |

Regras de consumo:

- `eventId` é estável: reentrega traz o mesmo id e é descartada.
- Aplicar só se `event.version` é maior que a `version` já no cache do recurso. Evento antigo é ignorado; evento mais novo que o REST sobrescreve.
- Evento com `userId` diferente do usuário da sessão atual é descartado (defesa em profundidade; o servidor já isola por sala).
- Em reconexão (`connect` após a primeira), invalidar e refazer por REST os recursos ativos: NFT visível, carrinho, pedido pendente.
- Listeners e `subscribe` ficam ligados ao ciclo de vida do componente ou da sessão; logout desconecta o socket.

## Pendências conhecidas

- Campos finais de `collector` (Pagamento) e de `Profile` dependem da leitura dos frames `11:2862` e `9:1238`.
- Taxas e cupons concretos nascem nas fixtures; o contrato só exige que o servidor devolva os valores calculados.
