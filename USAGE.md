# Uso do plugin `practices`

## Sumário

- [Feature nova com ATDD](#feature-nova-com-atdd)
- [Correção de bug com ATDD](#correção-de-bug-com-atdd)
- [Refactor automático depois do verde](#refactor-automático-depois-do-verde)
- [Refactor sob demanda](#refactor-sob-demanda)
- [Combinar com o plugin git](#combinar-com-o-plugin-git)
- [Quando o hook erra](#quando-o-hook-erra)

## Feature nova com ATDD

```
/practices:atdd recusar anexo acima de 10 MB no protocolo
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
4. O hook injeta os princípios e ele refatora: `Passo 6 (Refactor): extraído MAX_ATTACHMENT_SIZE`.
5. Roda a suíte completa: `Passo 7 (Passing again): 48 passando`.

## Correção de bug com ATDD

```
/practices:atdd setor sem dono quebra a listagem
```

O passo 1 vira o cenário que reproduz o bug. O passo 3 prova que o teste pega o bug **antes** da correção.

## Refactor automático depois do verde

Não precisa de comando. Sempre que o Claude roda testes e a saída vem sem falha, o hook `refactor-on-green` injeta os princípios de refactor como contexto:

| Comando rodado | Saída | Injeta? |
|---|---|---|
| `pnpm vitest run` | `Tests  21 passed (21)` | sim |
| `php artisan test` | `Tests:  48 passed` | sim |
| `pnpm vitest run \| tail` | `Tests  1 failed \| 20 passed` | não (falha escondida pelo pipe) |
| `node --test ...` | `# fail 1` | não |
| `grep -rn describe tests/` | qualquer | não (não roda teste) |

## Refactor sob demanda

```
/practices:refactor app/Actions/UploadAttachment.php
/practices:refactor o que mudou nesta branch
```

O Claude passa cada princípio e o checklist sobre o escopo, sem mudar comportamento, e roda a suíte no fim.

## Combinar com o plugin git

```
/practices:atdd recusar anexo acima de 10 MB
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
