# Kurio: marketplace de NFTs

Solução do desafio frontend (enunciado em `docs/DESAFIO.md`). Descoberta, compra e conta do colecionador, em desktop e mobile, a partir do layout do Figma. Backend, autenticação, carteiras e pagamentos são **simulados com MSW**; nenhum serviço externo é necessário.

Stack: React 19, TypeScript, Vite, TanStack Router e Query, Axios, Socket.IO (`socket.io-client`), Tailwind CSS 4, shadcn/ui (Radix), MSW, Playwright e Lighthouse.

- Arquitetura, contratos, política de sessão, cache e desvios do Figma: [`ARCHITECTURE.md`](ARCHITECTURE.md)
- Estado do projeto e checklist de entrega: [`docs/ESTADO.md`](docs/ESTADO.md)
- Decisões: [`docs/decisoes/`](docs/decisoes/)
- Resultados do Lighthouse: [`lighthouse/RESULTADOS.md`](lighthouse/RESULTADOS.md)
- URL pública: https://frontend-challenge-jg.vercel.app (detalhes em [Deploy](#deploy))

## Setup

Requer Node 20.19 ou superior (testado com Node 24) e npm.

```bash
npm ci
npm run dev          # http://localhost:5173, com mocks
```

A entrega roda de um checkout limpo: lockfile, assets, fontes (`@fontsource`, sem CDN), fixtures, testes e configuração do Lighthouse estão no repositório. O Service Worker do MSW (`public/mockServiceWorker.js`) também.

### Variáveis de ambiente

| Variável | Onde | Efeito |
| --- | --- | --- |
| `VITE_ENABLE_MOCKS` | `.env.mocks` (versionado, lido por `--mode mocks`) | `true` liga o MSW. Sem ela (`npm run dev:real`) o app chama `/api` de verdade |

