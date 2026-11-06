# Kurio: marketplace de NFTs

Solução do desafio frontend (enunciado em `docs/DESAFIO.md`). React, TypeScript, TanStack Router e Query, Axios, Socket.IO, Tailwind, shadcn/ui, MSW, Playwright e Lighthouse. Backend, autenticação, carteiras e pagamentos são simulados com MSW.

> Em construção. Estado e checklist em `docs/ESTADO.md`; decisões em `docs/decisoes/`.

## Setup

```bash
npm install
npm run dev        # http://localhost:5173, com mocks (VITE_ENABLE_MOCKS=true em .env.mocks)
```

Requer Node 20 ou superior. Nenhum serviço externo é necessário.

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Dev com mocks |
| `npm run dev:real` | Dev sem mocks |
| `npm run build` | Gera rotas, verifica tipos e compila o build de demonstração (com mocks) |
| `npm run preview` | Serve o build em `http://localhost:4173` |
| `npm run typecheck` | Verificação de tipos |
| `npm run lint` | ESLint |

## Credenciais fictícias

| Usuário | E-mail | Senha |
| --- | --- | --- |
| Ana Colecionadora | `ana@kurio.test` | `Kurio@123` |
| Bruno Criador | `bruno@kurio.test` | `Kurio@456` |

Também é possível criar uma conta em `/signup`. As senhas ficam só como hash SHA-256 com sal no estado do mock; nunca em claro.

## Cenários de rede e reset do mock

O mock vive no navegador (MSW) e persiste em `localStorage` (`kurio:mock-db`), então sessão, favoritos e carrinhos sobrevivem a refresh.

- **Reset:** abra qualquer rota com `?reset=1` (ex.: `/?reset=1`). Restaura usuários das fixtures e apaga sessões, favoritos e carrinhos.
- **Cenário de rede:** `?scenario=<nome>` na URL (fica gravado até outro ser escolhido; `?scenario=default` volta ao normal).

| Cenário | Efeito | Como reproduzir |
| --- | --- | --- |
| `default` | Latência variável de 150 a 749 ms, derivada da URL (pode inverter a ordem das respostas) | padrão |
| `slow` | 3 s por requisição | skeletons |
| `empty` | Catálogo sem resultados | estado vazio |
| `error-503` | Falha transitória com nova tentativa | `?scenario=error-503`, depois "Tentar novamente" (volte a `default` antes) |
| `error-500` | Erro interno genérico | |
| `offline` | Sem conexão | |
| `timeout` | Requisição nunca responde | |
| `favorites-error` | Favoritar e desfavoritar falham | rollback da atualização otimista |
| `session-expired` | A próxima chamada autenticada responde `session_expired` (uma vez) | login com retorno ao fluxo |
| `wallet-rejected` | A próxima conexão de carteira é recusada (uma vez) | `wallet_rejected` |
| `payment-declined` | O próximo pedido é recusado pela simulação (uma vez) | pedido `rejected`, carrinho preservado |
| `payment-slow` | O próximo pedido leva ~20 s para ser decidido | recuperar pedido pendente após refresh ou queda |
| `order-timeout` | O próximo `POST /orders` cria o pedido mas a resposta demora 15 s (uma vez) | repetir a mesma chave devolve o mesmo pedido |
| `price-changed` | No próximo pedido, o preço do primeiro item muda antes do fechamento (uma vez) | `quote_stale` com cotação nova |
| `sold-out-during-purchase` | No próximo pedido, o primeiro item esgota (uma vez) | `availability_conflict` |

Cupons do carrinho: `KURIO10` (10%) e `WELCOME5` (5%) valem; `EXPIRED20` está expirado; qualquer outro é inválido.

## Tempo real

`socket.io-client` real conectado em `/realtime`, com o WebSocket interceptado pelo MSW (`@mswjs/socket.io-binding`). Limitações do transporte simulado em `docs/decisoes/0006-pedidos-e-tempo-real.md`. No console do navegador (com os mocks ligados) há controles que passam pelo servidor simulado:

```js
__kurioMock.updateNft('nft-001', 'nft-001-open', { priceEth: '1.50' }) // gera nft.updated e muda o REST
__kurioMock.updateNft('nft-001', 'nft-001-10', { available: 0 })       // esgota uma edição
__kurioMock.resendLast()     // reenvia o último evento (duplicata: o cliente ignora)
__kurioMock.emitStale('nft-001')  // evento com versão antiga (o cliente não regride)
__kurioMock.disconnect(true) // derruba e recusa reconexões; __kurioMock.reconnect() volta
__kurioMock.connections()    // conexões ativas, usuário e NFTs assinados
```

Testes Playwright e Lighthouse serão documentados aqui quando existirem.
