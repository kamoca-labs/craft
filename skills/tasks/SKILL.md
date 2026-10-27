---
name: tasks
description: Separa o pedido em atividades com TaskCreate e liga a meta de sessão (tarefa META mais o Stop hook meta-goal). O hook tasks carrega esta skill em toda sessão. O usuário também a chama com /craft:tasks. Use também no passo 1 do craft:atdd, depois do ok do usuário na especificação.
argument-hint: "[o que fazer]"
---

# Tarefas e meta

Toda sessão usa tarefas, e a meta quando há critério. O hook `meta-goal` segura o fim do turno até a meta fechar. Pergunta só informativa não leva tarefa nem meta.

## Tarefas

1. Pedido com mais de uma atividade ou passo: crie uma tarefa por atividade com `TaskCreate`. No ATDD, depois do ok na especificação, crie uma por cenário, mais o refactor e o passing again.
2. Se a `TaskCreate` aparece só pelo nome, carregue o schema com `ToolSearch` (`select:TaskCreate,TaskUpdate`).
3. Mantenha uma tarefa em `in_progress`. Marque `completed` com o resultado do comando.
4. Cenário novo no laço: a especificação mudou. Peça o ok do usuário antes de seguir.
5. Ao fim de cada passo, escreva o comando e o resultado na resposta.

## Meta

Ache o critério da meta sozinho, sem perguntar. Procure nesta ordem:

1. Os cenários da especificação do ATDD: o comando filtrado que os prova.
2. O que o usuário pediu: "o build passa" vira o comando de build.
3. Os scripts do projeto (`package.json`, `composer.json`, `Makefile`, CI): teste filtrado, `lint`, `build`.

Com critério e com a `TaskCreate`, crie a tarefa `META:` primeiro, sempre. Sem critério que um comando prove (texto, decisão, pesquisa), crie só as tarefas e não declare meta. Pergunte ao usuário só se há dois critérios possíveis e a escolha muda o trabalho. O assunto é `META: ` mais o estado final mensurável. A descrição traz:

- `Verificação: ` o comando filtrado exato entre crases e o resultado esperado. Nunca a suíte completa.
- `Restrições: ` nenhum teste pulado, apagado nem editado para passar, mais as da atividade.
- `Limite: N` bloqueios do hook: o número de tarefas mais folga.

Só o usuário recusa a meta, com palavras dele. Nesse caso, escreva `META ENCERRADA: recusada pelo usuário`.

## Fechamento

Ao concluir, atendida ou não, marque a tarefa `META:` como `completed` e termine a resposta com `META ENCERRADA: <atendida|cancelada pelo usuário|limite>. <comando> <resultado>`. O comando de verificação precisa rodar depois da última edição de código.

## Sem a ferramenta

1. Escreva a lista numerada e a linha `META:` na resposta, com as mesmas partes.
2. Pergunte uma vez por sessão, com o `AskUserQuestion`, se pode ligar a ferramenta: adicionar `"env": { "CLAUDE_CODE_ENABLE_TODO_TOOLS": "1" }` ao `~/.claude/settings.json`.
3. Com o ok, copie o arquivo para o scratchpad, adicione só a variável em `env` (crie a chave se faltar) e confirme que o JSON continua válido.
4. Teste com `claude -p` numa pasta temporária: peça que confira se `TaskCreate`, `TaskUpdate`, `TaskList` e `TaskGet` existem, sem criar tarefa.
5. Reporte o resultado e o caminho da cópia. A ferramenta aparece na próxima sessão. Se o usuário disse não ou o teste falhou, siga com a lista.
