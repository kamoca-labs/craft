---
name: arguments
description: Clean Code, poucos argumentos e sem flag booleana. Use quando uma função tem mais de três parâmetros, parâmetros do mesmo tipo em sequência fáceis de trocar, um booleano que muda o comportamento, ou argumento de saída que a função modifica.
argument-hint: "[arquivo ou escopo]"
user-invocable: false
---

# Poucos argumentos, sem flag booleana

**Regra**: o ideal é zero a dois argumentos; três exige justificativa; mais que isso vira **objeto de opções nomeadas**. Nunca passe um booleano para escolher entre dois comportamentos: são duas funções.

## Por quê

- Cada argumento é algo que o leitor precisa entender e que o teste precisa combinar.
- `createUser('Ana', 'ana@x', true, false, 3)` não se lê na chamada; a ordem errada compila.
- Flag booleana anuncia que a função faz duas coisas (`craft:functions`).
- Argumento de saída (a função altera o objeto recebido) surpreende o chamador (`craft:side-effects`).

## Sinais de violação

- Quatro ou mais parâmetros posicionais.
- Dois ou mais do mesmo tipo em sequência (`(from: Date, to: Date)` invertível).
- `true`/`false`/`null` literal na chamada sem nome.
- `if (flag)` logo no início dividindo a função em dois caminhos.
- Função `void` que preenche o objeto que recebeu.

## Como aplicar

- Flag booleana: divida em duas funções com nomes próprios (`render(doc, true)` vira `renderPreview(doc)` e `renderFinal(doc)`).
- Muitos argumentos relacionados: agrupe num tipo do domínio (`period: { start, end }`, `address`).
- Muitas opções independentes: objeto de opções desestruturado, com padrões.
- Argumento de saída: retorne o valor novo em vez de alterar o recebido.

## Exemplo

```ts
// antes
sendNotification(user, 'Fatura vencida', body, true, false)

function sendNotification(user: User, title: string, body: string, urgent: boolean, email: boolean) { /* ... */ }

// depois
sendNotification({ to: user, title: 'Fatura vencida', body, priority: 'urgent', channel: 'push' })

function sendNotification({ to, title, body, priority = 'normal', channel = 'push' }: Notification) { /* ... */ }
```

## Limites

- Objeto de opções não é desculpa para uma função que faz tudo: muitas opções independentes ainda podem indicar várias responsabilidades.
- Funções matemáticas com ordem natural (`clamp(value, min, max)`, `point(x, y)`) ficam posicionais.

## Pergunta de verificação

Lendo só a linha da chamada, sem abrir a função, eu sei o que cada valor significa?
