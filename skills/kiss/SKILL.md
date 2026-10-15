---
name: kiss
description: KISS (keep it simple). Use quando uma solução parece engenhosa demais para o problema, usa padrão, biblioteca ou camada onde uma construção simples resolve, ou exige explicação para ser entendida.
argument-hint: "[arquivo ou escopo]"
user-invocable: false
---

# KISS: o mais simples que passa nos testes

**Regra**: entre duas soluções que passam nos mesmos testes, vence a que tem **menos conceitos** para o leitor segurar na cabeça. Simples não é curto: é óbvio.

## Por quê

- Código é lido muito mais vezes do que escrito; cada conceito extra cobra em toda leitura.
- Bug se esconde em complexidade. O código óbvio tem bug óbvio.
- Quem dá manutenção às 3 da manhã não é você descansado.

## Sinais de violação

- Padrão de projeto (factory, strategy, builder) para um caso só.
- Truque de linguagem: `reduce` montando objeto que um `for` deixaria claro, operador ternário aninhado, metaprogramação.
- Biblioteca nova para o que a plataforma já faz (`lodash.get` em vez de `?.`, date picker em vez de `<input type="date">`).
- Você precisa de um comentário ou de um diagrama para explicar o fluxo.
- Estado guardado que poderia ser calculado.

## Como aplicar

1. Pergunte: qual é a forma mais direta de cumprir **estes** testes?
2. Reutilize antes de escrever. Prefira, nesta ordem: código que o projeto já tem, recurso da linguagem, recurso da plataforma/framework, dependência já instalada, código próprio.
3. Troque o engenhoso pelo explícito, mesmo que fique uma ou duas linhas maior.
4. Elimine estado derivado: calcule na hora.

## Exemplo

```ts
// antes: engenhoso
const byStatus = tickets.reduce<Record<string, Ticket[]>>(
  (acc, t) => ({ ...acc, [t.status]: [...(acc[t.status] ?? []), t] }), {})

// depois: a plataforma já faz
const byStatus = Object.groupBy(tickets, (ticket) => ticket.status)
```

```ts
// antes
const label = isAdmin ? (isOwner ? 'dono' : 'admin') : isOwner ? 'dono' : 'membro'

// depois
function roleLabel({ isAdmin, isOwner }: Member) {
  if (isOwner) return 'dono'
  if (isAdmin) return 'admin'
  return 'membro'
}
```

## Limites

- Simples não é ingênuo: não remova validação, tratamento de erro ou segurança em nome de KISS.
- Entre duas formas igualmente simples, fique com a que é correta nos casos de borda.

## Pergunta de verificação

Um dev que nunca viu este código entende o que ele faz em uma leitura, sem rodar?
