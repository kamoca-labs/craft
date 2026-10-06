---
name: functions
description: Clean Code, funções pequenas que fazem uma coisa num nível de abstração só. Use quando uma função é longa, tem seções separadas por linha em branco ou comentário, mistura regra de negócio com detalhe técnico, ou tem nome com "e"/"and".
argument-hint: "[arquivo ou escopo]"
---

# Funções pequenas, uma coisa, um nível

**Regra**: cada função **faz uma coisa**, faz bem, e só ela. Todas as linhas dela estão **no mesmo nível de abstração**. O código se lê de cima para baixo como uma narrativa: a função alta chama as de nível abaixo, logo em seguida.

"Uma coisa" = você não consegue extrair outra função dela com um nome que não seja só uma reformulação da implementação.

## Por quê

- Função pequena tem nome que diz tudo, então o chamador não precisa abrir.
- Mistura de níveis (regra de negócio + parse de string + SQL) força o leitor a trocar de contexto a cada linha.
- Funções pequenas são testáveis e reaproveitáveis de forma natural.

## Sinais de violação

- Mais de ~20 linhas, ou não cabe na tela.
- Blocos separados por linha em branco ou comentário (`// valida`, `// salva`, `// notifica`): cada bloco é uma função.
- Mais de dois níveis de indentação.
- Uma linha fala de "fechar fatura" e a seguinte de `JSON.parse` ou índice de array.
- Nome com "e": `validateAndSave`.

## Como aplicar

1. Nomeie cada bloco com o que ele faz; extraia com esse nome.
2. A função original vira a lista de passos em alto nível.
3. Ordene: chamadora acima, chamadas logo abaixo (regra do jornal: manchete primeiro, detalhe depois).
4. Corpo de laço ou de `if` com mais de duas linhas costuma ser uma função.

## Exemplo

```ts
// antes: três níveis misturados
async function importCustomers(csv: string) {
  const rows = csv.split('\n').slice(1).map((line) => line.split(';'))
  for (const [name, email, document] of rows) {
    if (!email.includes('@')) continue
    const digits = document.replace(/\D/g, '')
    if (digits.length !== 11 && digits.length !== 14) continue
    await customers.upsert({ name: name.trim(), email: email.toLowerCase(), document: digits })
  }
}

// depois: a função alta conta a história
async function importCustomers(csv: string) {
  const candidates = parseCustomerCsv(csv)
  const valid = candidates.filter(isValidCustomer)
  await customers.upsertMany(valid)
}

function parseCustomerCsv(csv: string): Customer[] { /* ... */ }
function isValidCustomer(customer: Customer): boolean { /* ... */ }
```

## Limites

- Não pique em funções de uma linha que só renomeiam a chamada de baixo. Se o nome extraído não diz nada além do código, fica inline.
- Função longa e linear (um `switch` de mapeamento, uma lista de rotas) pode ficar longa: ela já faz uma coisa.

## Pergunta de verificação

Consigo descrever a função em uma frase curta que bate com o nome dela, sem "e" e sem "depois"?
