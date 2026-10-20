---
name: tasks
description: Tarefas pequenas com TaskCreate e meta de sessão (uma tarefa META mais um Stop hook) para o fluxo ATDD. Use no passo 1 do craft:atdd, depois do ok do usuário na especificação e antes do primeiro teste.
argument-hint: "[especificação]"
user-invocable: false
hooks:
  Stop:
    - hooks:
        - type: agent
          timeout: 90
          prompt: |
            Você confere a meta da sessão. A entrada do hook é o JSON abaixo. Leia o arquivo em `transcript_path` com Read ou Grep.
            Declaração da meta: a última chamada TaskCreate cujo `subject` começa com `META:`, ou o último texto do assistente que começa com `META:`.
            Fechamento da meta: o último texto do assistente que começa com `META ENCERRADA:`.
            Decida nesta ordem e pare na primeira regra que vale:
            1. Se `last_assistant_message` pede uma decisão ou um ok do usuário, responda {"ok": true}.
            2. Se o fechamento existe depois da declaração, ou o fechamento diz `recusada pelo usuário`, responda {"ok": true}.
            3. Se o fechamento existe sem nenhuma declaração antes e sem recusa, responda {"ok": false, "reason": "META ENCERRADA: sem META: antes. A meta nunca foi declarada. Crie a tarefa META com TaskCreate (ou escreva a linha META:) e rode a verificação de novo."}.
            4. Se não há declaração nem fechamento, responda {"ok": false, "reason": "A skill craft:tasks carregou e a conversa não tem a meta. Pergunte ao usuário se liga a meta. Se sim, crie a tarefa META com TaskCreate. Se não, escreva META ENCERRADA: recusada pelo usuário."}.
            5. Há declaração e não há fechamento. A declaração diz o estado final, a verificação com o resultado esperado, as restrições e o limite de bloqueios. Conte as ocorrências de `Stop hook feedback` depois da declaração. Se a contagem chegou ao limite, responda {"ok": true}.
            6. Confira se a condição foi atendida. Ela só vale como atendida se o comando de verificação rodou depois da última edição de código, com o resultado esperado, e se nenhuma restrição foi violada. Use o transcript e `last_assistant_message` como prova. Afirmação sem comando e resultado não vale. Não atendida: responda {"ok": false, "reason": "o que falta, em uma frase"}.
            7. Atendida, mas sem fechamento: responda {"ok": false, "reason": "Meta atendida. Feche: marque a tarefa META como completed e escreva META ENCERRADA: atendida, com o comando de verificação e o resultado."}.
            $ARGUMENTS
---

# Tarefas e meta

Depois do ok do usuário na especificação e antes do primeiro teste, faça estas entregas, nesta ordem:

