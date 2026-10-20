---
name: acceptance-criteria
description: Critério de aceite verificável para os cenários do passo 1 do craft:atdd. Use ao escrever os cenários Given/When/Then, antes de pedir o ok do usuário na especificação.
argument-hint: "[especificação]"
user-invocable: false
---

# Critério de aceite verificável

Um critério que ninguém verifica não fecha o ciclo. Antes de pedir o ok do usuário, confira cada cenário:

- O `Então` diz um valor que dá para observar: um código (`422`), um texto, uma contagem, um estado. Nunca um adjetivo (`rápido`, `correto`, `amigável`).
- O cenário diz qual teste o prova: a camada (`craft:clean-tests`) e o comando filtrado que o roda.
- O `Dado` fixa os dados de entrada. O cenário não depende de ordem nem de relógio.
- Se não dá para dizer como um teste prova o cenário, o critério está vago. Reescreva o cenário ou pergunte ao usuário.

Com o ok do usuário, carregue a skill `craft:tasks`.

## Verificação

- Cada cenário tem um `Então` observável e o teste que o prova.
- Nenhum cenário usa adjetivo no lugar de valor.
