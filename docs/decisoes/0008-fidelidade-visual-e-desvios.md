# 0008: Verificação visual contra o Figma e desvios assumidos

Data: 2026-11-06. Status: aceita.

Requisitos em `docs/DESAFIO.md` §8 e §11 (fidelidade visual, 20 pontos). Frames em `docs/FIGMA.md`.

## Como foi verificado

Cada tela foi capturada no app (1440 px e 414 px, mocks, reduced motion) e comparada com o screenshot do frame do Figma em 1x: diferença de imagem por faixas de 100 px e leitura lado a lado. A comparação cobre Início, Detalhe, Carrinho, Pagamento, Confirmação, Login, Cadastro, Perfil e Carteiras. As diferenças restantes são de conteúdo (arte e dados do catálogo) ou os desvios abaixo. Não é um teste automatizado: as baselines do Playwright detectam regressão, não igualdade com o Figma.

## Corrigido nesta rodada

- **Carrinho** reescrito: tabela NFTs, Preço, Edições e Total com "ID do token", cupom dentro do resumo, "Conectar e finalizar" e "Continuar explorando"; no mobile, cartões de 100 px e folha de resumo fixa embaixo. O desktop ganhou o carrossel "Colecionadores também viram", agora um componente compartilhado com "Mais desta coleção" (pontos de paginação só quando há mais de uma página de cinco).
- **Login e Cadastro** desktop: modal com abas "Entrar | Criar conta", campos de 40 px, faixa inferior de 10 px e botão fechar. Cadastro mobile: título "Criar perfil de colecionador", "Confirmar senha" e botão "Criar perfil".
- **Início**: seções de promoções e "Diário da Cunhagem" (só desktop), 96 px entre hero e catálogo, e no mobile 40 px no topo e 16 px entre blocos. Selo "RARO" nos cartões mobile.
- **Detalhe**: coluna de informações com os 448 px da galeria, stepper em cápsula de 33 por 49,5 px, imagem principal de 404 px.
- **Geral**: rodapé com as larguras de coluna do Figma, linhas finas (0,3 px no Figma) como 1 px a 30% de opacidade, itens do cabeçalho alinhados, toast no topo no mobile.

## Desvios assumidos

- **Contagens da sidebar do catálogo** vêm das facetas reais da API simulada. O Figma mostra números fixos (por exemplo "Arte digital (33)").
- **Catálogo de demonstração** tem mais de nove itens, com nomes e preços do Figma nos primeiros. A terceira linha do Figma repete uma arte sem nome.
- **Fundo do modal de login** desktop é o hero, e não a página inteira: o catálogo depende dos parâmetros da rota `/`.
- **Carrinho desktop** mostra uma terceira linha "Edição ABERTA" em cada item, porque o preço depende da edição. Carrinho mobile ganhou o botão de remover no canto do cartão (o Figma tem um ícone sobreposto ao "+").
- **Carrinho mobile** não tem tab bar: a folha de resumo ocupa o lugar, como no frame.
- **"Conectar e finalizar"** leva ao Pagamento, onde a carteira é conectada ao enviar o pedido. A conexão não acontece no carrinho.
- **Pagamento mobile** mantém o formulário "Perfil do colecionador" abaixo das carteiras, porque o contrato exige esses dados e o frame mobile não os desenha.
- **Cadastro**: o campo "Nome de usuário" do Figma é o `name` do contrato; o servidor simulado deriva o `username` dele (normalizado), editável depois no Perfil.
- **"RARO"** aparece só no mobile, como no frame (no desktop do Início não há selo).
- Ações fora do escopo (Google, Facebook, "Ler mais", compartilhar, "Etherscan") continuam indisponíveis, com aviso.
