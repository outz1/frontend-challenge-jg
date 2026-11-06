# 0001: Build tool e estrutura de pastas

Data: 2026-11-05. Status: proposta.

## Decisão

- **Build:** Vite + React + TypeScript (strict). Deploy na Vercel com rewrite de SPA para acesso direto às rotas (§12).
- **Estilo:** Tailwind CSS v4 com tokens em `src/styles/tokens.css` (fonte: `docs/FIGMA.md`); shadcn/ui gerado em `src/components/ui`.
- **Rotas:** TanStack Router file-based (`@tanstack/router-plugin`), search params validados com Zod.
- **Validação de contratos:** Zod como fonte única dos tipos, compartilhado entre cliente e handlers MSW.
- **Decimais ETH:** `big.js` para cálculo e formatação a partir de strings (§3).
- **Fonte:** Roboto Mono via `@fontsource/roboto-mono` (local, sem CDN, §8).

## Estrutura

```
src/
  routes/              # TanStack Router (file-based)
    __root.tsx
    index.tsx          # Início
    nft.$nftId.tsx     # Detalhe
    cart.tsx
    _auth/             # layout com guarda de sessão
      checkout.tsx
      orders.$orderId.tsx   # Confirmação / recibo
      account.profile.tsx
      account.wallets.tsx
    login.tsx
    signup.tsx
  api/
    client.ts          # instância Axios + interceptors (sessão, erros tipados)
    contracts/         # schemas Zod por recurso (nft, cart, quote, order...)
    queries/           # queryOptions e mutations por recurso
  realtime/
    socket.ts          # socket.io-client, conexão ligada à sessão
    handlers.ts        # nft.updated, order.updated -> cache (com versão)
  features/            # componentes por domínio (catalog, nft, cart, checkout, account)
  components/
    ui/                # shadcn/ui adaptado
    layout/            # Header, Footer, TabBar mobile
  lib/                 # eth.ts (big.js), format, utils
  styles/              # tokens.css, globals.css
mocks/
  browser.ts           # setupWorker, ativado por VITE_ENABLE_MOCKS
  db/                  # estado do mock + persistência local + reset
  fixtures/            # NFTs, usuários (2+), cupons
  handlers/            # REST por recurso
  socket/              # @mswjs/socket.io-binding
  scenarios/           # cenários determinísticos (§6)
e2e/                   # Playwright (12 áreas do §9) + visual/
lighthouse/            # config e relatórios (§10)
```

## Motivo

Vite é o caminho documentado pelos três hosts aceitos e tem o menor atrito com MSW no build de demonstração. A separação `api/` x `mocks/` garante o invariante de mocks só na camada de rede (§6).