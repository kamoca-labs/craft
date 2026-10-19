---
name: craft
description: Ponto de entrada do refactor (passo 6 do ATDD). Reforça a regra raiz (menos código é melhor do que mais código), faz a triagem do código alterado contra SOLID, KISS, YAGNI, DRY e Clean Code e carrega só as skills dos princípios que têm sinal de violação. Use logo depois de deixar os testes verdes, ou quando pedirem para refatorar ou revisar a qualidade de um código.
argument-hint: "[arquivo ou escopo]"
---

# Craft: refactor guiado por princípios

Os testes estão verdes. Se você está no laço do ATDD e ainda há cenário, volte ao passo 2 com o próximo: a triagem fica para o fim. Se todos os cenários estão verdes, faça agora o passo 6: refatore o código que tocou e rode de novo os testes dos domínios tocados (passo 7). Se já terminou o refactor, este é o passo 7: confirme que tudo passa e reporte.

## Regra raiz: menos código

**Menos código é melhor do que mais código.** Esta regra não é um princípio novo. Ela é o que KISS, YAGNI e DRY têm em comum, e vale para todo código que você escreve, não só no refactor:

- Reutilize o que já existe antes de escrever (`craft:kiss`).
- Escreva só o que um teste ou um uso atual exige (`craft:yagni`).
- O código genérico nasce reutilizável, fora do caso específico (`craft:dry`).

## Como conduzir

1. **Escopo**: o argumento, se houver; senão, o que mudou (`git diff` da branch contra a main).
2. **Lint**: se o projeto tem script de lint (o `craft:setup` cria um), rode nos arquivos do escopo. Violação de tamanho ou complexidade já é sinal: `max-lines-per-function` e `complexity` → `craft:functions`, `max-params` → `craft:arguments`, `max-depth` → `craft:guard-clauses`, `max-lines` → `craft:single-responsibility`. Nunca desligue nem afrouxe a regra para passar.
3. **Regra raiz**: antes da triagem, procure no escopo o código que dá para apagar. Apagar vale mais que adicionar.
4. **Triagem**: leia o código do escopo e faça a pergunta de cada linha da tabela abaixo.
5. **Aprofunde só onde há sinal**: para cada princípio com sinal, carregue a skill dele com a ferramenta `Skill` (`craft:<skill>`) e siga o que ela diz. Não carregue a skill de um princípio sem sinal.
6. **Um refactor por vez**: mude, rode os testes do módulo refatorado, siga. Nunca edite um teste para fazê-lo passar.
7. **Reporte**: uma linha para a regra raiz e uma por princípio com sinal (`craft:dry: regra do limite de anexo unificada em MAX_ATTACHMENT_SIZE`). Diga quais não tiveram sinal.

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
| `craft:dry` | DRY | A mesma regra de negócio, texto ou estilo está escrita em dois lugares, ou há código genérico preso ao caso? |
| `craft:i18n` | Inglês e i18n | Há código fora do inglês, ou texto que o usuário vê escrito direto no código? |
| `craft:naming` | Nomes | Algum nome precisa do código (ou de um comentário) para ser entendido? |
| `craft:functions` | Funções | Alguma função faz mais de uma coisa ou mistura níveis de abstração? |
| `craft:arguments` | Argumentos | Mais de três parâmetros, ou um booleano que muda o comportamento? |
| `craft:guard-clauses` | Guard clause | Há `if` aninhado em mais de um nível, ou `else` depois de `return`? |
| `craft:side-effects` | Efeito colateral | Alguma função altera estado, grava ou envia algo que o nome não anuncia? |
| `craft:comments` | Comentários | Há comentário explicando *o quê* o código faz? |
| `craft:errors` | Erros | Algum erro é engolido, logado e ignorado, ou vira `null` silencioso? |
| `craft:performance` | Performance | Algum trecho roda sobre muitos dados ou num caminho quente (laço dentro de laço, query no laço, I/O repetido, chamadas em série) sem uma medição que compare formas? |
| `craft:clean-tests` | Testes | Algum teste tem lógica, testa mais de um comportamento, tem nome vago ou está na camada errada? |
| `craft:unit-tests` | Unidade e integração | Algum teste verifica método privado, mock de mock, getter, a biblioteca ou a aparência? |
| `craft:test-ids` | Test id | Algum elemento interativo está sem `data-testid`, tem um id genérico ou de posição, ou algum componente não repassa os atributos do pai? |
| `craft:e2e-tests` | E2E | Algum teste E2E verifica algo que não impede o usuário de concluir o objetivo dele (estilo, `hover`, texto exato, campo a campo)? |

## Quando os princípios brigam

Princípios são ferramentas, não metas. Quando um puxa contra o outro, vale esta ordem:

1. **Comportamento correto** (testes verdes, erros tratados).
2. **Legibilidade** (nomes, funções, guard clauses): o próximo leitor entende sem ajuda.
3. **Regra raiz, KISS e YAGNI**: menos código, menos conceito.
4. **Performance medida**: um ganho medido acima do ruído pode custar legibilidade, com a comparação no commit. Sem medição, a legibilidade vence.
5. **DRY**: só quando a duplicação é do mesmo conhecimento.
6. **Extensibilidade (O, D, I do SOLID)**: só quando a variação já existe, não quando é imaginada.

Conflitos comuns:

- **DRY × KISS**: duplicação é mais barata que a abstração errada. Espere a terceira repetição antes de extrair.
- **Open/Closed ou inversão de dependência × YAGNI**: crie a abstração quando houver a segunda implementação real ou uma fronteira de I/O que precisa de dublê no teste. Antes disso, é especulação.
- **Performance × legibilidade**: a forma mais rápida vence só com a medição no volume real e com a comparação entre formas (`craft:performance`).
- **Responsabilidade única × KISS**: separar responsabilidades não é picar o código em dez classes de uma linha. Se as partes sempre mudam juntas, são uma responsabilidade só.

## Checklist antes de sair do passo 6

- [ ] Lint do escopo sem violação (quando o projeto tem lint).
- [ ] Regra raiz aplicada: nada no escopo que dá para apagar.
- [ ] Triagem feita em todas as linhas da tabela.
- [ ] Skill carregada e aplicada para cada princípio com sinal.
- [ ] Toda otimização tem medição antes e depois e venceu outra forma.
- [ ] Commit do refactor separado do commit de comportamento.
- [ ] Comportamento igual (nenhum teste foi editado para passar).
- [ ] Testes dos domínios tocados rodados de novo, com filtro, e verdes. A suíte completa roda no CI, ou local só com o consentimento do usuário (veja a execução filtrada em `craft:atdd`).
