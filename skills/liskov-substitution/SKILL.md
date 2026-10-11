---
name: liskov-substitution
description: L do SOLID, substituição de Liskov. Use quando há várias implementações de um mesmo contrato (interface, classe base, tipo de função) e alguma delas lança "não suportado", ignora parâmetros, muda o formato de retorno ou obriga quem chama a checar o tipo concreto.
argument-hint: "[arquivo ou escopo]"
user-invocable: false
---

# L: substituição de Liskov

**Regra**: qualquer implementação de um contrato pode ocupar o lugar de outra **sem que quem chama perceba**. Mesma entrada aceita, mesmo formato de saída, mesmos erros possíveis, nenhuma surpresa.

Herdar ou implementar não é sobre "é um" no mundo real (quadrado é um retângulo); é sobre **comportamento** prometido no código.

## Por quê

- Quem chama confia no contrato, não na implementação. Trocar storage local por S3 não muda nenhum chamador.
- Teste do contrato roda contra todas as implementações.
- Sem isso, o polimorfismo vira `instanceof` espalhado.

## Sinais de violação

- Implementação que lança `NotImplemented` / "não suportado" para um método do contrato.
- `if (x instanceof Y)` ou checagem de tipo concreto em quem consome a abstração.
- Uma implementação exige pré-condição a mais (só aceita arquivo até 5 MB) ou entrega menos (retorna `null` onde as outras lançam).
- Sobrescrita que ignora parâmetro ou que muda efeito colateral esperado.

## Como aplicar

1. Escreva o contrato explicitamente: entradas válidas, saída, erros.
2. Para cada implementação, confira as quatro coisas: aceita pelo menos as mesmas entradas, entrega o mesmo formato, lança só os erros previstos, mantém os invariantes.
3. Se uma implementação não cumpre, ela não pertence a esse contrato: separe o contrato (`craft:interface-segregation`) ou use composição.
4. Rode a mesma suíte de contrato contra todas as implementações.

## Exemplo

```ts
interface Storage {
  put(key: string, content: Buffer): Promise<void>
  get(key: string): Promise<Buffer>
}

// viola: quem chama precisa saber que este storage não grava
class ReadOnlyCdnStorage implements Storage {
  async put() { throw new Error('não suportado') }
  async get(key: string) { return fetchFromCdn(key) }
}

// corrige: contratos separados, cada um cumprido por inteiro
interface Reader { get(key: string): Promise<Buffer> }
interface Writer { put(key: string, content: Buffer): Promise<void> }

class CdnReader implements Reader {
  async get(key: string) { return fetchFromCdn(key) }
}
```

Teste de contrato reaproveitado:

```ts
for (const [name, make] of [['local', makeLocalStorage], ['s3', makeS3Storage]] as const) {
  test(`${name} devolve o que gravou`, async () => {
    const storage = make()
    await storage.put('a', Buffer.from('x'))
    assert.deepStrictEqual(await storage.get('a'), Buffer.from('x'))
  })
}
```

## Limites

- Só se aplica onde há **substituição de fato**: mais de uma implementação, ou dublê em teste.
- Diferença de desempenho não viola o contrato, a não ser que o contrato prometa tempo.

## Pergunta de verificação

Se eu trocar a implementação no ponto de injeção, algum chamador precisa mudar ou algum teste de contrato falha?
