# 0003: Catálogo, fixtures e rede simulada

Data: 2026-11-05. Status: aceita.

Contratos em `docs/decisoes/0002-contratos.md`; requisitos em `docs/DESAFIO.md` §3, §4, §6 e §8.

## Decisões

- **Estado na URL:** schema de search params em `src/features/catalog/search.ts`, com `.catch` por campo (valor inválido vira padrão) e `stripSearchParams` na rota (padrões não vão para a URL). Filtro, busca, aba e ordem reiniciam `page` em `withFilterChange`. Busca por digitação usa `replace` com debounce de 350 ms para não empilhar histórico.
- **Navegação tipada:** `validateSearch` é função com `SearchSchemaInput`, senão o router exige todos os campos (inclusive os padrões) em cada `Link`.
- **Query:** `placeholderData: keepPreviousData` mantém a página anterior (opaca) durante a troca; `signal` do Axios cancela requisição obsoleta. Política de cache e retries em `src/api/queryClient.ts`.
- **Preço sem float:** o slider trabalha em centavos inteiros (`ethToCents`, `centsToEth` em `src/lib/eth.ts`, via `big.js`); a URL e a API recebem string decimal.
- **Fixtures:** 36 NFTs determinísticos (`mocks/fixtures/nfts.ts`); os 9 primeiros reproduzem a primeira página do Figma. Contagens das facetas vêm das fixtures, não dos números do Figma (33, 12, 65...), que são ilustrativos.
- **Imagens:** as 4 artes do Figma foram convertidas para WebP 560 px (de PNG 1254 px, ~2 MB cada, ~25 KB agora) com `sharp` (devDependency) por causa do Lighthouse. O catálogo reutiliza as 4 artes, como o próprio Figma.
- **Cenários de rede:** `mocks/network.ts`. Escolha por `?scenario=<nome>` (persiste em `localStorage['kurio:scenario']`): `default` (latência variável 150 a 749 ms, derivada da URL), `slow`, `empty`, `error-500`, `error-503`, `offline`, `timeout`. Falta reset de estado e os cenários de sessão, cupom e pedido (entram com cada recurso).

## Desvios do Figma (levar para `ARCHITECTURE.md`)

- Filtro selecionado: além da cor de destaque, sublinhado, para o estado não depender só de cor (§8).
- Seletor de ordenação: 320 px em vez de 300 px, porque "Listados recentemente" estoura 300 px e colide com a seta (no próprio Figma o texto encosta na seta).
- Header some abaixo de 768 px e a navegação passa para a tab bar, como no frame mobile. O Footer também some no mobile (o frame não tem).
- Favoritos e botão central da tab bar ficam indisponíveis com `aria-disabled`: favoritos dependem de sessão; o scan está fora do escopo (§3).
- Card esgotado ganha etiqueta "ESGOTADO" no estilo da etiqueta "RARO" do mobile (estado não desenhado, §1).
- O 8º card do Figma (`4:289`) vem sem título e preço; na implementação todos os cards têm.
