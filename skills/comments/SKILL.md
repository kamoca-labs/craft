---
name: comments
description: Clean Code, sem comentário explicativo no código. Use quando há comentário dizendo o que o código faz, separando seções, código comentado, comentário desatualizado, ou TODO sem dono; o nome deve dizer o quê e o porquê vai no commit ou na documentação.
argument-hint: "[arquivo ou escopo]"
user-invocable: false
---

# Sem comentário explicativo

**Regra**: o código diz **o quê** pelos nomes e pela estrutura. O **porquê** de uma decisão vai na mensagem de commit, na descrição do PR/MR ou na documentação. Comentário que explica o que o código faz é um nome ou uma função que faltou.

## Por quê

- Comentário não é executado nem testado: fica desatualizado em silêncio e passa a mentir.
- Comentário explicativo é sinal de código que não se explica. Conserte o código.
- O `git blame` leva ao commit, que tem o contexto completo da decisão.

## Sinais de violação

- `// incrementa o contador` acima de `count++`.
- Comentário que separa seções dentro de uma função (`// valida`, `// salva`): são funções (`craft:functions`).
- Comentário explicando uma variável: o nome da variável está fraco (`craft:naming`).
- Código comentado: o git guarda, apague.
- `// TODO` sem chamado, sem dono, esquecido há meses.
- Comentário que contradiz o código.

## Como aplicar

1. Para cada comentário, pergunte: um nome melhor ou uma função extraída diria isso? Se sim, faça e apague o comentário.
2. Condição complexa comentada vira função ou constante com nome (`const isEligibleForRefund = ...`).
3. Código comentado: apague.
4. O porquê de uma decisão não óbvia: mova para o body do commit.

## Exemplo

```ts
// antes
// verifica se o usuário pode ver o chamado (dono ou do setor, e não arquivado)
if ((ticket.ownerId === user.id || user.sectorIds.includes(ticket.sectorId)) && !ticket.archivedAt) {

// depois
if (canView(user, ticket)) {

function canView(user: User, ticket: Ticket) {
  const isInvolved = ticket.ownerId === user.id || user.sectorIds.includes(ticket.sectorId)
  return isInvolved && !ticket.archivedAt
}
```

## Comentários que ficam

- Aviso de algo não óbvio e perigoso que o código não consegue expressar (`// a API do fornecedor devolve 200 com corpo de erro`), quando não há como encapsular.
- Docblock de API pública consumida por terceiros, ou exigido pela ferramenta (tipos em PHPDoc, diretivas de lint, licença).
- Referência a uma especificação externa (RFC, chamado) em regra que parece arbitrária.

## Pergunta de verificação

Se eu apagar este comentário, um leitor atento perde alguma informação que o código não dá? Se não perde, apague.
