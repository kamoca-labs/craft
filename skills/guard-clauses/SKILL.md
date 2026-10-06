---
name: guard-clauses
description: Clean Code, guard clause em vez de condicional aninhada. Use quando há if dentro de if, else depois de return/throw, o caminho principal da função fica indentado no fim, ou validações envolvem o código útil.
argument-hint: "[arquivo ou escopo]"
---

# Guard clause em vez de condicional aninhada

**Regra**: trate os casos de exceção e de saída antecipada **no topo**, com `return` ou `throw` imediato. O caminho feliz fica no fim, sem indentação, lido em linha reta.

## Por quê

- Cada nível de `if` é um contexto que o leitor tem que empilhar na cabeça.
- Com guard clauses, cada pré-condição é uma linha isolada: fácil de ler, testar e remover.
- `else` depois de `return` é ruído: o `return` já encerrou.

## Sinais de violação

- Indentação de três níveis ou mais.
- `if (valid) { ...20 linhas... } else { throw }`, com o erro lá embaixo, longe da condição.
- `else` após `return`, `throw`, `continue` ou `break`.
- Variável `result` acumulada só para ter um `return` único no fim.

## Como aplicar

1. Inverta a condição de cada `if` que envolve o resto da função e saia cedo.
2. Remova `else` depois de saída.
3. Em laços, use `continue` para pular o item inválido em vez de envolver o corpo.
4. Junte guard clauses que formam uma regra só numa função com nome (`if (!canClose(invoice)) ...`).

## Exemplo

```ts
// antes
function approve(request: Request, user: User) {
  if (request) {
    if (request.status === 'pending') {
      if (user.canApprove) {
        request.status = 'approved'
        return request
      } else {
        throw new Forbidden()
      }
    } else {
      throw new InvalidState()
    }
  }
  throw new NotFound()
}

// depois
function approve(request: Request | undefined, user: User) {
  if (!request) throw new NotFound()
  if (request.status !== 'pending') throw new InvalidState()
  if (!user.canApprove) throw new Forbidden()

  return { ...request, status: 'approved' }
}
```

## Limites

- Dois ramos de mesmo peso (não é exceção x caminho feliz) podem ficar como `if/else` ou ternário simples.
- Muitas guard clauses seguidas (mais de cinco) indicam validação que merece uma função ou um schema próprio.

## Pergunta de verificação

O caminho principal da função está no nível zero de indentação, depois de todas as saídas antecipadas?
