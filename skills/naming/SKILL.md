---
name: naming
description: Clean Code, nomes que revelam intenção. Use quando variáveis, funções, classes, arquivos ou pastas têm nome abreviado, genérico (data, info, handle, manager, utils), enganoso, ou que só se entende lendo o código ou um comentário.
argument-hint: "[arquivo ou escopo]"
user-invocable: false
---

# Nomes que revelam a intenção

**Regra**: o nome responde **por que existe, o que faz e como se usa**, sem precisar ler a implementação. Se o nome precisa de comentário, o nome está errado. Vale para variáveis, funções, tipos, arquivos e pastas.

## Por quê

- Nome é a documentação que sempre é lida e nunca fica desatualizada sozinha.
- Nome bom deixa o erro visível: `const total = items.length` salta aos olhos.
- Estrutura de pastas com nomes claros dispensa mapa do projeto.

## Sinais de violação

- Abreviação: `usr`, `qtd`, `tmp`, `cb`, `e` (fora de um `catch` de duas linhas).
- Genérico: `data`, `info`, `item`, `obj`, `result`, `handle`, `process`, `Manager`, `Helper`, `Utils`.
- Palavra de enchimento: `theUser`, `userObject`, `userData` quando `user` basta.
- Enganoso: `getUser` que cria quando não acha; `isValid` que também salva; `list` que é um `Set`.
- Número no nome: `user2`, `handleClick2`.
- Nomes diferentes para o mesmo conceito (`fetch`/`get`/`retrieve`) ou o mesmo nome para conceitos diferentes.

## Como aplicar

- **Booleano**: pergunta de sim ou não (`isOverdue`, `hasAttachment`, `canEdit`).
- **Função**: verbo + objeto, dizendo o efeito (`sendInvoice`, `calculateDiscount`). Se o verbo honesto é "e", divida (`craft:functions`).
- **Valor**: substantivo do domínio, com unidade quando houver (`timeoutMs`, `maxSizeMb`).
- **Coleção**: plural (`tickets`); mapa diz a chave (`ticketsById`).
- **Constante mágica** vira nome (`MAX_LOGIN_ATTEMPTS = 5`).
- **Vocabulário**: o do negócio e do projeto. Um termo por conceito, no código todo.
- Tamanho proporcional ao escopo: `i` num laço de três linhas, nome completo em algo exportado.

## Exemplo

```ts
// antes
function chk(d: Ticket[]) {
  return d.filter((x) => x.dt < Date.now() - 864e5 * 3 && x.st === 1)
}

// depois
const STALE_AFTER_DAYS = 3

function staleOpenTickets(tickets: Ticket[], now: Date) {
  const cutoff = subDays(now, STALE_AFTER_DAYS)
  return tickets.filter((ticket) => ticket.status === TicketStatus.Open && ticket.updatedAt < cutoff)
}
```

## Limites

- Convenções consolidadas valem: `i`/`j` em laços curtos, `id`, `url`, `req`/`res` onde o framework usa.
- Renomear API pública quebra quem consome: faça com deprecação, não no meio de um refactor.

## Pergunta de verificação

Lendo só as assinaturas e nomes (sem corpo), dá para contar o que o módulo faz?
