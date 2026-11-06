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

Cupons do carrinho: `KURIO10` (10%) e `WELCOME5` (5%) valem; `EXPIRED20` está expirado; qualquer outro é inválido.

Testes Playwright, Lighthouse e demais cenários (pedido, pagamento, tempo real) serão documentados aqui quando existirem.
