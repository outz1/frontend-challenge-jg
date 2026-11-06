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

Credenciais fictícias, seleção e reset de cenários, testes e Lighthouse serão documentados aqui quando existirem.
