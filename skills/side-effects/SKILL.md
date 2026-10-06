---
name: side-effects
description: Clean Code, nenhum efeito colateral escondido. Use quando uma função grava, envia, altera estado global, muta o argumento recebido ou faz I/O que o nome não anuncia, como um get que cria, um validate que salva ou um format que loga.
argument-hint: "[arquivo ou escopo]"
---

# Nenhum efeito colateral escondido

**Regra**: o nome da função **anuncia tudo** o que ela muda no mundo. Função que soa como consulta (`get`, `is`, `has`, `calculate`, `format`, `validate`) não altera nada. Função que altera diz o que altera (`save`, `send`, `create`, `markAsPaid`). Separe consulta de comando.

## Por quê

- O chamador confia no nome. `isValid(order)` que reserva estoque vira bug de estoque fantasma.
- Consulta pura pode ser chamada de novo, reordenada, cacheada e testada sem setup.
- Efeito escondido cria acoplamento temporal: "tem que chamar `check` antes de `save`, senão quebra".

## Sinais de violação

- `getX` que cria `X` quando não encontra.
- `validate`/`check`/`is` que grava, envia ou altera o objeto.
- Função que muta o argumento recebido (`items.sort()` no array do chamador, `Object.assign(input, ...)`).
- Escrita em variável de módulo ou global.
- Consulta que dispara log de auditoria, evento ou e-mail.

## Como aplicar

1. Para cada função, liste o que ela altera fora do próprio escopo.
2. Se o nome não anuncia, ou **renomeie** para anunciar, ou **separe** em consulta pura + comando.
3. Retorne valor novo em vez de mutar o recebido (`toSorted`, spread, `structuredClone`).
4. Empurre os efeitos para a borda: o núcleo calcula, a camada de fora grava e envia.

## Exemplo

```ts
// antes: o "get" cria, e quem chama não sabe
async function getCart(userId: number) {
  return (await carts.findByUser(userId)) ?? (await carts.create({ userId }))
}

// depois: o nome diz
async function findOrCreateCart(userId: number) {
  return (await carts.findByUser(userId)) ?? (await carts.create({ userId }))
}
```

```ts
// antes: muta o array do chamador
function topScores(scores: number[]) {
  return scores.sort((a, b) => b - a).slice(0, 3)
}

// depois
function topScores(scores: number[]) {
  return scores.toSorted((a, b) => b - a).slice(0, 3)
}
```

## Limites

- Log de diagnóstico e métrica não contam como efeito de negócio; não precisam estar no nome.
- Cache interno transparente (memoização) é aceitável se o resultado observável é o mesmo.

## Pergunta de verificação

Se eu chamar esta função duas vezes seguidas, ou não chamar, algo no sistema fica diferente sem que o nome dela avise?
