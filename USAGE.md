# Uso do plugin `craft`

## Sumário

- [Projeto novo](#projeto-novo)
- [Feature nova com ATDD](#feature-nova-com-atdd)
- [Tarefas e meta](#tarefas-e-meta)
- [Correção de bug com ATDD](#correção-de-bug-com-atdd)
- [Mudança só visual com o modo estilo](#mudança-só-visual-com-o-modo-estilo)
- [Refactor automático depois do verde](#refactor-automático-depois-do-verde)
- [Refactor sob demanda](#refactor-sob-demanda)
- [Combinar com o plugin git](#combinar-com-o-plugin-git)
- [Código em inglês, texto do usuário traduzido](#código-em-inglês-texto-do-usuário-traduzido)
- [Test id em todo elemento interativo](#test-id-em-todo-elemento-interativo)
- [Escrita no padrão ASD-STE100](#escrita-no-padrão-asd-ste100)
- [Correção vira hook](#correção-vira-hook)
- [Memória do projeto](#memória-do-projeto)
- [Quando o hook erra](#quando-o-hook-erra)

## Projeto novo

```
/craft:setup
```

O Claude detecta a stack, mostra o plano (dependências, configs, limites) e **espera o seu ok**. Depois instala o linter com os limites do craft, cria os scripts `test` e `lint` e escreve no CLAUDE.md só a linha que manda seguir o `/craft:atdd`, a que manda registrar decisões do projeto no repo (nunca na memória local do Claude) e os comandos de teste e lint, sem listar as demais skills nem os limites, que já chegam por conta própria. Violações em código que já existe só são contadas, não corrigidas. Dali em diante, o `/craft:craft` roda esse lint antes da triagem.

## Feature nova com ATDD

```
/craft:atdd recusar anexo acima de 10 MB no protocolo
```

1. O Claude escreve os cenários e **espera o seu ok**. Ele percorre a lista de bordas do mundo real (texto longo, emoji, timeout, 403, duplo envio e outras). Ele inclui só as que a feature tem:

   ```gherkin
   Cenário: anexo acima do limite é recusado
     Dado um protocolo aberto
     Quando o usuário envia um anexo de 11 MB
     Então a resposta é 422
     E a mensagem informa o limite de 10 MB
   ```

2. Escreve o teste de **um** cenário e roda: `Passo 3 (Red): 1 falhando, expected 422 got 201`.
3. Escreve o mínimo de código: `Passo 5 (Passing): 1 passando`. Se a especificação tem outro cenário, ele volta ao passo 2 com o próximo.
4. Com todos os cenários verdes, o hook injeta a triagem. O Claude carrega só o que tem sinal e refatora: `Passo 6 (Refactor): craft:dry, limite unificado em MAX_ATTACHMENT_SIZE. Sem sinal nos demais`. Quando a performance tem sinal, ele mede a forma atual, compara pelo menos duas formas e põe a tabela no commit `perf`.
5. Roda os testes dos domínios tocados: `Passo 7 (Passing again): 34 passando em tests/Feature/Protocol e tests/Unit/Attachment`.

## Tarefas e meta

No passo 1, o `/craft:atdd` carrega a skill `craft:acceptance-criteria`: cada `Então` diz um valor observável, e cada cenário diz o teste que o prova. Com o seu ok na especificação, ele segue a `craft:tasks`, que o hook já injetou na sessão. O Claude cria uma tarefa por cenário (`TaskCreate`), mais o refactor e o passing again. Você acompanha a lista com `Ctrl+T`.

Com a ferramenta `TaskCreate` ligada, o Claude acha o critério sozinho (os cenários, o seu pedido ou os scripts do projeto) e liga a meta sem perguntar. Sem critério que um comando prove, ele cria só as tarefas. Você também pode chamar `/craft:tasks <o que fazer>`. A primeira tarefa da lista é a `META:`:

```
TaskCreate: META: os 3 cenários da especificação passam
  Verificação: `pnpm vitest run tests/unit/attachment` sai com código 0 depois da última edição de código.
  Restrições: nenhum teste pulado, apagado nem editado para passar.
  Limite: 6 bloqueios.
```

Ao concluir, a resposta final sempre traz o fechamento, atendida ou não: a tarefa `META:` vira `completed`, e a linha `META ENCERRADA:` cita o comando e o resultado.

- O Claude Code não deixa o modelo rodar o `/goal`. Por isso a meta é a tarefa `META:` mais o Stop hook `meta-goal`. Você não digita nada.
- O hook `meta-goal` é um script, sem agente, então não gasta token. Ele lê o transcript e segura o fim do turno até o comando de verificação rodar com o resultado esperado. Ele não roda comando. Por isso o Claude cita o comando e o resultado ao fim de cada passo.
- O hook também exige o fechamento: com a condição atendida e sem a linha `META ENCERRADA:`, ele bloqueia uma vez e pede o fechamento.
- O hook libera o fim do turno quando o Claude pede um ok seu, quando a meta chega ao limite de bloqueios e depois do fechamento. Se você recusa a meta com palavras suas, o Claude escreve `META ENCERRADA: recusada pelo usuário`. Se você manda parar, ele fecha a meta com o motivo e diz que ela não foi atendida.
- Sem a ferramenta `TaskCreate`, a meta vira uma linha `META:` no texto da resposta, com as mesmas partes.
- O hook não tem o painel, os check-ins nem a restauração do `/goal` nativo. Ele vale em toda sessão e só age depois que a meta é declarada.
- Em algumas sessões a `TaskCreate` vem como ferramenta adiada, e o Claude carrega o schema com `ToolSearch`. Se a ferramenta não existe nem assim, ele escreve a lista na resposta e pergunta se pode ligar a ferramenta. Com o seu ok, ele guarda uma cópia do `~/.claude/settings.json`, adiciona `"env": { "CLAUDE_CODE_ENABLE_TODO_TOOLS": "1" }` e abre uma sessão de teste para confirmar. A ferramenta aparece na próxima sessão. Você não edita nada à mão.

### Várias atividades no mesmo pedido

Fora do ATDD, o Claude também segue a `craft:tasks` quando o seu pedido tem mais de uma atividade ("corrige o login, atualiza o README e sobe o serviço"). Ele separa o pedido em tarefas, mostra a lista e liga a meta. A verificação da meta é um comando que prova o estado final de todas as atividades.

## Correção de bug com ATDD

```
/craft:atdd setor sem dono quebra a listagem
```

O passo 1 vira o cenário que reproduz o bug. O passo 3 prova que o teste pega o bug **antes** da correção.

## Mudança só visual com o modo estilo

```
/craft:style card do protocolo com mais respiro e o modal abrindo suave
```

1. O Claude carrega o `/impeccable`. Se a skill não está instalada, ele pede a instalação e espera.
2. Ele muda a tela. Você olha e pede o ajuste seguinte. Não há especificação nem teste vermelho.
3. Você diz que a tela está ok. Ele roda uma vez os testes filtrados do componente e do E2E tocados, corrige uma vez se algo quebrou e para.

O hook `atdd-first` libera o `Card.vue`. Se o Claude tenta editar `src/services/protocol.ts`, o hook nega e aponta o `/craft:atdd`.

### Feature mista: tela com back-end

```
/craft:style tela de anexos com o limite de 10 MB
```

O limite é regra. O Claude pergunta a ordem com o `AskUserQuestion`:

| Opção | O que acontece |
|---|---|
| Back-end primeiro (recomendado) | o `/craft:atdd` cobre o contrato e a regra do limite. Depois, o modo estilo itera a tela com o dado real |
| Tela primeiro | o modo estilo itera a tela com dado fixo. Depois, o `/craft:atdd` faz o back-end e troca o mock pelo dado real |
| Por fatia | cada cenário passa pelo `/craft:atdd`, e o visual dele passa pelo modo estilo antes do cenário seguinte |

Nas três opções, a regra entra só com teste. O hook nega o serviço sem o `/craft:atdd`.

## Refactor automático depois do verde

Não precisa de comando. Sempre que o Claude roda testes e a saída vem sem falha, o hook `refactor-on-green` injeta a triagem do `craft` como contexto:

| Comando rodado | Saída | Injeta? |
|---|---|---|
| `pnpm vitest run` | `Tests  21 passed (21)` | sim |
| `php artisan test` | `Tests:  48 passed` | sim |
| `pnpm vitest run \| tail` | `Tests  1 failed \| 20 passed` | não (falha escondida pelo pipe) |
| `node --test ...` | `# fail 1` | não |
| `grep -rn describe tests/` | qualquer | não (não roda teste) |

## Refactor sob demanda

```
/craft:craft app/Actions/UploadAttachment.php
/craft:craft o que mudou nesta branch
```

O Claude procura primeiro o que dá para apagar (regra raiz), faz a triagem de todos os princípios, carrega só as skills com sinal, aplica uma de cada vez sem mudar comportamento e, no fim, roda os testes dos domínios tocados. Ele faz uma rodada de triagem, um lote de correções e no máximo uma rodada de confirmação. Depois, ele para. O relatório diz o que mudou por princípio e quais não tiveram sinal.

Se a mudança altera UI (componente, CSS, template), o relatório sugere `/impeccable audit` ou `/impeccable harden` sobre os arquivos tocados. O Claude não roda o comando. Sem a skill `impeccable` na sessão, ele sugere a instalação pelo site oficial, https://impeccable.style.

Para um princípio só, chame a skill dele:

```
/craft:errors app/Services/PaymentGateway.php
/craft:clean-tests tests/Feature/UploadTest.php
/craft:e2e-tests tests/e2e/
```

O `/craft:e2e-tests` apaga da suíte E2E o assert que não impede o usuário de concluir o objetivo dele (estilo, `hover`, texto exato, campo a campo). Ele move a regra de negócio para o teste de unidade. Os estados carregando, vazio, erro e sem permissão entram quando a tela tem esses estados.

## Combinar com o plugin git

```
/craft:atdd recusar anexo acima de 10 MB
... passos 1 a 7 ...
/git:commit
```

O body do commit (e a descrição do PR/MR, se você abrir um) aproveita a especificação do passo 1 como "Por quê".

## Código em inglês, texto do usuário traduzido

O hook `english-code` nega texto fora do inglês em arquivo de código:

| Edição | Resultado |
|---|---|
| `throw new Error('Arquivo maior que 10 MB')` em `src/upload.ts` | negado: a frase vai para `src/locales/pt-BR.json` e o código usa `t('attachment.tooLarge')` |
| `function calcularPreço()` em `app/Price.php` | negado: `calculatePrice` |
| `'tooLarge' => 'Arquivo maior que :max MB'` em `lang/pt_BR/attachment.php` | liberado (pasta de tradução) |
| texto em português num `.md`, `.json` ou `.po` | liberado (não é código) |
| `it('recusa anexo acima do limite')` em `tests/Feature/AttachmentTest.php` | liberado (arquivo de teste: `tests/`, `test/`, `__tests__/`, `spec/`, `*.test.*`, `*.spec.*`, `*_test.*`, `test_*.py`) |

Texto em inglês escrito direto no código para o usuário (`<button>Save</button>`) o hook não detecta; a triagem do `/craft:craft` pega pela skill `craft:i18n`. Projeto sem i18n recebe a proposta da biblioteca padrão da stack, com o seu ok antes de instalar. A mesma skill pega data, número e moeda formatados à mão (use o `Intl`), largura fixa num contêiner de texto e `margin-left` onde cabe `margin-inline-start`.

## Test id em todo elemento interativo

O hook `test-id` nega um elemento interativo sem `data-testid` em `.vue`, `.jsx` e `.tsx`:

| Edição | Resultado |
|---|---|
| `<button @click="save">Salvar</button>` | negado: `<button data-testid="profile-save-button" @click="save">` |
| `<Card onClick={open}>` | negado: o handler torna o componente interativo |
| `` <li :data-testid="`item-${index}`"> `` | o hook libera, mas a triagem do `/craft:craft` pega o índice pela skill `craft:test-ids`: use o SKU |
| `<button class="btn" v-bind="$attrs">` num `BaseButton.vue` | liberado (o test id chega pelo pai) |
| `<button>Save</button>` em `src/components/Form.test.tsx` | liberado (arquivo de teste) |

O teste acha o elemento pelo `getByTestId` primeiro. A remoção do atributo no build de produção é opcional: o `/craft:setup` pergunta.

## Escrita no padrão ASD-STE100

Não há comando. O hook `ste` injeta a skill `craft:ste` em toda sessão, e de novo depois do `/clear` e da compactação. Daí em diante, respostas, docs, commits e PRs/MRs seguem o ASD-STE100 (Simplified Technical English, Issue 9):

| Antes | Depois |
|---|---|
| "A verificação da config deve ser feita pelo usuário antes de rodar o deploy; caso contrário, pode haver falha." | "Verifique a config antes do deploy. Se a config está errada, o deploy falha." |
| "Hook config file path override" | "the path that overrides the hook configuration" |
| "You might wanna take out the old file" | "Remove the old file." |

Texto em inglês segue a norma completa. Texto em português segue as regras que valem para qualquer língua: frase de no máximo 20 palavras em procedimento e 25 em descrição, voz ativa, uma instrução por frase no imperativo, um termo por conceito e nada de ponto e vírgula. Código, comando e texto colado pelo usuário ficam como estão.

## Correção vira hook

Você corrige o Claude (ex.: "não roda `git add .env`"). Ele avalia se a correção repete, se dá para checar pela entrada da ferramenta e se o padrão erra pouco. Com os três sim, propõe o hook e **espera o seu ok**; depois escreve o teste, a regra em TypeScript em `.claude/hooks/rules/`, a mensagem em `.claude/hooks/locales/pt-BR.json` e liga no `.claude/settings.json`. Se a correção exige julgamento, ela vai para a skill do assunto ou o CLAUDE.md, não para hook. A checagem barata e certa nega na hora (`PreToolUse`). A checagem cara ou de julgamento roda uma vez no `Stop`, sobre os arquivos tocados na sessão. Para pedir direto:

```
/craft:hook nunca commitar .env
```

## Memória do projeto

Não há comando obrigatório. O hook `memory` carrega a skill `craft:memory` e o catálogo em toda sessão. Quando uma conversa traz algo que vale para a próxima, o Claude grava no projeto:

```
.claude/memory/
├── MEMORY.md                      só o catálogo, uma linha por memória
├── feedback_testes-no-container.md
└── project_congelamento-deploy.md
```

```markdown
- [Testes no container](feedback_testes-no-container.md): rode os testes com docker compose exec, nunca no host
```

Para pedir direto:

```
/craft:memory os testes de integração precisam do Redis local
/craft:memory esquece a regra do congelamento de deploy
```

Se o Claude tentar gravar na auto memory local (`~/.claude/projects/<projeto>/memory/`), o hook `memory-outside-project` nega e manda gravar em `.claude/memory/`.

## Quando o hook erra

| Erro | Exemplo | O que fazer |
|---|---|---|
| Injetou com a suíte vermelha | executor novo com formato de falha não reconhecido | pegue a linha em `~/.claude/hook-cases.jsonl`, cole no `hooks/tests/cases.json` com `"inject": []` e adicione o padrão em `FAILURE` |
| `atdd-first` negou edição que não muda comportamento | ajuste de config numa extensão de código | carregue `/craft:atdd` mesmo assim; se o arquivo não é código, adicione a exceção em `CODE_FILE` com um teste em `atdd-first.test.ts` |
| `english-code` negou texto que não é de usuário nem código | dado de domínio (nome de cidade num seed) | mova o dado para JSON/CSV; se é uma pasta de tradução com outro nome, adicione em `TRANSLATION_FOLDER` com um teste em `english-code.test.ts` |
| `test-id` negou um elemento que não é interativo | um `<a>` de âncora decorativa, ou um `>` solto num atributo sem aspas | adicione o `data-testid` mesmo assim; se a leitura da tag errou, corrija `OPENING_TAG` com um teste em `test-id.test.ts` |
| `filtered-tests` negou uma execução já filtrada | um filtro que o hook não conhece | adicione o filtro em `FILTER_FLAG` ou `TEST_PATH` com um teste em `filtered-tests.test.ts` |
| `push-gate` negou o push num projeto com CI | um CI com config fora da lista | adicione o caminho em `CI_CONFIGS` com um teste em `push-gate.test.ts` |
| Não injetou com a suíte verde | executor de teste não reconhecido | escreva o caso no `cases.json` com `"inject": ["refactor-on-green"]` e adicione o executor em `TEST_RUNNER` |

Antes de mexer no hook, classifique o achado (`craft:hook`). Problema real: corrija. Falso positivo com evidência: a exceção mais estreita possível, com o motivo `"<quem decidiu>: <evidência>"` no commit. Dúvida: pergunte ao usuário uma vez. Exceção ampla (arquivo inteiro, regra inteira) só com o pedido do usuário.

O passo a passo completo está em [transformar caso real em teste](https://github.com/kamoca-labs/marketplace/blob/main/USAGE.md#transformar-caso-real-em-teste).
