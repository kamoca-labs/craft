---
name: style
description: Modo estilo para mudança só visual (estilo, layout, espaçamento, cor, responsividade, posição de elementos, animação). Itera a tela com o usuário sem especificação Given/When/Then nem teste vermelho antes, e roda os testes dos arquivos tocados no fim. Use quando a mudança não toca comportamento. Comportamento vai para o craft:atdd.
argument-hint: "<o que deve mudar na tela>"
---

# Modo estilo

Mudança só visual não tem regra para testar antes. O usuário vê a tela e decide. Neste modo, você itera a tela com ele e verifica a quebra no fim.

O hook `atdd-first` libera, com esta skill carregada, só os componentes de UI: `.vue`, `.tsx`, `.jsx`, `.svelte` e `.astro`. CSS, SCSS e Less sempre passam. Serviço, store, API e back-end continuam negados sem o `craft:atdd`.

## Como conduzir

1. **Impeccable**: confira se a skill `impeccable` está na lista de skills da sessão.
   - Se está, carregue o `/impeccable` com a ferramenta `Skill`. Siga as orientações dele para a parte visual.
   - Se não está, peça ao usuário para instalar e espere a resposta. O comando oficial para o Claude Code é `/plugin marketplace add pbakaus/impeccable`. Depois, o usuário abre o `/plugin` e instala o Impeccable da lista. Fonte: `https://impeccable.style` e o repo `pbakaus/impeccable`.
2. **Iteração**: faça a mudança visual que o usuário pede. Ele olha a tela e pede o ajuste seguinte. Não escreva especificação Given/When/Then nem teste vermelho antes.
3. **Fechamento**: quando o usuário diz que a tela está ok, rode uma vez os testes filtrados dos arquivos tocados (componente e E2E). Assim você pega uma quebra. Faça no máximo uma rodada de correção e uma de confirmação. Depois, pare.

## Limite do modo

O modo estilo cobre só a aparência. Se a mudança toca comportamento, ela sai do modo estilo e vai para o `craft:atdd`. Comportamento é:

- um handler (click, submit, change, input)
- um estado ou um dado
- uma condição que mostra ou esconde conteúdo por regra
- uma chamada de API
- uma regra de negócio.

## Feature mista (tela com back-end)

Não decida a ordem sozinho. Pergunte ao usuário com o `AskUserQuestion`, com estas opções:

- **Back-end primeiro (recomendado)**: o ATDD cobre o contrato e a regra. Depois, o modo estilo itera a tela com o dado real.
- **Tela primeiro**: o modo estilo itera a tela com dado fixo (mock). Depois, o ATDD faz o back-end e troca o mock pelo dado real.
- **Por fatia**: cada cenário passa pelo ATDD. Depois, o visual daquele cenário passa pelo modo estilo, antes do cenário seguinte.

Nos três casos, a lógica nunca entra sem teste. O hook `atdd-first` garante isso.

## Motion: nunca uma quebra brusca

O usuário nunca vê um salto. Toda mudança na tela é gradual.

- **Entrada e saída animam.** Todo elemento que aparece, some ou muda de tamanho anima. Ele nunca surge nem some de repente. Exemplos: o modal que abre e fecha, o item que entra e sai de uma lista, o painel que expande e recolhe, a mensagem que aparece.
- **O tamanho muda de forma gradual.** Para a altura automática, use uma destas técnicas:
  - `grid-template-rows` de `0fr` para `1fr`
  - `interpolate-size: allow-keywords`, onde o navegador tem suporte
  - a View Transitions API.
- **O modal combina duas propriedades.** Anime `opacity` junto com `transform: scale` ou `translate`.
- **Evite animar a geometria fixa.** Não anime `top`, `left`, `width` e `height` com valor fixo em px quando uma das técnicas acima resolve.
- **Duração e curva:** a duração fica entre 150 e 300 ms. A entrada usa ease-out. A saída usa ease-in. Não use bounce.
- **Tokens num lugar só:** a duração e a curva ficam em tokens (variáveis CSS ou do tema), num arquivo só. Não escreva um valor solto em cada componente.
- **`prefers-reduced-motion: reduce` é obrigatório.** Com essa preferência, a transição fica instantânea ou vira um fade curto. O conteúdo continua visível e utilizável.
- **Sem salto de layout no carregamento.** Reserve o espaço do conteúdo antes de ele chegar. Prefira reservar a altura ou manter o conteúdo anterior até o novo chegar. O skeleton é só uma opção para propor ao usuário. Nunca use o skeleton como padrão.

## Verificação

- O usuário disse que a tela está ok.
- A mudança não toca comportamento, ou a parte de comportamento passou pelo `craft:atdd`.
- Todo elemento que aparece, some ou muda de tamanho anima, e respeita o `prefers-reduced-motion`.
- A duração e a curva vêm dos tokens.
- Os testes filtrados dos arquivos tocados passam.