Não há outra variável. A base da API é `/api` (`src/api/contracts/endpoints.ts`); `dev:real` espera uma API real nesse caminho, que **não** faz parte desta entrega.

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Desenvolvimento com mocks |
| `npm run dev:real` | Desenvolvimento sem mocks |
| `npm run build` | Gera as rotas, verifica tipos e compila o build de demonstração (com mocks) |
| `npm run preview` | Serve o build em `http://localhost:4173` |
| `npm run typecheck` | Gera as rotas e verifica tipos |
| `npm run lint` | ESLint |
| `npm run test` | Testes Playwright (constrói e serve o build sozinho; ver [Testes](#testes-playwright)) |
| `npm run test:update` | Idem, atualizando as baselines visuais |
| `npm run lighthouse` | Auditoria Lighthouse (precisa de `npm run build` antes; ver [Lighthouse](#lighthouse)) |
| `npx playwright show-report` | Abre o último relatório HTML dos testes |

## Credenciais fictícias

| Usuário | E-mail | Senha | Carteiras iniciais |
| --- | --- | --- | --- |
| Ana Colecionadora | `ana@kurio.test` | `Kurio@123` | Principal (Ethereum) e Reserva (Polygon) |
| Bruno Criador | `bruno@kurio.test` | `Kurio@456` | Principal (Solana) |

Também é possível criar uma conta em `/signup`. As senhas ficam só como hash SHA-256 com sal no estado do mock, nunca em claro.

Cupons do carrinho: `KURIO10` (10%) e `WELCOME5` (5%) valem; `EXPIRED20` está expirado; qualquer outro é inválido.

## Cenários de rede e reset do mock

O mock vive no navegador (MSW) e persiste em `localStorage` (`kurio:mock-db`): sessão, favoritos, carrinhos, carteiras e pedidos sobrevivem a refresh.

- **Reset:** abra qualquer rota com `?reset=1` (por exemplo `/?reset=1`). Restaura usuários e catálogo das fixtures e apaga sessões, favoritos, carrinhos, carteiras alteradas e pedidos.
- **Cenário:** `?scenario=<nome>` na URL, ou, sem recarregar a página, no console: `localStorage.setItem('kurio:scenario', '<nome>')`. Fica gravado até outro ser escolhido (`default` volta ao normal). Os cenários marcados "uma vez" voltam sozinhos ao padrão depois de agir.

| Cenário | Efeito |
| --- | --- |
| `default` | Latência variável de 150 a 749 ms, derivada da URL (pode inverter a ordem das respostas) |
| `slow` | 3 s por requisição |
| `empty` | Catálogo sem resultados |
| `error-503` | Falha transitória (`transient_error`) que o cliente repete |
| `error-500` | Erro interno genérico |
| `offline` | Sem conexão |
| `timeout` | A requisição nunca responde |
| `favorites-error` | Favoritar e desfavoritar falham |
| `session-expired` | A próxima chamada autenticada responde `session_expired` (uma vez) |
| `wallet-rejected` | A próxima conexão de carteira é recusada (uma vez) |
| `payment-declined` | O próximo pedido é recusado pela simulação (uma vez) |
| `payment-slow` | O próximo pedido leva cerca de 20 s para ser decidido |
| `order-timeout` | O próximo `POST /orders` cria o pedido, mas a resposta demora 15 s (uma vez) |
| `price-changed` | No próximo pedido, o preço do primeiro item muda antes do fechamento (uma vez) |
| `sold-out-during-purchase` | No próximo pedido, o primeiro item esgota (uma vez) |

### Como reproduzir cada falha

Todos os fluxos de compra partem de: entrar com Ana, abrir `/nft/nft-001`, "COMPRAR", "Conectar e finalizar", preencher "Nome de usuário" e "Nome do perfil", escolher uma carteira (por exemplo MetaMask) e "Confirmar compra". Defina o cenário antes de "Enviar pedido".

| Falha | Passos | Resultado esperado |
| --- | --- | --- |
| Pagamento recusado | `payment-declined` e enviar | "Pagamento recusado", carrinho preservado, "Tentar novamente" refaz o envio |
| Clique repetido | enviar com duplo clique | um único pedido |
| Timeout após criar o pedido | `order-timeout` e enviar | aviso de que o pedido não será duplicado; "Verificar pedido" devolve o **mesmo** pedido |
| Cotação desatualizada | `price-changed` e enviar | "Os valores mudaram", novo total; exige "Confirmar novos valores" |
| Item esgotado | `sold-out-during-purchase` e enviar | aviso de conflito e atalho para o carrinho; nenhum pedido criado |
| Conexão da carteira recusada | `wallet-rejected` e enviar | aviso na revisão; nenhum pedido criado |
| Pedido pendente e refresh | `payment-slow`, enviar e recarregar | o acompanhamento volta pela URL (`?order=`) e termina no recibo |
| Sessão expirada no checkout | `session-expired` e enviar | vai ao login com o aviso e volta ao `/checkout` depois de entrar |
| Favorito com falha | `favorites-error` e favoritar | o coração volta ao estado anterior e um aviso aparece |
| Falha de carga e nova tentativa | `error-500`, `offline` ou `error-503` e abrir `/` | estado de erro com "Tentar novamente" |

## Tempo real

`socket.io-client` real, conectado em `/realtime`; o WebSocket é interceptado pelo MSW (`@mswjs/socket.io-binding`). Eventos: `nft.updated` e `order.updated`, com id estável, recurso e versão. Limitações do transporte simulado em [`ARCHITECTURE.md`](ARCHITECTURE.md#transporte-do-socketio-no-mock-e-limitações).

Com os mocks ligados, o console do navegador tem controles que passam pelo servidor simulado (nunca pela UI):

```js
__kurioMock.updateNft('nft-001', 'nft-001-open', { priceEth: '1.50' }) // gera nft.updated e muda o REST
__kurioMock.updateNft('nft-001', 'nft-001-10', { available: 0 })       // esgota uma edição
__kurioMock.resendLast()          // reenvia o último evento (duplicata: o cliente ignora)
__kurioMock.emitStale('nft-001')  // evento com versão antiga (o cliente não regride)
__kurioMock.disconnect(true)      // derruba e recusa reconexões; __kurioMock.reconnect() volta
__kurioMock.connections()         // conexões ativas, usuário e NFTs assinados
```

## Testes Playwright

`npm run test` constrói o app (`npm run build`), serve com `vite preview` na porta 4173 e roda no Chromium em dois projetos: `chromium-desktop` (1440 px) e `chromium-mobile` (390 px). Cada teste abre um contexto novo, com mock zerado.

Os arquivos de `e2e/` cobrem as 12 áreas do §9:

1. catálogo (busca, filtros, ordenação e página na URL, histórico)
2. detalhe, acesso direto e 404
3. cadastro, login, expiração de sessão, logout e troca de usuário
4. favoritos com falha e recuperação
5. carrinho (quantidade, remoção, cupom, persistência, login)
6. compra completa até o recibo
7. falhas de pagamento, clique repetido e recuperação do mesmo pedido
8. perfil, avatar, senha e carteiras
9. mudança de preço ou estoque via Socket.IO durante o checkout
10. eventos duplicados ou antigos, desconexão e pedido pendente
11. teclado, foco de diálogos e validação
12. skeletons, falha e nova tentativa

Mais `13-visual.spec.ts`: regressão visual de início, detalhe, carrinho e pagamento, com baselines em `e2e/13-visual.spec.ts-snapshots/`. Os testes de tempo real passam pelo cliente Socket.IO e pelos controles do mock; os de REST, pelos handlers MSW.

Falhas guardam relatório HTML (`playwright-report/`), trace e captura de tela (`test-results/`). Para abrir um trace: `npx playwright show-trace <caminho>/trace.zip`. As baselines são regressão da implementação, não uma medição de igualdade com o Figma; veja `docs/decisoes/0008-fidelidade-visual-e-desvios.md`.

Para rodar um arquivo ou projeto: `npm run test -- e2e/06-compra.spec.ts --project=chromium-desktop`.

## Lighthouse

```bash
npm run build
npm run lighthouse        # 4 alvos x 3 execuções, mediana por categoria
```

Audita início e detalhe (`/nft/nft-001`), mobile e desktop, sobre o `vite preview` do build com mocks. Gera HTML e JSON em `lighthouse/reports/` e `lighthouse-summary.json` com ambiente, versões e carga do sistema. `LH_RUNS` e `LH_TARGETS` restringem a rodada. Resultado, metas e causas em [`lighthouse/RESULTADOS.md`](lighthouse/RESULTADOS.md).

## Deploy

`vercel.json` reescreve qualquer rota para `index.html`, então acesso direto e refresh funcionam. O build de produção é o mesmo `npm run build` (com mocks e tempo real simulados no navegador, sem backend).

Na Vercel: importar o repositório, preset **Vite**, comando de build `npm run build`, diretório de saída `dist`, sem variáveis de ambiente. Pela linha de comando: `npx vercel --prod` dentro do repositório (foi como a versão atual foi publicada).

Para rodar a suíte Playwright contra a versão publicada, sem construir nada local: `E2E_BASE_URL=https://frontend-challenge-jg.vercel.app npm run test -- --grep-invert "Regressão visual"` (as baselines visuais são do build local).

- **URL pública:** https://frontend-challenge-jg.vercel.app
- **Repositório:** https://github.com/outz1/frontend-challenge-jg

## Estrutura

```
src/
  routes/        rotas file-based (TanStack Router)
  api/           cliente Axios, contratos Zod, queries e mutations
  realtime/      cliente Socket.IO, ledger de eventos e reconciliação
  features/      catálogo, NFT, carrinho, checkout, conta e auth
  components/    layout e shadcn/ui adaptado
  styles/        tokens do Figma e CSS global
mocks/           MSW: handlers REST, fixtures, banco local, cenários e socket
e2e/             Playwright
lighthouse/      script, relatórios e resultados
docs/            enunciado, estado, mapa do Figma e decisões
```
