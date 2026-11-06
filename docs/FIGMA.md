# Figma: mapa de frames e tokens

Arquivo de trabalho (cópia editável): https://www.figma.com/design/DWOkjTyFcXkNJxIJkueTlB/Frontend-Challenge--Copy-?node-id=0-1

- `fileKey`: `DWOkjTyFcXkNJxIJkueTlB`
- Página: `0:1` (Marketplace de NFTs GreenMint). Marca exibida nas telas: **Kurio**.
- Para implementar uma tela, chamar `get_design_context` com o `nodeId` da tabela abaixo (um frame ou seção por vez, nunca a página inteira).

## Frames

| Tela | Desktop (1440) | Mobile (414) |
| --- | --- | --- |
| Início | `2:2` | `14:5226` |
| Detalhes do NFT | `10:244` | `15:5536` |
| Carrinho de NFTs | `11:1278` | `16:360` |
| Pagamento | `11:2862` | `16:748` |
| Confirmação de pedido | `11:4385` (modal `70376:239`) | sem frame (§3) |
| Login | `9:115` (modal `70381:239`) | `16:1022` |
| Cadastro | `9:1022` (modal `70383:239`) | `16:1228` |
| Perfil do colecionador | `9:1238` | sem frame (§3) |
| Carteiras | `9:1670` | sem frame (§3) |

### Seções reutilizáveis (desktop)

| Componente | nodeId | Observação |
| --- | --- | --- |
| Header | `70522:3240` | instância, usada em todas as telas |
| Footer | `70492:696` | instância, 1200x610 |
| Hero (Início) | `70347:239` | |
| Sidebar de filtros | `70485:382` | instância 310x785 |
| Banner NFT em destaque | `70410:3791` | |
| Toolbar (abas + ordenação) | `70351:239` | abas: Todos, Novos lançamentos, Em alta |
| Grid de produtos | `70342:2828` | 3 colunas, card 258x356 |
| Paginação | `70342:2825` | |
| Galeria do detalhe | `70363:239` | 4 thumbs 100x100 + principal 444 |
| Seletor de edição | `70342:2696` | 1/1, 1/10, 1/50, ABERTA |
| Stepper de quantidade | `11:1238` | |
| Tabela do carrinho | `70369:241` | |
| Resumo da carteira (cupom, taxas, total) | `70370:239` | |
| Checkout (pagamento) | `70522:3321` | instância "Checkout Page" |
| Sidebar da conta | `70420:4536` | |
| Formulário de perfil | `70386:239` | |
| Formulário de carteiras | `70390:239` | |

### Seções mobile

| Componente | nodeId |
| --- | --- |
| Barra de busca + filtro | `70395:239` |
| Tab bar inferior | `70395:245` |
| Buy bar do detalhe | `70396:245` |
| Resumo de pagamento do carrinho | `70397:245` |
| Opções de carteira e rede | `70398:244` |
| Bloco de login social | `70522:3186

## Tokens

Fonte única: **Roboto Mono** (400, 500, 700). Implementação em `src/styles/tokens.css`.

### Cores

| Token | Hex | Uso observado |
| --- | --- | --- |
| `ink` | `#140D0A` | fundo da página |
| `surface-card` | `#241612` | cards, modais |
| `surface-dark` | `#38220F` | superfícies secundárias |
| `border` | `#3F2319` | divisores |
| `border-soft` | `#55321F` | bordas de inputs |
| `primary` | `#D28A4C` | botões, aba ativa |
| `secondary` | `#B39463` | |
| `text-primary` | `#F7F3EC` | texto principal |
| `foreground` | `#F5F1EB` | |
| `text-secondary` | `#CFB28C` | descrições, labels |
| `text-accent` | `#E89B55` | destaques, preço |
| `background-elevated` | `#FBFBFB` | fundo claro pontual |

### Tipografia (tamanho / peso / line-height)

| Estilo | Spec |
| --- | --- |
| Display | 43 / 700 / 70px |
| Heading | 24 / 700 / auto |
| Body Large | 16 a 18 / 400, 500, 700 / 16, 20 ou 24px |
| Body | 14 a 15 / 400, 500, 700 / 16, 20, 22, 24, 30 ou 40px |
| Caption | 12 / 700 / 14px; 13 / 400 / 22px |
| Tiny | 10 / 500; 9 / 700 |

Line-height `100` no Figma significa 100% (auto). Alguns estilos Body 14 têm letter-spacing `10` (provável 10%, conferir no `get_design_context`).

## Inconsistências do layout (registrar em `ARCHITECTURE.md`)

- **Carrinho mobile** (`16:360`): itens somam 8.14 ETH, mas o subtotal exibe 8.92 ETH. Valores na implementação vêm da cotação da API (§3), não do Figma.
- **Sidebar da conta**: todas as camadas de texto se chamam "Profile Details / Wallets / Activity / ..."; os rótulos reais precisam ser lidos no `get_design_context`. Activity, Watchlist (exceto favoritos), Offers, Downloads e Support estão fora do escopo (§3) e não podem aparentar sucesso.
- **Login/Cadastro**: botões sociais e "Esqueceu a senha?" não fazem parte dos fluxos exigidos; tratar como ação indisponível com feedback honesto (§3).
- **Carteiras**: formulário tem campos marcados como obrigatórios sem relação óbvia com carteira (Código de indicação, Nome do perfil). Decidido em `docs/decisoes/0007-campos-perfil-e-carteiras.md`.
- Login, Cadastro e Confirmação são **modais** sobre a página no desktop e **telas cheias** no mobile. As rotas precisam suportar acesso direto nos dois casos.
- Perfil, Carteiras e Confirmação não têm frame mobile: adaptar a partir do padrão das demais telas mobile (header com botão voltar, cards 358px, botão 60px).