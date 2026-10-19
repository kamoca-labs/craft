---
name: performance
description: Performance no refactor, guiada por dado e por comparação. Use no passo 6 do ATDD ou num refactor quando o código roda num caminho quente ou sobre muitos dados, com laço dentro de laço, busca linear repetida, query dentro de laço (N+1), I/O ou chamada externa repetida, chamadas independentes em série, ou filtro em memória do que o banco filtra.
argument-hint: "[arquivo ou escopo]"
user-invocable: false
---

# Performance com dado e comparação

**Regra**: no refactor, depois da legibilidade, procure o ganho de performance que os **dados reais** justificam. Meça a forma atual, escreva **pelo menos duas** formas justificadas e fique com a que ganha **com número**. Sem medição, a forma mais legível vence.

## Por quê

- O código legível pode ainda ser lento no volume real. O refactor é o momento seguro para trocar a forma: a suíte verde prova que o comportamento não muda.
- Uma otimização sem medição costuma errar o alvo. Ela troca a legibilidade por um ganho que ninguém sente.
- A comparação entre formas evita a primeira ideia. A segunda forma às vezes ganha de longe, às vezes empata e mostra que a otimização não vale.

## Entenda os dados antes

- **Tamanho**: quantos itens, linhas ou chamadas existem hoje, e quanto crescem.
- **Frequência**: quantas vezes o trecho roda por request, por tela ou por job.
- **Formato**: a distribuição dos dados (muitos repetidos, poucos grandes, chave única).
- **Fonte**: uma query de contagem no banco de dev, o log, o seed com volume de produção ou o profiler.

Se a coleção tem 10 itens e o trecho roda uma vez por request, pare aqui: a forma mais legível ganha.

## Sinais

- Laço dentro de laço sobre coleções que crescem (`find` ou `filter` dentro de `map`).
- Query, request ou leitura de arquivo dentro de um laço (N+1).
- Chamada externa repetida com o mesmo argumento.
- Chamadas independentes em série (`await` uma depois da outra).
- Tudo carregado para a memória para filtrar, ordenar ou contar o que o banco faz.
- Regex, serialização ou objeto caro criado de novo em cada volta do laço.
- Query frequente sem índice (`EXPLAIN` mostra varredura completa).

## Como aplicar

1. **Dados**: levante o tamanho e a frequência reais, pela lista acima.
2. **Linha de base**: meça a forma atual com a entrada no volume real. Use a mediana de 3 execuções. Use a ferramenta da stack: `vitest bench`, `pytest-benchmark`, `go test -bench`, `EXPLAIN ANALYZE`, o tempo da resposta HTTP.
3. **Alternativas**: escreva pelo menos duas formas, cada uma com a hipótese do ganho. Ex.: um `Map` por id em vez da busca linear, um `join` em vez da query no laço, uma busca em lote, chamadas em paralelo.
4. **Compare**: a mesma entrada, a mesma medição, os mesmos testes verdes.
5. **Escolha**: fique com a forma que ganha acima do ruído da medição (em geral, 20% ou mais). Se nenhuma ganha, fique com a mais legível e apague as outras.
6. **Registre**: a tabela da comparação vai no body do commit `perf`, num commit próprio, separado do comportamento.

```text
perf(report): index sales by customer before building the report

| Forma                        | Mediana (10k vendas) |
|------------------------------|----------------------|
| find dentro de map (atual)   | 840 ms               |
| Map por customerId           | 12 ms                |
| GROUP BY no banco            | 18 ms                |
```

## Exemplo

```ts
// antes: O(clientes x vendas)
const report = customers.map((customer) => ({
  customer,
  total: sales.filter((sale) => sale.customerId === customer.id).reduce(sumAmount, 0),
}))

// depois: um passe sobre as vendas, medido a 70x mais rápido com 10k vendas
const totalByCustomer = groupTotals(sales, (sale) => sale.customerId)
const report = customers.map((customer) => ({ customer, total: totalByCustomer.get(customer.id) ?? 0 }))
```

## Limites

- Nunca otimize sem um número antes e depois. "Parece mais rápido" não conta.
- Nunca troque a legibilidade por um ganho dentro do ruído da medição.
- Meça no mesmo ambiente em que o código roda. Se o projeto roda em container, meça no container.
- Uma mudança de arquitetura (cache, fila, réplica de leitura) não é refactor. Ela é uma decisão: proponha ao usuário com a medição e registre no repo.

## Pergunta de verificação

Toda otimização no escopo tem um número antes e depois, medido com o volume real, e venceu pelo menos uma outra forma?
