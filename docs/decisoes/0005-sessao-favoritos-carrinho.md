# 0005: Sessão, favoritos e carrinho

Data: 2026-11-05. Status: aceita.

Requisitos em `docs/DESAFIO.md` §3 (Conta e sessão, Carrinho), §4 e §7. Contratos em `0002`.

## Sessão

- **Token** em `localStorage` (`kurio:token`) e sessão consultada por `GET /auth/session` (query `['session']`). Sem token, nem chama a API.
- **Troca de usuário e logout**: `queryClient.clear()` (login) e `removeQueries()` (logout) descartam todo o cache. Chaves privadas ainda carregam o id do dono (`['favorites', userId]`, `['cart', owner]`), como segunda barreira.
- **Logout local imediato**: o token e o cache saem antes da resposta do servidor; a chamada `POST /auth/logout` segue em segundo plano com o token capturado. Navegar para o Início também é imediato (uma navegação tardia já sequestrou o login em teste).
- **Sessão perdida** (`session_expired` ou `unauthenticated` com token enviado): o interceptor do Axios limpa o token e avisa `onSessionLost` (`src/auth/events.ts`); `main.tsx` limpa o cache e leva a `/login?redirect=<href atual>&reason=expired`. Depois de entrar, volta ao `redirect` (só caminhos internos, `safeRedirect`).
- **Guarda de rotas**: `requireSession` (`src/auth/guard.ts`) para `beforeLoad` das rotas privadas; será usada por checkout, perfil e carteiras.
- **Mock**: senha só como hash SHA-256 com sal; sessão com TTL de 30 min; mesma resposta para e-mail desconhecido e senha errada.

## Favoritos (atualização otimista)

`useFavorite` (`src/api/queries/favorites.ts`): `onMutate` cancela refetch, grava o valor novo e guarda o anterior; `onError` restaura e avisa por toast; `onSettled` reconcilia com a API. Clique durante a mutation é ignorado; clique antes de a sessão resolver também (senão um usuário logado seria tratado como visitante). Visitante é levado ao login e volta à mesma tela.

## Carrinho

- **Servidor decide**: o mock calcula limite (menor entre disponibilidade e teto por pedido) e responde `availability_conflict` com `details`. A UI mostra o limite só como dica.
- **Visitante**: carrinho chaveado por `X-Guest-Id`; login e cadastro enviam `guestCartId` e o servidor funde na mesma resposta (soma limitada pela disponibilidade; cupom do visitante é mantido se o usuário não tem um).
- **Totais**: subtotal, desconto, taxa de rede e total vêm de `POST /quotes`, nunca de conta no cliente. A cotação refaz quando `cart.version` muda; `placeholderData` evita piscar.
- **Quantidade**: muda na tela na hora e o envio é agrupado (350 ms); mutations do carrinho têm `scope` único, então rodam em série e respostas não chegam fora de ordem.
- **Cupons**: `KURIO10`, `WELCOME5` válidos; `EXPIRED20` expirado (`coupon_expired`); outros `coupon_invalid`, ambos como erro de campo.

## Desvios e pendências

- A tela de carrinho foi montada **sem acesso ao frame do Figma** (limite de chamadas do MCP do Figma atingido), com os tokens e componentes existentes. Precisa de passada visual contra `11:1278` e `16:360`. O mesmo vale para Login e Cadastro no desktop (modais `70381:239` e `70383:239`), Cadastro mobile (`16:1228`) e o cadastro em geral: o login mobile (`16:1022`) foi lido e reproduzido.
- Cadastro tem Nome, E-mail e Senha; o conjunto real de campos do frame ainda não foi confirmado.
- "Finalizar compra" está desabilitado até existir o checkout.
