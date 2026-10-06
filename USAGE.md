# Uso do plugin `craft`

## Sumário

- [Projeto novo](#projeto-novo)
- [Feature nova com ATDD](#feature-nova-com-atdd)
- [Correção de bug com ATDD](#correção-de-bug-com-atdd)
- [Refactor automático depois do verde](#refactor-automático-depois-do-verde)
- [Refactor sob demanda](#refactor-sob-demanda)
- [Combinar com o plugin git](#combinar-com-o-plugin-git)
- [Quando o hook erra](#quando-o-hook-erra)

## Projeto novo

```
/craft:setup
```

O Claude detecta a stack, mostra o plano (dependências, configs, limites) e **espera o seu ok**. Depois instala o linter com os limites do craft, cria os scripts `test` e `lint` e escreve no CLAUDE.md só a linha que manda seguir o `/craft:atdd` e os comandos de teste e lint, sem listar as demais skills nem os limites, que já chegam por conta própria. Violações em código que já existe só são contadas, não corrigidas. Dali em diante, o `/craft:craft` roda esse lint antes da triagem.

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

O Claude faz a triagem de todos os princípios, carrega só as skills com sinal, aplica uma de cada vez sem mudar comportamento e, no fim, roda os testes dos domínios tocados. O relatório diz o que mudou por princípio e quais não tiveram sinal.

Para um princípio só, chame a skill dele:

```
/craft:errors app/Services/PaymentGateway.php
/craft:clean-tests tests/Feature/UploadTest.php
```

## Combinar com o plugin git

```
/craft:atdd recusar anexo acima de 10 MB
... passos 1 a 7 ...
/git:commit /git:chamado 19738 /gitlab:mr @fulano
```

O body do commit e a descrição do MR aproveitam a especificação do passo 1 como "Por quê".

## Quando o hook erra

| Erro | Exemplo | O que fazer |
|---|---|---|
| Injetou com a suíte vermelha | executor novo com formato de falha não reconhecido | pegue a linha em `~/.claude/hook-cases.jsonl`, cole no `hooks/tests/cases.json` com `"inject": []` e adicione o padrão em `FAILURE` |
| Não injetou com a suíte verde | executor de teste não reconhecido | escreva o caso no `cases.json` com `"inject": ["refactor-on-green"]` e adicione o executor em `TEST_RUNNER` |

O passo a passo completo está em [transformar caso real em teste](../../USAGE.md#transformar-caso-real-em-teste).
