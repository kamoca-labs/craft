---
name: unit-tests
description: Teste de unidade, de componente e de integração cobre a regra de negócio e os casos de borda pela interface pública. Use ao escrever ou revisar teste que verifica método privado, mocka tudo, testa getter, constante, framework ou biblioteca, verifica classe CSS ou snapshot grande, ou repete o mesmo caso com valores parecidos.
argument-hint: "[arquivo ou escopo]"
user-invocable: false
---

# Unidade, componente e integração cobrem a regra

**Regra**: estes testes cobrem a **regra de negócio** e os **casos de borda** dela, pela **interface pública**. Use o nível mais baixo que pega o bug. Teste o que a regra decide, não como o código está escrito.

## Por quê

- São os testes rápidos da suíte. Por isso, os casos de borda ficam aqui, não no E2E (`craft:e2e-tests`).
- Um teste preso à implementação quebra em todo refactor. Então o refactor para de acontecer.
- Um teste de algo que não pode quebrar (getter, constante, a biblioteca) custa manutenção e não pega bug.

## Qual nível

| Nível | O que cobre | Fronteira |
|---|---|---|
| Unidade | função ou classe com regra: cálculo, validação, decisão, conversão | sem I/O. Relógio e aleatoriedade entram injetados |
| Componente (front) | o que o componente mostra e o que ele faz quando o usuário interage | renderiza e interage como o usuário (Testing Library), sem rede |
| Integração | o módulo com a fronteira real dele: rota HTTP do próprio app, banco de teste, fila | mock só de serviço de terceiro |

Escolha o nível mais baixo que pega o bug. Suba de nível só quando o bug mora na ligação entre as partes.

## Sinais de violação

- Teste de método privado, ou `as any` e reflexão para chegar nele.
- Mock de tudo: o teste verifica que um mock chamou outro mock.
- `expect(repo.save).toHaveBeenCalledWith(...)` quando o estado salvo ou o retorno bastaria.
- Teste de getter, setter, constante, tipo que o compilador já checa, ou do framework e da biblioteca.
- No componente: assert em classe CSS, estilo, `hover`, ou snapshot do markup inteiro.
- Dez casos com valores parecidos que passam pelo mesmo caminho da regra.
- Teste de unidade que sobe banco ou faz request real.

## Como aplicar

1. **Interface pública**: chame o que o código de produção chama. Se um método privado precisa de teste próprio, ele quer ser uma unidade separada (`craft:single-responsibility`).
2. **Assert no resultado**: retorno, estado persistido, resposta HTTP, o que aparece na tela do componente.
3. **Mock só na fronteira que você não controla**: rede externa, relógio, aleatoriedade (`craft:dependency-inversion`). Na integração, use o banco de teste real.
4. **Casos de borda pela regra, não pela lista de valores**:
   - um caso por classe de equivalência (válido, inválido, vazio)
   - um caso em cada limite que a regra tem (`10 MB` passa, `10 MB + 1 byte` falha)
   - nenhum caso para um limite que a regra não tem
5. **Componente como o usuário**: encontre o elemento pelo `getByTestId` (`craft:test-ids`). Verifique o que aparece e o evento que sai, não a aparência.
6. **Não teste o que não pode quebrar**: getter, constante, a biblioteca, o tipo.

## Exemplo

```ts
// antes: teste preso à implementação
test('upload', async () => {
  const repo = { save: vi.fn() }
  const service = new UploadService(repo)
  service['validateSize'](11 * MB)
  expect(repo.save).not.toHaveBeenCalled()
})

// depois: regra pela interface pública, um caso em cada limite
test('anexo de 10 MB é aceito', async () => {
  const result = await uploadAttachment(makeFile({ size: 10 * MB }))

  expect(result.ok).toBe(true)
})

test('anexo acima de 10 MB é recusado', async () => {
  const result = await uploadAttachment(makeFile({ size: 10 * MB + 1 }))

  expect(result.error).toBe('attachment.tooLarge')
})
```

## Limites

- Teste de contrato entre implementações (`craft:liskov-substitution`) pode chamar cada implementação concreta.
- Um mock de colaborador interno vale quando o colaborador é lento ou não determinístico e não há fronteira para injetar. Registre o motivo no nome do dublê (`slowPdfRendererStub`).
- Um snapshot pequeno e estável (um JSON de saída, uma mensagem de erro) é aceitável. Snapshot de markup inteiro não é.

## Pergunta de verificação

Se eu reescrever o código por dentro sem mudar a regra, algum destes testes quebra? Se quebra, ele testa a implementação.
