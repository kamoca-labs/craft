---
name: atdd
description: Fluxo ATDD de 7 passos (especificação Given/When/Then, teste, red, green, passing, refactor, passing again). Use em toda feature ou correção de bug que muda comportamento, antes de escrever código de produção.
argument-hint: "<o que deve mudar>"
---

# ATDD

Toda mudança de comportamento segue estes passos, nesta ordem. Nunca pule, junte ou reordene.

1. **Especificação**: escreva os critérios de aceite como cenários Given/When/Then. Mostre ao usuário e espere o ok antes de seguir.
2. **Teste**: escreva os testes de aceite que expressam a especificação. Nenhum código de produção ainda.
3. **Red**: rode **só os testes novos** e confirme que falham **pelo motivo esperado** (comportamento ausente), não por erro de sintaxe, import ou setup.
4. **Green**: escreva o mínimo de código de produção que faz os testes passarem.
5. **Passing**: rode **só os testes novos** e confirme que passam.
6. **Refactor**: melhore o código com a skill `craft:craft`, que faz a triagem dos princípios e carrega só os que se aplicam. O hook `refactor-on-green` injeta essa triagem automaticamente quando a suíte fica verde. O comportamento não muda.
7. **Passing again**: rode os testes **dos domínios tocados** e confirme que tudo continua passando. Veja [execução filtrada](#execução-filtrada).

## Regras

- Nunca escreva código de produção sem um teste falhando que o exija.
- Ao fim de cada passo, diga qual passo terminou e o resultado. Ex.: "Passo 3 (Red): 2 falhando, `expected 'error' got undefined`".
- Se um teste falhar no passo 5 ou 7, volte ao passo 4 ou corrija o refactor. Nunca altere o teste para passar, a não ser que a especificação tenha mudado.
- Código só em inglês, inclusive os identificadores dos testes. O nome e o dado de teste podem estar na língua do projeto. Texto que o usuário vê vai para o arquivo de tradução, na língua dele, pelo i18n da stack. Veja `craft:i18n`; o hook `english-code` nega o que fugir disso.
- Se o usuário corrigir algo que você fez, avalie com `craft:hook` se a correção vira hook do projeto.
- Decisão ou escolha tomada no caminho (biblioteca, formato, regra de negócio) fica registrada no repo: no CLAUDE.md se é contexto para o modelo, em `docs/` se é para o time, sempre com caminho relativo. Nunca na memória local do Claude nem em caminho absoluto.
- Siga o executor de teste e o ambiente do projeto (container, script do `package.json`, `artisan test`).

## Execução filtrada

A suíte inteira cresce com o projeto e passa a custar minutos sem dizer nada a mais sobre a mudança. Rode só o que a mudança pode quebrar:

| Passo | O que rodar |
|---|---|
| 3 e 5 | só os testes escritos no passo 2 |
| 6 (entre um refactor e outro) | os testes do arquivo ou módulo refatorado |
| 7 | os testes dos domínios tocados: os dos arquivos alterados (`git diff --name-only main...`) e os dos módulos que importam esses arquivos |

Rode a suíte completa só quando a mudança tocar algo que todos usam (config, módulo base, schema ou migração, helper compartilhado, dependência atualizada) ou quando o usuário pedir. Fora disso, ela fica para o CI.

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

## Exemplo do passo 1

```gherkin
Cenário: anexo acima do limite é recusado
  Dado um protocolo aberto
  Quando o usuário envia um anexo de 11 MB
  Então a resposta é 422
  E a mensagem informa o limite de 10 MB
```
