---
name: dry
description: DRY (don't repeat yourself). Use quando a mesma regra de negócio, constante, texto, validação ou estilo aparece escrita em mais de um lugar, ou quando uma mudança de regra exige lembrar de editar vários arquivos.
argument-hint: "[arquivo ou escopo]"
---

# DRY: cada conhecimento tem uma fonte só

**Regra**: cada **conhecimento** (uma regra de negócio, um limite, um texto, um estilo, um formato) está escrito em **um lugar só**. DRY é sobre conhecimento, não sobre linhas parecidas.

## Por quê

- Mudar a regra vira editar um lugar, não caçar cópias.
- Cópias divergem com o tempo e viram bug ("o limite é 10 MB no front e 5 MB no back").

## Sinais de violação

- O mesmo número mágico em dois arquivos (`10 * 1024 * 1024`).
- A mesma validação no front e no back escrita à mão duas vezes.
- O mesmo texto de mensagem copiado em vários componentes.
- Mudança de regra que exigiu um PR tocando N arquivos com a mesma edição.

## Como aplicar

1. Confirme que é o **mesmo conhecimento**: se a regra de um mudar, a do outro tem que mudar junto? Só então extraia.
2. Dê nome ao conhecimento (`MAX_ATTACHMENT_SIZE`, `isBusinessDay`).
3. Coloque no lugar mais baixo que todos os usos alcançam.
4. Para conhecimento que cruza fronteiras (front e back), prefira gerar de uma fonte (schema compartilhado, endpoint de config) a copiar.

## Exemplo

```ts
// antes: o limite em dois lugares, um dia diverge
if (file.size > 10 * 1024 * 1024) throw new TooLarge()
// ...em outro arquivo
const hint = 'Máximo de 10 MB'

// depois
export const MAX_ATTACHMENT_MB = 10
if (file.size > MAX_ATTACHMENT_MB * 1024 * 1024) throw new TooLarge()
const hint = `Máximo de ${MAX_ATTACHMENT_MB} MB`
```

## Duplicação acidental: não extraia

```ts
const userAge = (user: User) => yearsSince(user.birthDate)
const contractAge = (contract: Contract) => yearsSince(contract.signedAt)
```

Parecem iguais hoje, mas são regras diferentes: se o contrato passar a contar a partir da vigência, só uma muda. Juntá-las criaria um acoplamento falso.

## Limites

- **Regra de três**: na segunda repetição, anote; na terceira, extraia. Duplicação é mais barata que a abstração errada.
- Teste pode repetir dados de forma explícita: legibilidade do teste vale mais que DRY (veja `craft:clean-tests`).
- Extração que precisa de flag para tratar "o caso de um e o caso do outro" é sinal de que não era o mesmo conhecimento.

## Pergunta de verificação

Se esta regra mudar amanhã, em quantos lugares eu edito? Deve ser um.
