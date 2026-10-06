---
name: single-responsibility
description: S do SOLID, responsabilidade única. Use quando um módulo, classe, componente ou função muda por mais de um motivo, mistura regra de negócio com I/O ou apresentação, ou cresce acumulando assuntos diferentes.
argument-hint: "[arquivo ou escopo]"
---

# S: responsabilidade única

**Regra**: cada módulo tem **um só motivo para mudar**. "Motivo" é uma pessoa ou área que pede mudança: o financeiro pede outra regra de cálculo, o design pede outro layout, a infra troca o banco. Se dois desses mexem no mesmo arquivo, ele tem duas responsabilidades.

Não é "faz uma coisa só" (isso é de função, veja `craft:functions`). É sobre **quem** força a mudança.

## Por quê

- Mudança de um assunto não quebra outro que mora no mesmo arquivo.
- O teste de cada parte fica pequeno e sem setup alheio.
- Dois devs mexendo em assuntos diferentes não conflitam no mesmo arquivo.

## Sinais de violação

- O nome precisa de "e" ou é genérico: `UserManager`, `Helper`, `Utils`, `processAndSave`.
- O mesmo arquivo importa banco, HTTP e formatação de tela.
- Para testar a regra de cálculo, você precisa montar um request ou mockar o banco.
- O histórico do git mostra commits de assuntos sem relação no mesmo arquivo.

## Como aplicar

1. Liste os motivos de mudança do módulo (uma linha cada).
2. Agrupe o código por motivo.
3. Extraia cada grupo para um módulo com nome do motivo; o original vira coordenador ou some.
4. Rode os testes do módulo depois de cada extração.

## Exemplo

```ts
// antes: cálculo, persistência e e-mail no mesmo lugar
async function closeInvoice(id: number) {
  const invoice = await db.invoice.find(id)
  invoice.total = invoice.items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 0.95
  await db.invoice.save(invoice)
  await mailer.send(invoice.customerEmail, `Total: ${invoice.total}`)
}

// depois: a regra de desconto muda sozinha, sem tocar em banco nem e-mail
function invoiceTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 0.95
}

async function closeInvoice(id: number) {
  const invoice = await invoices.find(id)
  invoice.total = invoiceTotal(invoice.items)
  await invoices.save(invoice)
  await notifyInvoiceClosed(invoice)
}
```

## Limites

- Se as partes **sempre** mudam juntas, são uma responsabilidade só. Separar só espalha a leitura.
- Não crie uma classe por linha. O alvo é coesão, não tamanho mínimo.

## Pergunta de verificação

Descreva o módulo em uma frase, sem "e". Se não der, ainda há mais de uma responsabilidade.