1. A pergunta sobre a [meta](#meta).
2. As [tarefas](#tarefas). Com a meta aceita, a primeira tarefa é a `META:`.
3. Ao concluir, o [fechamento](#fechamento): a resposta final sempre traz a linha `META ENCERRADA:`.

## Meta

O Claude Code não deixa o modelo rodar o `/goal`. A meta é uma tarefa `META:` mais o Stop hook desta skill. O hook lê a conversa e segura o fim do turno até a condição valer.

Pergunte ao usuário, com o `AskUserQuestion`, se liga a meta. Explique: o Claude segue os passos 2 a 7 sozinho, até a condição valer. Se a resposta é não, escreva `META ENCERRADA: recusada pelo usuário` no texto da resposta, pule a tarefa `META:` e siga o laço normal.

A tarefa `META:` tem este formato:

- **Assunto**: `META: ` e o estado final mensurável. Ex.: `META: os 3 cenários da especificação passam`.
- **Descrição**, com quatro partes:
  - **Verificação**: o comando filtrado exato e o resultado esperado (`sai com código 0`, depois da última edição de código). Nunca a suíte completa: o hook `filtered-tests` a nega.
  - **Restrições**: nenhum teste pulado, apagado nem editado para passar.
  - **Limite**: o máximo de bloqueios do hook. Escolha pelo número de tarefas, com folga, e diga ao usuário o valor.
  - **Fechamento**: marcar a tarefa como `completed` e escrever `META ENCERRADA:`.

## Tarefas

1. Crie as tarefas com `TaskCreate`, nesta ordem:
   - a tarefa `META:`, se o usuário aceitou a meta
   - o refactor preparatório, se houver
   - uma tarefa por cenário (o laço dos passos 2 a 5)
   - o refactor do passo 6
   - o passing again do passo 7
   - o E2E, só se a feature tem jornada nova
2. O assunto da tarefa de cenário é o nome do cenário. A descrição leva o Given/When/Then e o comando filtrado que o prova.
3. Mantenha uma tarefa só em `in_progress`. Marque `completed` depois do passing daquele cenário, com o resultado do comando. A tarefa `META:` fica `in_progress` até o fechamento.
4. Se um cenário pede mais de um green pequeno, divida a tarefa.
5. Se surge um cenário novo no laço, a especificação mudou. Crie a tarefa e peça o ok do usuário antes de seguir.
6. Ao fim de cada passo, reporte no texto da resposta o progresso, o comando e o resultado (`Passo 5 (Passing): 2 de 3 cenários, vitest saiu com 0`). O hook só aceita a meta com o comando e o resultado na conversa.

### Sem a ferramenta

Em algumas sessões a `TaskCreate` aparece só pelo nome, como ferramenta adiada. Carregue o schema com `ToolSearch` (`select:TaskCreate,TaskUpdate`) antes de usá-la.

Se a ferramenta não existe nem depois da busca, a sessão não a liga por padrão. Você é a ferramenta do usuário: não mande o usuário configurar nada. Faça isto:

1. Escreva a mesma lista numerada na resposta e atualize a lista ao fim de cada passo. A meta vira uma linha `META:` no texto da resposta, com as mesmas partes da tarefa. Assim o laço não espera pela ferramenta.
2. Pergunte ao usuário, uma vez, com o `AskUserQuestion`, se pode ligar a ferramenta. Diga o que você vai fazer: adicionar `"env": { "CLAUDE_CODE_ENABLE_TODO_TOOLS": "1" }` ao `~/.claude/settings.json` e abrir uma sessão de teste para confirmar. Se a resposta é não, siga com a lista e não pergunte de novo.
3. Com o ok, faça a configuração. Guarde uma cópia do arquivo no scratchpad, leia o arquivo, adicione só a variável dentro da chave `env` (crie a chave se faltar) e preserve todas as outras chaves. Confira que o JSON continua válido.
4. Teste numa sessão nova: rode `claude -p` numa pasta temporária e peça que ela confira se `TaskCreate`, `TaskUpdate`, `TaskList` e `TaskGet` existem, sem criar tarefa. A ferramenta adiada conta como existente.
5. Reporte o resultado do teste e o caminho da cópia, para o usuário desfazer. A sessão atual não muda: a ferramenta aparece na próxima sessão. Se o teste falhar, diga o que viu e siga com a lista.

## Fechamento

Ao concluir, sempre feche a meta, atendida ou não. Esta é a última coisa que a resposta final traz:

1. Marque a tarefa `META:` como `completed` com `TaskUpdate`.
2. Escreva a linha `META ENCERRADA:` com o motivo (`atendida`, `cancelada pelo usuário` ou `limite`), o comando de verificação e o resultado.

Sem o fechamento, o hook bloqueia o fim do turno e pede as duas coisas, mesmo com a condição atendida.

Exemplo da conversa inteira:

```
TaskCreate: META: os 3 cenários da especificação passam
  Verificação: `pnpm vitest run tests/unit/attachment` sai com código 0 depois da última edição de código.
  Restrições: nenhum teste pulado, apagado nem editado para passar.
  Limite: 6 bloqueios.
Passo 3 (Red): `pnpm vitest run ...` falhou com `expected 422 got 201`.
...
Passo 7 (Passing again): `pnpm vitest run ...` saiu com código 0 depois da última edição de código.
TaskUpdate: META completed
META ENCERRADA: atendida. `pnpm vitest run tests/unit/attachment` saiu com código 0.
```

O hook vale até o fim da sessão depois que esta skill carrega. Quando o usuário pede outra feature na mesma sessão, declare e feche uma nova meta.

## Verificação

- O usuário disse se quer a meta.
- A tarefa `META:` (ou a linha `META:`) existe antes do primeiro teste, com verificação, restrições e limite.
- As tarefas existem (ferramenta ou lista), uma por cenário, mais o refactor e o passing again.
- Cada passo reporta o comando e o resultado no texto da resposta.
- A resposta final termina com `META ENCERRADA:` e a tarefa `META:` está `completed`.
