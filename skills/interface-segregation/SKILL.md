---
name: interface-segregation
description: I do SOLID, segregação de interface. Use quando uma função, classe ou componente recebe um tipo, objeto ou props grande e usa só uma fração dele, ou quando uma interface obriga implementações a cumprir métodos que não fazem sentido para elas.
argument-hint: "[arquivo ou escopo]"
user-invocable: false
---

# I: segregação de interface

**Regra**: ninguém depende do que não usa. Interfaces, tipos de parâmetro e props são **pequenos e focados** no que o consumidor precisa, não no que o produtor tem.

## Por quê

- Mudança em um campo que você não usa não te obriga a recompilar, re-testar ou ajustar mocks.
- Teste fica barato: o dublê tem dois campos, não trinta.
- A assinatura documenta exatamente do que a função depende.
- Implementações não precisam fingir métodos (veja `craft:liskov-substitution`).

## Sinais de violação

- Função recebe `user: User` inteiro e lê só `user.email`.
- Componente recebe o objeto da API inteiro como prop.
- Mock de teste montado com `as unknown as Service` ou cheio de campos irrelevantes.
- Interface com métodos que algumas implementações deixam vazios ou lançam erro.

## Como aplicar

1. Para cada consumidor, liste o que ele realmente lê ou chama.
2. Declare o tipo do parâmetro com só isso (`Pick<User, 'email'>`, um tipo próprio, ou o valor primitivo).
3. Interface grande com consumidores diferentes vira interfaces pequenas por papel; quem precisa de várias combina (`Reader & Writer`).

## Exemplo

```ts
// antes: o teste precisa montar um User completo
function sendWelcome(user: User) {
  return mailer.send(user.email, `Olá, ${user.name}`)
}

// depois: depende só do que lê
function sendWelcome(recipient: Pick<User, 'email' | 'name'>) {
  return mailer.send(recipient.email, `Olá, ${recipient.name}`)
}
```

Em componente:

```vue
<!-- antes: <UserBadge :user="user" /> usando só nome e foto -->
<UserBadge :name="user.name" :avatar-url="user.avatarUrl" />
```

## Limites

- Não crie uma interface por método. Se todos os consumidores usam os mesmos três métodos, é uma interface só.
- Passar o objeto inteiro é aceitável quando a função **é** sobre aquela entidade como um todo (serializar, validar o `User`).

## Pergunta de verificação

O dublê de teste deste consumidor tem algum campo que o código nunca lê?
