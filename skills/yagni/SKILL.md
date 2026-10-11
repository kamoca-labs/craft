---
name: yagni
description: YAGNI (you aren't gonna need it). Use quando o código tem parâmetro, opção, flag, config, camada, abstração, hook de extensão ou caso tratado que nenhum uso atual exercita, ou foi escrito "para quando precisar".
argument-hint: "[arquivo ou escopo]"
user-invocable: false
---

# YAGNI: você não vai precisar

**Regra**: escreva só o que um **teste ou uso atual** exige. Nenhuma opção, camada, generalização ou caso tratado "para o futuro". O futuro escreve o próprio código, com a informação que você não tem hoje.

## Por quê

- Código especulativo tem custo hoje (ler, testar, manter) e benefício talvez nunca.
- A previsão quase sempre erra a forma: quando a necessidade real chega, a abstração antecipada atrapalha.
- Código não usado não é testado de verdade, então apodrece.

## Sinais de violação

- Parâmetro sempre passado com o mesmo valor, ou nunca passado.
- Config ou variável de ambiente para algo que nunca muda.
- Interface com uma implementação só e nenhum dublê de teste.
- Classe base com uma subclasse.
- `// TODO: suportar X no futuro` com estrutura já montada para X.
- Ramo de código que nenhum teste cobre e nenhum fluxo real alcança.

## Como aplicar

1. Para cada opção, parâmetro ou camada, procure o uso atual (grep). Sem uso, remova.
2. Parâmetro com valor fixo vira constante interna.
3. Abstração com uma implementação vira a implementação direta.
4. Código morto sai. O git lembra dele se um dia precisar.

## Exemplo

```ts
// antes: opções que ninguém usa
function formatPrice(value: number, options: { currency?: string, locale?: string, decimals?: number } = {}) {
  const { currency = 'BRL', locale = 'pt-BR', decimals = 2 } = options
  return value.toLocaleString(locale, { style: 'currency', currency, minimumFractionDigits: decimals })
}

// depois: o sistema só fala real
function formatPrice(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
```

## Limites

- YAGNI não vale para: validação de entrada em fronteira, tratamento de erro que evita perda de dado, segurança, acessibilidade. Isso é necessidade atual, mesmo que nenhum teste peça.
- Fronteira de I/O com dublê de teste já é "uso atual" de uma abstração (veja `craft:dependency-inversion`).
- Decisão cara de reverter (schema de banco, contrato público de API) merece pensar no futuro próximo; código interno, não.

## Pergunta de verificação

Se eu apagar isto, algum teste falha ou algum fluxo real quebra? Se não, apague.
