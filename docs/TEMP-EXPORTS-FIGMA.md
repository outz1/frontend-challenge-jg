# TEMPORÁRIO: o que exportar do Figma

Este arquivo existe só porque o limite do MCP do Figma acabou. Apague-o (e a pasta `docs/figma-exports/`) quando as telas estiverem fiéis ao layout. Nada aqui entra no commit: as imagens são ignoradas pelo git.

Arquivo no Figma: https://www.figma.com/design/DWOkjTyFcXkNJxIJkueTlB/Frontend-Challenge--Copy-?node-id=0-1

## Onde colocar

| O quê | Pasta |
| --- | --- |
| Imagens dos frames (PNG) | `docs/figma-exports/` |
| Ícones e logos (SVG) e artes (PNG) | `docs/figma-exports/assets/<tela>/` (ex.: `assets/carrinho/`) |

Depois de salvar, é só me avisar ("exportei"). Eu leio direto da pasta.

## Como exportar (qualquer frame)

1. Clique no frame na lista de camadas (ou cole o node ID na URL com `?node-id=` trocando `:` por `-`).
2. No painel direito, seção **Export**, clique em **+**.
3. Escolha **PNG** e escala **2x**.
4. Clique em **Export <nome do frame>** e salve com o nome indicado abaixo.

Se o frame for muito alto e o PNG 2x ficar enorme, 1x já serve para o layout geral. Para detalhes pequenos (campos, botões), use 2x.

## Lista de frames, por prioridade

Nomes dos arquivos: `<tela>-<desktop|mobile>.png`.

### Prioridade 1: o que mais bloqueia

| Tela | Node ID | Arquivo |
| --- | --- | --- |
| Carrinho, desktop | `11:1278` | `carrinho-desktop.png` |
| Carrinho, mobile | `16:360` | `carrinho-mobile.png` |
| Pagamento, desktop | `11:2862` | `pagamento-desktop.png` |
| Pagamento, mobile | `16:748` | `pagamento-mobile.png` |
| Login, desktop (frame com o modal) | `9:115` | `login-desktop.png` |
| Cadastro, desktop (frame com o modal) | `9:1022` | `cadastro-desktop.png` |
| Cadastro, mobile | `16:1228` | `cadastro-mobile.png` |

### Prioridade 2

| Tela | Node ID | Arquivo |
| --- | --- | --- |
| Confirmação de pedido, desktop (frame) | `11:4385` | `confirmacao-desktop.png` |
| Confirmação, só o modal | `70376:239` | `confirmacao-modal.png` |
| Perfil do colecionador, desktop | `9:1238` | `perfil-desktop.png` |
| Carteiras, desktop | `9:1670` | `carteiras-desktop.png` |

Perfil, Carteiras e Confirmação não têm frame mobile. Eu adapto a partir das outras telas mobile.

### Seções que ajudam (opcional, só se o frame inteiro ficar pequeno demais para ler)

| Seção | Node ID | Arquivo |
| --- | --- | --- |
| Tabela do carrinho | `70369:241` | `secao-tabela-carrinho.png` |
| Resumo da carteira (cupom, taxas, total) | `70370:239` | `secao-resumo-carteira.png` |
| Checkout (pagamento) | `70522:3321` | `secao-checkout.png` |
| Sidebar da conta | `70420:4536` | `secao-sidebar-conta.png` |
| Formulário de perfil | `70386:239` | `secao-form-perfil.png` |
| Formulário de carteiras | `70390:239` | `secao-form-carteiras.png` |
| Resumo de pagamento do carrinho (mobile) | `70397:245` | `secao-resumo-mobile.png` |
| Opções de carteira e rede (mobile) | `70398:244` | `secao-carteira-rede-mobile.png` |
| Modal de login | `70381:239` | `secao-modal-login.png` |
| Modal de cadastro | `70383:239` | `secao-modal-cadastro.png` |

## Estados que não estão nos frames principais

Se existirem no Figma (outra página, variantes de componente), exporte também. Se não existirem, não precisa: eu sigo o padrão visual das outras telas (§1 do desafio).

- Campos com erro de validação e campo em foco (login, cadastro, pagamento, perfil, carteiras).
- Carrinho vazio.
- Cupom aplicado e cupom com erro.
- Pagamento recusado e pedido pendente.
- Carteira conectada, desconectada e recusada.

Nome sugerido: `<tela>-<estado>.png` (ex.: `pagamento-recusado.png`).

## Ícones, logos e imagens (SVG e PNG)

Eu não consigo baixar ativos sem o MCP. Para cada tela da prioridade 1 e 2, exporte as camadas de ícone e imagem que **não** estejam na lista abaixo.

Já tenho (não precisa exportar): logo KURIO, busca, carrinho, selo do carrinho, entrar, setas, estrelas, coração, compartilhar (LinkedIn, mensagem, Twitter), mais e menos do stepper, Google e Facebook, olho de senha, redes sociais do rodapé, ícones da tab bar, filtros e as 4 artes de NFT.

Provavelmente falta, por tela:

- **Carrinho:** ícone de remover/lixeira, ícone de cupom, ícones de carrinho vazio.
- **Pagamento:** logos MetaMask, WalletConnect, Coinbase, ícones de rede (Ethereum, Polygon, Solana), ícones de cartão/carteira/cadeado, selos de segurança.
- **Confirmação:** ícone de sucesso, ícone de copiar hash, ícone de link externo.
- **Perfil:** avatar padrão, ícone de câmera/editar, ícones do menu da sidebar da conta (perfil, carteiras e os outros itens).
- **Carteiras:** ícones de carteira principal e secundária, ícone de copiar endereço.

Como exportar: selecione a camada do ícone, em **Export** escolha **SVG** e salve em `docs/figma-exports/assets/<tela>/` com um nome descritivo (ex.: `assets/pagamento/metamask.svg`). Para logos coloridos, deixe o SVG com as cores originais. Imagens de NFT, avatares e fotos: **PNG** ou **WebP** (eu converto para WebP otimizado).

## O que o texto das imagens não me diz (me conte em uma linha cada)

Responda aqui mesmo no chat, sem precisar editar este arquivo.

1. **Cadastro:** quais campos existem? (nome, e-mail, senha, confirmar senha, aceite de termos?)
2. **Pagamento (campos do colecionador):** quais são, e quais são obrigatórios? (nome, CPF/documento, e-mail, telefone, endereço?)
3. **Perfil:** quais campos são editáveis? Há campos só de leitura?
4. **Carteiras:** quais campos são obrigatórios? (endereço, apelido, rede, "código de indicação" e "nome do perfil" apareceram marcados sem relação óbvia com carteira. Posso ignorar esses dois?)
5. **Sidebar da conta:** os rótulos reais dos itens (as camadas se chamam todas "Profile Details / Wallets / Activity..."). Quais existem de fato no desenho?
6. **Frames sem versão mobile** (Perfil, Carteiras, Confirmação): alguma preferência, ou sigo o padrão das demais telas mobile (cabeçalho com botão voltar, cards de 358 px, botão de 60 px)?

## Depois de exportar

- Me avise com "exportei" e eu leio tudo de `docs/figma-exports/`.
- Quando as telas estiverem fiéis, eu removo este arquivo, a pasta `docs/figma-exports/` e a regra no `.gitignore`, e registro no `ARCHITECTURE.md` qualquer desvio do Figma.
