---
name: dependency-inversion
description: D do SOLID, inversão de dependência. Use quando regra de negócio importa direto banco, HTTP, LLM, storage, fila, relógio ou aleatoriedade, quando o teste precisa de mock de módulo para isolar, ou quando trocar um fornecedor exigiria mexer na regra.
argument-hint: "[arquivo ou escopo]"
---

# D: inversão de dependência

**Regra**: a regra de negócio depende de **abstrações que ela mesma define**; os detalhes (banco, API, LLM, storage, relógio) implementam essas abstrações e são **injetados** de fora. A seta de dependência aponta para dentro, para o domínio.

## Por quê

- A regra é testada com dublês simples, sem `vi.mock` de módulo, sem rede, sem banco.
- Trocar fornecedor (S3 por disco, OpenAI por Claude) não toca na regra.
- Tempo e aleatoriedade injetados tornam o teste determinístico.

## Sinais de violação

- `import { db } from '@/db'`, `fetch(...)`, `new OpenAI()`, `Date.now()`, `Math.random()` dentro da regra de negócio.
- Teste da regra depende de `vi.mock('../db')` ou de container rodando.
- O tipo de retorno do fornecedor (resposta crua do SDK) vaza para dentro do domínio.

## Como aplicar

1. Identifique a fronteira: o que é I/O ou não determinístico.
2. Defina, do lado da regra, o contrato mínimo que ela precisa (`interface Clock { now(): Date }`), com tipos do domínio.
3. Receba o contrato por parâmetro ou construtor.
4. Implemente o adaptador real fora da regra; monte tudo no ponto de entrada (rota, comando, container de DI do framework).
5. No teste, passe um dublê literal.

## Exemplo

```ts
// antes: impossível testar o vencimento sem controlar o relógio global
function isOverdue(invoice: Invoice) {
  return invoice.dueDate < new Date()
}

// depois: o tempo entra de fora
function isOverdue(invoice: Invoice, today: Date) {
  return invoice.dueDate < today
}
```

```ts
// regra define o contrato com tipos do domínio
interface Summarizer {
  summarize(text: string): Promise<string>
}

async function summarizeTicket(ticket: Ticket, summarizer: Summarizer) {
  return summarizer.summarize(ticket.description)
}

// teste
await summarizeTicket(ticket, { summarize: async () => 'resumo' })
```

No Laravel, prefira injeção pelo construtor e bind no service container a `Facade` dentro do domínio.

## Limites

- **YAGNI vence**: não crie interface para código que não é I/O nem varia. Um helper puro pode ser importado direto.
- Uma implementação real + o dublê do teste já justificam o contrato numa fronteira de I/O. Fora de fronteira, espere a segunda implementação.
- Não injete o que o framework já resolve bem no ponto de entrada (controller pode usar o ORM direto se não há regra ali).

## Pergunta de verificação

Consigo testar esta regra passando objetos literais, sem mock de módulo nem serviço externo?
