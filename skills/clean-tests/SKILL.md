---
name: clean-tests
description: Clean Code aplicado a testes. Use ao escrever ou revisar testes que têm lógica (if, laço, cálculo), testam vários comportamentos de uma vez, têm nome vago, setup gigante, dependem de ordem ou de tempo real, ou verificam implementação em vez de comportamento.
argument-hint: "[arquivo ou escopo]"
user-invocable: false
---

# Teste também é código

**Regra**: o teste é a especificação executável. Ele é **legível como uma frase**, testa **um comportamento**, não tem lógica, e falha por um motivo só, com mensagem que diz qual.

## Por quê

- Quando o teste falha, você lê o teste, não o código: ele precisa explicar o que se esperava.
- Teste com lógica pode ter bug próprio e passar errado.
- Teste acoplado à implementação quebra em todo refactor, e aí o refactor para de acontecer.

## Sinais de violação

- `if`, `for`, cálculo ou chamada da própria função testada para gerar o valor esperado.
- Nome vago: `test('funciona')`, `test('caso 2')`.
- Vários comportamentos num teste: arrange, act, assert, act, assert...
- Setup de 40 linhas com dados que o teste nunca lê.
- Testes que dependem da ordem de execução ou de estado compartilhado.
- `Date.now()`, `Math.random()`, rede real.
- Assert sobre chamada interna (`expect(repo.save).toHaveBeenCalledWith(...)`) quando o resultado observável bastaria.

## Como aplicar

1. **Nome** = comportamento esperado, em frase: `'anexo acima de 10 MB é recusado com 422'`.
2. **Estrutura Arrange / Act / Assert**, cada parte visível, separada por linha em branco.
3. **Valor esperado literal**: `assert.equal(total, 95)`, não `assert.equal(total, 100 * 0.95)`.
4. **Só os dados relevantes à vista**; o resto num construtor de teste com padrões (`makeTicket({ status: 'closed' })`).
5. **Um comportamento por teste**. Vários asserts são ok se descrevem o mesmo resultado.
6. **Determinístico**: injete relógio e aleatoriedade (`craft:dependency-inversion`).
7. **Teste o que se vê de fora**: retorno, estado persistido, resposta HTTP. Mock só na fronteira.
8. **DRY com moderação**: repetir um dado no teste para deixá-lo legível é melhor que esconder em helper (`craft:dry`).

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
- Teste de ponta a ponta naturalmente tem vários passos; ainda assim, um fluxo por teste.

## Pergunta de verificação

Se este teste falhar, o nome e a mensagem já me dizem qual comportamento quebrou, sem abrir o código?
