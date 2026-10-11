---
name: open-closed
description: O do SOLID, aberto/fechado. Use quando adicionar um caso novo (tipo, formato, canal, regra) obriga a editar um if/switch que já existe, ou quando a mesma cadeia de condicionais por tipo se repete em vários lugares.
argument-hint: "[arquivo ou escopo]"
user-invocable: false
---

# O: aberto para extensão, fechado para modificação

**Regra**: comportamento novo entra **acrescentando** uma definição (um item num mapa, uma classe nova, um handler registrado), não editando ramos que já funcionam e já estão testados.

## Por quê

- Código testado e em produção não é tocado para acomodar um caso novo, então não quebra.
- O caso novo vive em um lugar só, com teste próprio.
- O `switch` por tipo costuma se repetir em vários pontos; esquecer um deles é bug clássico.

## Sinais de violação

- `switch (type)` ou cadeia `if/else if` por tipo, formato ou canal.
- A mesma cadeia de condicionais em mais de um arquivo.
- O PR de "suporte a PIX" edita cinco arquivos que já existiam.

## Como aplicar

1. Identifique o eixo de variação (tipo de pagamento, formato de exportação).
2. Defina o contrato mínimo que cada variação cumpre.
3. Troque o `switch` por uma tabela (mapa de tipo para implementação) ou polimorfismo.
4. Caso novo = entrada nova na tabela.

## Exemplo

```ts
// antes: cada formato novo edita esta função
function exportReport(report: Report, format: string) {
  if (format === 'csv') return toCsv(report)
  if (format === 'pdf') return toPdf(report)
  throw new Error(`formato desconhecido: ${format}`)
}

// depois: formato novo é uma linha no mapa
const EXPORTERS: Record<Format, (report: Report) => Buffer> = {
  csv: toCsv,
  pdf: toPdf,
}

function exportReport(report: Report, format: Format) {
  return EXPORTERS[format](report)
}
```

## Limites

- **YAGNI vence**: com um caso só, não há eixo de variação. Um `if` com dois ramos que nunca crescem é mais simples que um mapa.
- Crie a extensão quando chegar o **segundo ou terceiro** caso real, não antes.
- Mapa de funções resolve a maioria; hierarquia de classes só quando cada variação carrega estado ou vários métodos.

## Pergunta de verificação

Para adicionar o próximo caso, quantos arquivos existentes eu edito? O ideal é zero (ou só o registro).
