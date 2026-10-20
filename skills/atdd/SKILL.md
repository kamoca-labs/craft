---
name: atdd
description: Fluxo ATDD de 7 passos (especificação Given/When/Then, e um laço de teste, red, green e passing por cenário, depois refactor e passing again). Use em toda feature ou correção de bug que muda comportamento, antes de escrever código de produção.
argument-hint: "<o que deve mudar>"
---

# ATDD

Toda mudança de comportamento segue estes passos, nesta ordem. Nunca pule nem reordene. Os passos 2 a 5 formam um laço: **um cenário por volta**.

1. **Especificação**: escreva todos os critérios de aceite como cenários Given/When/Then. Percorra as [bordas do mundo real](#bordas-do-mundo-real) e inclua as que a feature tem. Mostre ao usuário e espere o ok antes de seguir.
2. **Teste**: escreva o teste de aceite de **um** cenário, na unidade ou na integração (`craft:clean-tests`). O E2E não entra no laço. Nenhum código de produção ainda.
3. **Red**: rode **só o teste novo** e confirme que falha **pelo motivo esperado** (comportamento ausente), não por erro de sintaxe, import ou setup.
4. **Green**: escreva o mínimo de código de produção que faz o teste passar. Menos código é melhor do que mais código: reutilize o que já existe, e o código genérico nasce reutilizável (regra raiz do `craft:craft`).
5. **Passing**: rode os testes dos cenários já feitos e confirme que passam. Se ainda há cenário, volte ao passo 2 com o próximo.
6. **Refactor**: com todos os cenários verdes, melhore o código com a skill `craft:craft`. Ela faz a triagem dos princípios, inclusive a performance, e carrega só os que se aplicam. O hook `refactor-on-green` injeta essa triagem quando a suíte fica verde. O comportamento não muda.
7. **Passing again**: rode os testes **dos domínios tocados** e confirme que tudo continua passando. Veja [execução filtrada](#execução-filtrada).

## Bordas do mundo real

Um código que só funciona com dado perfeito quebra na mão do usuário. No passo 1, compare cada borda desta lista com a feature:

| Borda | Exemplo |
|---|---|
| Texto vazio e texto muito longo | nome vazio, descrição com 5.000 caracteres |
| Emoji e acento | `José 🚀` no campo de nome |
| Número grande | valor na casa dos bilhões |
| Lista muito grande | 10.000 itens na listagem |
| Rede que cai ou dá timeout | a API não responde em 30 s |
| Resposta 401, 403, 404 e 500 | sessão expirada, item já apagado, erro no servidor |
| Sem permissão | usuário sem o papel de editor abre a edição |
| Duplo envio | dois cliques seguidos no botão de salvar |
| Operação concorrente | duas pessoas editam o mesmo item |

- Escreva um cenário para cada borda que a feature tem.
- Uma borda que a feature não tem não vira cenário. Ex.: uma regra sem rede não tem a borda de timeout.
- O cenário de borda segue o laço como os outros: um por volta.

O `craft:unit-tests` usa esta mesma lista para achar as classes de equivalência.

## Por que um cenário por volta

Todos os testes de uma vez e depois todo o código é "test first", não "test-driven". Os testes em lote verificam um comportamento imaginado, e o código nasce grande de uma vez só. Com um cenário por volta, cada teste nasce do código que já existe, e cada green é pequeno.

## Refactor preparatório

Se o código atual deixa a mudança difícil, refatore **antes** do passo 2: primeiro deixe a mudança fácil, depois faça a mudança fácil.

- A suíte precisa estar verde antes e depois.
- O refactor não muda comportamento e segue o `craft:craft`.
- O refactor vai num commit próprio, antes dos commits de comportamento.

## Commits

Nunca junte uma mudança estrutural e uma mudança de comportamento no mesmo commit. O tipo do commit semântico diz qual é:

| Mudança | Tipo | Quando |
|---|---|---|
| Estrutural: o comportamento não muda | `refactor`, `perf` | refactor preparatório e passo 6 |
| Comportamento | `feat`, `fix` | passos 2 a 5 |

Ordem: o refactor preparatório, depois o comportamento, depois o refactor do passo 6.

## Regras

- Nunca escreva código de produção sem um teste falhando que o exija.
- Ao fim de cada passo, diga qual passo terminou e o resultado. Ex.: "Passo 3 (Red): 2 falhando, `expected 'error' got undefined`".
- Se um teste falhar no passo 5 ou 7, volte ao passo 4 ou corrija o refactor. Nunca altere o teste para passar, a não ser que a especificação tenha mudado.
- Nunca desligue, pule ou apague um teste para a suíte passar. O hook `test-skip` nega `.skip`, `.only` e afins.
- Código só em inglês, inclusive os identificadores dos testes. O nome e o dado de teste podem estar na língua do projeto. Texto que o usuário vê vai para o arquivo de tradução, na língua dele, pelo i18n da stack. Veja `craft:i18n`; o hook `english-code` nega o que fugir disso.
- Se o usuário corrigir algo que você fez, avalie com `craft:hook` se a correção vira hook do projeto.
- Decisão ou escolha tomada no caminho (biblioteca, formato, regra de negócio) fica registrada no repo: no CLAUDE.md se é contexto para o modelo, em `.claude/memory/` se é aprendizado da conversa (`craft:memory`), em `docs/` se é para o time, sempre com caminho relativo. Nunca na memória local do Claude nem em caminho absoluto.
- Siga o executor de teste e o ambiente do projeto (container, script do `package.json`, `artisan test`).
- Escreva o E2E só quando a feature está pronta: todos os ciclos dela verdes e o fluxo completo na tela. Escreva um teste por jornada nova e rode em container (`craft:e2e-tests`). O hook `e2e-container` nega o E2E no host. Um E2E no meio do ciclo falha por tela incompleta, gera ruído e atrasa a entrega.

## Execução filtrada

A suíte inteira cresce com o projeto e passa a custar minutos sem dizer nada a mais sobre a mudança. Rode só o que a mudança pode quebrar:

| Passo | O que rodar |
|---|---|
| 3 | só o teste escrito no passo 2 |
| 5 | os testes dos cenários já feitos |
| 6 (entre um refactor e outro) | os testes do arquivo ou módulo refatorado |
| 7 | os testes dos domínios tocados: os dos arquivos alterados (`git diff --name-only main...`) e os dos módulos que importam esses arquivos |

Todo teste roda com filtro. O hook `filtered-tests` nega a suíte completa sem o consentimento do usuário.

A suíte completa roda assim:

- **Projeto com CI**: a suíte completa roda na nuvem, depois do push. Não rode local.
- **Projeto sem CI**: antes do push ou do PR/MR, pergunte ao usuário com o `AskUserQuestion`. Use as opções exatas `Rodar a suíte completa local` e `Seguir sem a suíte completa`. O hook `push-gate` nega o push e o PR/MR até a resposta. Se a resposta é rodar, rode a suíte e faça o push só com ela verde.

A resposta vale até a próxima edição de código. Depois de uma edição, pergunte de novo.

Ao reportar, diga o filtro usado. Ex.: "Passo 7 (Passing again): 34 passando em `tests/Feature/Protocol` e `tests/Unit/Attachment`".

Filtros por executor:

| Executor | Filtrar |
|---|---|
| vitest | `vitest related <arquivos alterados> --run`, ou `vitest run <pasta>` |
| jest | `jest --findRelatedTests <arquivos alterados>`, ou `jest <pasta>` |
| pest / `artisan test` | `artisan test tests/Feature/<Domínio>`, `--filter <nome>` |
| phpunit | `phpunit tests/Unit/<Domínio>`, `--filter <nome>` |
| pytest | `pytest tests/<domínio>`, `-k <nome>` |
| `node --test` | `node --test <arquivos de teste>`, `--test-name-pattern <nome>` |
| go | `go test ./<pacote>/...`, `-run <nome>` |
| cargo | `cargo test <nome>`, `-p <crate>` |

## Quando não se aplica

- **Mudança sem comportamento** (config, doc, nome, refactor puro): pule o laço. Refatore pelo `craft:craft` com a suíte verde antes e depois.
- **Especificação incerta**: faça um spike, um código só para aprender. Mostre ao usuário o que aprendeu. Depois, apague o código do spike e comece no passo 1. Nunca aproveite o código do spike na produção.
- **Visual que um teste por código não verifica** (layout, animação): verifique por screenshot e escreva o teste só para o comportamento. Se a mudança é só visual, use o `craft:style`.
- **Estado externo que não dá para controlar**: isole a fronteira (`craft:dependency-inversion`) e teste a regra com um dublê. A fronteira fica no teste de integração.

## Exemplo do passo 1

```gherkin
Cenário: anexo acima do limite é recusado
  Dado um protocolo aberto
  Quando o usuário envia um anexo de 11 MB
  Então a resposta é 422
  E a mensagem informa o limite de 10 MB
```
