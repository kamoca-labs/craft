---
name: clean-tests
description: Clean Code aplicado a testes e catálogo das camadas de teste. Use ao escrever ou revisar qualquer teste, para escolher a camada (unidade, componente, integração, E2E) e carregar a skill dela, ou quando um teste tem lógica (if, laço, cálculo), testa vários comportamentos de uma vez, tem nome vago, setup gigante, depende de ordem ou de tempo real, ou verifica implementação em vez de comportamento.
argument-hint: "[arquivo ou escopo]"
user-invocable: false
---

# Teste também é código

**Regra**: o teste é a especificação executável. Ele é **legível como uma frase**, testa **um comportamento**, não tem lógica, e falha por um motivo só, com mensagem que diz qual. Cada comportamento fica na **camada mais baixa** que o cobre.

## Camadas

Escolha a camada de cada teste antes de escrever. Depois, carregue a skill da camada com a ferramenta `Skill`.

| Camada | O que cobre | Skill |
|---|---|---|
| Unidade, componente, integração | a regra de negócio e todos os casos de borda dela, pela interface pública | `craft:unit-tests` |
| E2E | só a jornada do usuário: ele consegue concluir o objetivo no sistema real. Entra só com a feature pronta e roda só em container | `craft:e2e-tests` |

- A maioria dos testes fica na unidade e na integração. O E2E tem poucos testes, um por jornada crítica.
- Os testes de aceite do ATDD ficam na unidade e na integração. O E2E vem depois, com a feature pronta.
- Um caso de borda nunca sobe para o E2E.
- Estilo, `hover`, cor e animação não têm teste funcional em nenhuma camada.

## Por quê

- Quando o teste falha, você lê o teste, não o código: ele precisa explicar o que se esperava.
- Teste com lógica pode ter bug próprio e passar errado.
- Teste acoplado à implementação quebra em todo refactor, e aí o refactor para de acontecer.
- Teste na camada errada custa caro: um caso de borda no E2E deixa a suíte lenta e frágil.

## Sinais de violação

- `if`, `for`, cálculo ou chamada da própria função testada para gerar o valor esperado.
- Nome vago: `test('funciona')`, `test('caso 2')`.
- Vários comportamentos num teste: arrange, act, assert, act, assert...
- Setup de 40 linhas com dados que o teste nunca lê.
- Testes que dependem da ordem de execução ou de estado compartilhado.
- `Date.now()`, `Math.random()`, rede real.
- Assert sobre chamada interna (`expect(repo.save).toHaveBeenCalledWith(...)`) quando o resultado observável bastaria.
- Teste na camada errada: caso de borda no E2E, ou regra de negócio que só o E2E cobre.

## Como aplicar

1. **Camada**: escolha pela tabela de [Camadas](#camadas) e carregue a skill dela.
2. **Nome** = comportamento esperado, em frase: `'anexo acima de 10 MB é recusado com 422'`.
3. **Estrutura Arrange / Act / Assert**, cada parte visível, separada por linha em branco.
4. **Valor esperado literal**: `assert.equal(total, 95)`, não `assert.equal(total, 100 * 0.95)`.
5. **Só os dados relevantes à vista**. O resto fica num construtor de teste com padrões (`makeTicket({ status: 'closed' })`).
6. **Um comportamento por teste**. Vários asserts são ok se descrevem o mesmo resultado.
7. **Determinístico**: injete relógio e aleatoriedade (`craft:dependency-inversion`).
8. **Teste o que se vê de fora**: retorno, estado persistido, resposta HTTP, o que o usuário vê. Mock só na fronteira.
9. **DRY com moderação**: repetir um dado no teste para deixá-lo legível é melhor que esconder em helper (`craft:dry`).

## Exemplo

```ts
// antes
test('desconto', () => {
  for (const total of [50, 100, 200]) {
    const expected = total >= 100 ? total * 0.9 : total
    expect(applyDiscount(total)).toBe(expected)
  }
})

// depois
test('compra a partir de 100 recebe 10% de desconto', () => {
  expect(applyDiscount(200)).toBe(180)
})

test('compra abaixo de 100 não recebe desconto', () => {
  expect(applyDiscount(50)).toBe(50)
})
```

Tabelas de casos (`test.each`) são aceitáveis quando cada linha tem entrada e saída **literais** e o nome interpola o caso.

## Limites

- Teste de contrato reaproveitado entre implementações (`craft:liskov-substitution`) pode iterar sobre as implementações: o laço é sobre o alvo, não sobre o cálculo do esperado.
- Teste E2E naturalmente tem vários passos. Ainda assim, ele cobre uma jornada só (`craft:e2e-tests`).

## Pergunta de verificação

Se este teste falhar, o nome e a mensagem já me dizem qual comportamento quebrou, sem abrir o código? E ele está na camada mais baixa que cobre esse comportamento?
