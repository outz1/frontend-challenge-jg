# 0007: Campos de Perfil, Carteiras e recibo

Data: 2026-11-06. Status: aceita.

Requisitos em `docs/DESAFIO.md` §3 e §5. Frames: Perfil `9:1238`, Carteiras `9:1670`, sidebar `70420:4536`, recibo `70376:239`. Resolve a pendência de `0002` sobre `collector` e `Profile`.

## Perfil (`Profile`, `PATCH /profile`)

Campos do frame: nome de exibição (`name`), nome de usuário (`username`), e-mail, nome ENS (`ensName`, sem o sufixo `.eth`, que o frame fixa num seletor), apelido da carteira (`walletAlias`), avatar e troca de senha (atual, nova, confirmação).

- Obrigatórios: nome, usuário, e-mail e apelido. Usuário e e-mail são únicos entre contas, e o conflito volta da API por campo.
- A confirmação da senha é só do cliente (não vai ao contrato). Salvar grava o perfil e, se algum campo de senha foi preenchido, troca a senha em seguida; se a troca falhar o perfil já está salvo e a tela diz isso.
- Avatar: `PUT /profile/avatar` (png, jpeg ou webp, até 2 MB) e `DELETE /profile/avatar`. A tela valida tipo e tamanho antes e mostra o erro da API se ele vier.
- Nome, e-mail e avatar atualizam também a sessão em cache, então o Header acompanha.

## Carteiras (`Wallet`, `POST/PATCH /wallets`)

Campos do frame: nome de exibição, apelido da carteira (`label`), rede, nome do perfil, endereço, "ENS ou carteira secundária" (`secondaryAddress`), tipo de carteira (`walletType`, o aplicativo preferido), código de indicação, e-mail e nome ENS.

- Obrigatórios: nome de exibição, apelido, rede, nome do perfil, endereço, tipo e e-mail. O endereço é validado pela rede (0x de 40 hex para Ethereum e Polygon, base58 para Solana).
- **Desvio do Figma:** o frame marca Código de indicação e Nome ENS com asterisco. Ficam opcionais, como já estão no Pagamento (0006): um código de indicação depende de alguém ter convidado o usuário e nem todo colecionador tem um nome ENS. Exigir os dois bloquearia o cadastro sem benefício.
- Uma carteira principal e uma secundária por conta (`wallet_kind_taken`). Endereço repetido na conta é recusado.
- "Igual à carteira principal": `POST /wallets` com `{ kind: "secondary", sameAsPrimary: true }` copia os dados da principal no servidor. É a única forma de repetir o endereço, e vale como cópia única, sem vínculo depois.
- Mudar rede ou endereço derruba a conexão simulada.
- **Desvio do Figma:** o "Adicionar" ao lado de "Carteira principal" só aparece quando não há principal (ele foca o formulário). Com principal cadastrada, o formulário já edita essa carteira e não há o que adicionar.

## Itens da sidebar fora do escopo

Atividade, Lista de interesse, Ofertas, Arquivos baixados e Suporte (§3) existem como no frame, mas só avisam "indisponível nesta demonstração". Não há frame mobile (§3): a sidebar vira duas abas (Dados do perfil, Carteiras) e "Sair", com cabeçalho e botão voltar como no Pagamento mobile.

## Recibo (`Order`)

O pedido guarda `walletProvider` e `tokenId` por linha, porque o frame mostra "Carteira: MetaMask" e "ID do token: #0042". O recibo continua sendo o snapshot do pedido.

## Mock

Esquema do mock em 6: usuários ganham `username`, `ensName` e `walletAlias`; carteiras ganham os campos acima. O estado local antigo é descartado. No cadastro, o `username` inicial vem da parte local do e-mail.
