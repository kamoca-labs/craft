---
name: craft
description: Ponto de entrada do refactor (passo 6 do ATDD). Faz a triagem do código alterado contra SOLID, KISS, YAGNI, DRY e Clean Code e carrega só as skills dos princípios que têm sinal de violação. Use logo depois de deixar os testes verdes, ou quando pedirem para refatorar ou revisar a qualidade de um código.
argument-hint: "[arquivo ou escopo]"
---

# Craft: refactor guiado por princípios

Os testes estão verdes. Se você acabou de fazê-los passar (passo 5 do ATDD), faça agora o passo 6: refatore o código que tocou e rode de novo os testes dos domínios tocados (passo 7). Se já terminou o refactor, este é o passo 7: confirme que tudo passa e reporte.

## Como conduzir

1. **Escopo**: o argumento, se houver; senão, o que mudou (`git diff` da branch contra a main).
2. **Triagem**: leia o código do escopo e faça a pergunta de cada linha da tabela abaixo.
3. **Aprofunde só onde há sinal**: para cada princípio com sinal, carregue a skill dele com a ferramenta `Skill` (`craft:<skill>`) e siga o que ela diz. Não carregue a skill de um princípio sem sinal.
4. **Um refactor por vez**: mude, rode os testes do módulo refatorado, siga. Nunca edite um teste para fazê-lo passar.
5. **Reporte**: uma linha por princípio com sinal (`craft:dry: regra do limite de anexo unificada em MAX_ATTACHMENT_SIZE`) e diga quais não tiveram sinal.

## Triagem

| Skill | Princípio | Pergunta de triagem |
|---|---|---|
| `craft:single-responsibility` | S do SOLID | Este módulo muda por mais de um motivo, ou por mais de um tipo de pessoa? |
| `craft:open-closed` | O do SOLID | Um caso novo exigiu editar um `if`/`switch` que já existia? |
| `craft:liskov-substitution` | L do SOLID | Alguma implementação lança "não suportado", ignora parâmetro ou exige `instanceof` de quem chama? |
| `craft:interface-segregation` | I do SOLID | Alguém recebe um tipo, objeto ou props e usa só uma fração dele? |
| `craft:dependency-inversion` | D do SOLID | A regra de negócio importa direto banco, HTTP, LLM, relógio ou storage? |
| `craft:kiss` | KISS | Existe uma forma mais simples que passa nos mesmos testes? |
| `craft:yagni` | YAGNI | Há opção, parâmetro, camada ou abstração sem uso atual? |
| `craft:dry` | DRY | A mesma regra de negócio, texto ou estilo está escrita em dois lugares? |
| `craft:naming` | Nomes | Algum nome precisa do código (ou de um comentário) para ser entendido? |
| `craft:functions` | Funções | Alguma função faz mais de uma coisa ou mistura níveis de abstração? |
| `craft:arguments` | Argumentos | Mais de três parâmetros, ou um booleano que muda o comportamento? |
| `craft:guard-clauses` | Guard clause | Há `if` aninhado em mais de um nível, ou `else` depois de `return`? |
| `craft:side-effects` | Efeito colateral | Alguma função altera estado, grava ou envia algo que o nome não anuncia? |
| `craft:comments` | Comentários | Há comentário explicando *o quê* o código faz? |
| `craft:errors` | Erros | Algum erro é engolido, logado e ignorado, ou vira `null` silencioso? |
| `craft:clean-tests` | Testes | Algum teste tem lógica, testa mais de um comportamento ou tem nome vago? |

## Quando os princípios brigam

Princípios são ferramentas, não metas. Quando um puxa contra o outro, vale esta ordem:

1. **Comportamento correto** (testes verdes, erros tratados).
2. **Legibilidade** (nomes, funções, guard clauses): o próximo leitor entende sem ajuda.
3. **KISS e YAGNI**: menos código, menos conceito.
4. **DRY**: só quando a duplicação é do mesmo conhecimento.
5. **Extensibilidade (O, D, I do SOLID)**: só quando a variação já existe, não quando é imaginada.

Conflitos comuns:

- **DRY × KISS**: duplicação é mais barata que a abstração errada. Espere a terceira repetição antes de extrair.
- **Open/Closed ou inversão de dependência × YAGNI**: crie a abstração quando houver a segunda implementação real ou uma fronteira de I/O que precisa de dublê no teste. Antes disso, é especulação.
- **Responsabilidade única × KISS**: separar responsabilidades não é picar o código em dez classes de uma linha. Se as partes sempre mudam juntas, são uma responsabilidade só.

## Checklist antes de sair do passo 6

- [ ] Triagem feita em todas as linhas da tabela.
- [ ] Skill carregada e aplicada para cada princípio com sinal.
- [ ] Comportamento igual (nenhum teste foi editado para passar).
- [ ] Testes dos domínios tocados rodados de novo e verdes; suíte completa só se a mudança tocou algo compartilhado (veja a execução filtrada em `craft:atdd`).
