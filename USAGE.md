# Uso do plugin `craft`

## Sumário

- [Projeto novo](#projeto-novo)
- [Feature nova com ATDD](#feature-nova-com-atdd)
- [Correção de bug com ATDD](#correção-de-bug-com-atdd)
- [Refactor automático depois do verde](#refactor-automático-depois-do-verde)
- [Refactor sob demanda](#refactor-sob-demanda)
- [Combinar com o plugin git](#combinar-com-o-plugin-git)
- [Código em inglês, texto do usuário traduzido](#código-em-inglês-texto-do-usuário-traduzido)
- [Escrita no padrão ASD-STE100](#escrita-no-padrão-asd-ste100)
- [Correção vira hook](#correção-vira-hook)
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

1. O Claude escreve os cenários e **espera o seu ok**:

   ```gherkin
   Cenário: anexo acima do limite é recusado
     Dado um protocolo aberto
     Quando o usuário envia um anexo de 11 MB
     Então a resposta é 422
     E a mensagem informa o limite de 10 MB
   ```

2. Escreve o teste e roda: `Passo 3 (Red): 1 falhando, expected 422 got 201`.
3. Escreve o mínimo de código: `Passo 5 (Passing): 1 passando`.
4. O hook injeta a triagem, ele carrega só o que tem sinal e refatora: `Passo 6 (Refactor): craft:dry, limite unificado em MAX_ATTACHMENT_SIZE; sem sinal nos demais`.
5. Roda os testes dos domínios tocados: `Passo 7 (Passing again): 34 passando em tests/Feature/Protocol e tests/Unit/Attachment`.

## Correção de bug com ATDD

```
/craft:atdd setor sem dono quebra a listagem
```

O passo 1 vira o cenário que reproduz o bug. O passo 3 prova que o teste pega o bug **antes** da correção.

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

O Claude procura primeiro o que dá para apagar (regra raiz), faz a triagem de todos os princípios, carrega só as skills com sinal, aplica uma de cada vez sem mudar comportamento e, no fim, roda os testes dos domínios tocados. O relatório diz o que mudou por princípio e quais não tiveram sinal.

Para um princípio só, chame a skill dele:

```
/craft:errors app/Services/PaymentGateway.php
/craft:clean-tests tests/Feature/UploadTest.php
```

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

Texto em inglês escrito direto no código para o usuário (`<button>Save</button>`) o hook não detecta; a triagem do `/craft:craft` pega pela skill `craft:i18n`. Projeto sem i18n recebe a proposta da biblioteca padrão da stack, com o seu ok antes de instalar.

## Escrita no padrão ASD-STE100

Não há comando. O hook `ste` injeta a skill `craft:ste` em toda sessão, e de novo depois do `/clear` e da compactação. Daí em diante, respostas, docs, commits e PRs/MRs seguem o ASD-STE100 (Simplified Technical English, Issue 9):

| Antes | Depois |
|---|---|
| "A verificação da config deve ser feita pelo usuário antes de rodar o deploy; caso contrário, pode haver falha." | "Verifique a config antes do deploy. Se a config está errada, o deploy falha." |
| "Hook config file path override" | "the path that overrides the hook configuration" |
| "You might wanna take out the old file" | "Remove the old file." |

Texto em inglês segue a norma completa. Texto em português segue as regras que valem para qualquer língua: frase de no máximo 20 palavras em procedimento e 25 em descrição, voz ativa, uma instrução por frase no imperativo, um termo por conceito e nada de ponto e vírgula. Código, comando e texto colado pelo usuário ficam como estão.

## Correção vira hook

Você corrige o Claude (ex.: "não roda `git add .env`"). Ele avalia se a correção repete, se dá para checar pela entrada da ferramenta e se o padrão erra pouco. Com os três sim, propõe o hook e **espera o seu ok**; depois escreve o teste, a regra em TypeScript em `.claude/hooks/rules/`, a mensagem em `.claude/hooks/locales/pt-BR.json` e liga no `.claude/settings.json`. Se a correção exige julgamento, ela vai para a skill do assunto ou o CLAUDE.md, não para hook. Para pedir direto:

```
/craft:hook nunca commitar .env
```

## Quando o hook erra

| Erro | Exemplo | O que fazer |
|---|---|---|
| Injetou com a suíte vermelha | executor novo com formato de falha não reconhecido | pegue a linha em `~/.claude/hook-cases.jsonl`, cole no `hooks/tests/cases.json` com `"inject": []` e adicione o padrão em `FAILURE` |
| `atdd-first` negou edição que não muda comportamento | ajuste de config numa extensão de código | carregue `/craft:atdd` mesmo assim; se o arquivo não é código, adicione a exceção em `CODE_FILE` com um teste em `atdd-first.test.ts` |
| `english-code` negou texto que não é de usuário nem código | dado de domínio (nome de cidade num seed) | mova o dado para JSON/CSV; se é uma pasta de tradução com outro nome, adicione em `TRANSLATION_FOLDER` com um teste em `english-code.test.ts` |
| Não injetou com a suíte verde | executor de teste não reconhecido | escreva o caso no `cases.json` com `"inject": ["refactor-on-green"]` e adicione o executor em `TEST_RUNNER` |

O passo a passo completo está em [transformar caso real em teste](../../USAGE.md#transformar-caso-real-em-teste).
