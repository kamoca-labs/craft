---
name: e2e-tests
description: Teste E2E (ponta a ponta) cobre só a jornada do usuário, entra só com a feature pronta e roda só em container. Use ao escrever, gerar ou revisar teste E2E (Playwright, Cypress, Dusk, Selenium) que verifica estilo, hover, cor, animação, texto exato, validação campo a campo, estado intermediário ou detalhe que o usuário não vê, quando a suíte E2E cresce com um teste por tela ou por campo, quando um E2E aparece antes da feature pronta, ou quando um E2E roda fora de container.
argument-hint: "[arquivo ou escopo]"
user-invocable: false
---

# E2E cobre só a jornada do usuário

**Regra**: um teste E2E prova que o usuário **consegue concluir um objetivo** no sistema real. Ele segue a jornada do começo ao fim e verifica só o resultado que prova o objetivo. Todo o resto fica fora do E2E.

Exemplo: "se eu crio um item, o item aparece na lista" é E2E. "No hover, o botão muda a cor de fundo" não é.

## Por quê

- O teste E2E é o mais lento, o mais caro e o mais frágil da suíte. Cada teste a mais custa minutos de CI e um ponto de quebra.
- Um assert de estilo ou de detalhe quebra em toda mudança de layout, mas o sistema continua funcionando. O time aprende a ignorar o vermelho.
- A IA tende a gerar teste exaustivo: um por campo, um por estado, um por variação. Esse volume esconde as jornadas que importam.
- A regra de negócio e os casos de borda têm cobertura mais rápida e mais precisa no teste de unidade (`craft:unit-tests`).

## Quando escrever

**Só com a feature pronta**: todos os ciclos do ATDD dela estão verdes e o fluxo completo funciona na tela.

- Nunca escreva o E2E antes do código nem durante o ciclo red/green. Com a tela incompleta, o E2E falha por motivo que não é bug, gera ruído e atrasa a entrega.
- Os testes de aceite do ATDD ficam na unidade e na integração (`craft:unit-tests`). Eles guiam o código.
- Com a feature pronta, escreva um E2E por jornada nova. Se a feature não cria uma jornada nova, não escreva E2E.

## Onde rodar

**Só em container**, nunca no host. O hook `e2e-container` nega o executor E2E fora de `docker run`, `docker exec` e `docker compose run/exec`.

- Use a imagem oficial do executor, na mesma versão do pacote do projeto. Playwright: `mcr.microsoft.com/playwright:v<versão>-noble`. Cypress: `cypress/included:<versão>`.
- Declare um serviço `e2e` no compose de dev, na mesma rede do app. O teste acessa o app pelo nome do serviço (`http://app:3000`), não por `localhost`.
- Rode com `docker compose run --rm e2e` ou pelo script `test:e2e` do projeto, que chama esse comando.
- Se o projeto ainda não tem o serviço `e2e`, crie o serviço antes de rodar o teste. Nunca rode `npx playwright test` ou `npx cypress run` direto no host.

O container dá o mesmo navegador, as mesmas fontes e o mesmo sistema no dev e no CI. Assim, um teste que passa na máquina de uma pessoa passa no CI também.

## O que entra

- **Jornada crítica**: entrar, cadastrar, criar, editar e apagar o item principal, comprar, buscar e achar.
- **Resultado do objetivo**: o item aparece na lista, continua lá depois de recarregar a página, outra tela mostra o mesmo dado.
- **Fluxo que só existe de ponta a ponta**: várias páginas em sequência, login, redirecionamento, permissão (um usuário sem acesso não vê a tela).
- **Um caminho de erro por jornada, no máximo**, e só quando o erro muda o que o usuário consegue fazer. Ex.: com a senha errada, o usuário não entra.

## O que nunca entra

| Assert proibido no E2E | Onde fica |
|---|---|
| Estilo: cor, fundo, `hover`, foco visual, fonte, tamanho, posição, sombra, classe CSS | em lugar nenhum, ou numa suíte de regressão visual, se o projeto tem uma |
| Animação, transição, tempo de um toast na tela | em lugar nenhum |
| Redação exata de rótulo, título ou mensagem | verifique que a mensagem aparece, não cada palavra dela |
| Layout: ordem dos campos, número de colunas, responsividade | em lugar nenhum, ou na suíte de regressão visual |
| Validação campo a campo, cada combinação de entrada, caso de borda da regra | `craft:unit-tests` |
| Estado intermediário: spinner, botão desabilitado durante o envio, passo a passo de um wizard | em lugar nenhum: verifique só o resultado final |
| O que o usuário não vê: request disparada, payload, store, `localStorage`, console | `craft:unit-tests`, na integração |
| Um teste por tela ou por componente | junte numa jornada, ou apague |

## Sinais de violação

- `toHaveCSS`, `toHaveClass`, `getComputedStyle`, `hover()` seguido de assert.
- `toHaveText` com a frase inteira de um rótulo ou parágrafo.
- Um teste por campo do formulário (`'nome vazio mostra erro'`, `'e-mail inválido mostra erro'`, `'telefone curto mostra erro'`).
- Nome que descreve a tela, não o objetivo: `'página de produtos'`, `'modal de edição'`.
- Asserts no meio da jornada que não provam o objetivo.
- `waitForTimeout`, `cy.wait(2000)`, `sleep`.
- Locator por CSS, XPath, `nth-child` ou classe gerada.
- Teste que depende de outro teste ter rodado antes.
- E2E escrito antes da feature pronta, ou usado como o teste red do ATDD.
- `npx playwright test`, `npx cypress run` ou outro executor E2E rodado direto no host.

## Pergunta de corte

Faça esta pergunta para **cada assert**:

> Se este assert falhar, o usuário fica impedido de concluir o objetivo dele?

- Se a resposta é não, apague o assert.
- Se o teste fica sem nenhum assert, apague o teste.
- Se o assert verifica uma regra de negócio com várias entradas, mova a regra para `craft:unit-tests` e deixe um caso só no E2E.

## Como escrever

1. **Nome** = o objetivo do usuário, em frase: `'usuário cria um protocolo e o vê na lista'`.
2. **Um teste por jornada**, no caminho feliz. Some um caminho de erro só pela regra de [O que entra](#o-que-entra).
3. **Locator pelo test id**: `getByTestId` primeiro (`craft:test-ids`). Use `getByRole` ou `getByLabel` só para um elemento que não é seu. Nunca use CSS, XPath ou posição.
4. **Assert que espera**: `toBeVisible`, `toHaveURL`, `toHaveCount`. Nunca use espera fixa.
5. **Setup fora da UI**: crie os dados e a sessão de login por API, seed ou `storageState`. Use a UI só nos passos que são a jornada.
6. **Teste isolado**: cada teste cria os próprios dados e não depende da ordem.
7. **Sistema real**: o backend e o banco são os de teste do projeto. Use mock só para serviço de terceiro (pagamento, e-mail, SMS).

## Exemplo

```ts
// antes: 4 testes, nenhum prova que o usuário cria um item
test('botão salvar muda a cor no hover', async ({ page }) => {
  await page.goto('/items/new')
  await page.locator('.btn-primary').hover()
  await expect(page.locator('.btn-primary')).toHaveCSS('background-color', 'rgb(37, 99, 235)')
})

test('nome vazio mostra erro', async ({ page }) => { /* ... */ })
test('nome com 256 caracteres mostra erro', async ({ page }) => { /* ... */ })
test('spinner aparece ao salvar', async ({ page }) => { /* ... */ })

// depois: 1 teste, 1 jornada, 1 resultado
test('usuário cria um item e o vê na lista', async ({ page }) => {
  await page.goto('/items/new')

  await page.getByTestId('item-name-input').fill('Cadeira')
  await page.getByTestId('item-save-button').click()

  await expect(page.getByTestId('items-table')).toContainText('Cadeira')
})
```

A validação do nome (vazio, longo demais) vai para o teste de unidade da regra. O hover, a cor e o spinner saem da suíte.

## Limites

- Se o produto **é** o visual (editor de design, gerador de gráfico), o resultado do objetivo pode ser visual. Mesmo assim, use uma suíte de regressão visual com screenshot, não `toHaveCSS` dentro do E2E.
- Se a acessibilidade é requisito, rode uma auditoria (ex.: `axe`) uma vez por página numa suíte própria. Não espalhe asserts de acessibilidade nas jornadas.
- Um passo no meio da jornada pode ter um assert quando o passo seguinte depende dele e a falha fica confusa sem ele. Ex.: confirme a URL depois do login antes de seguir.

## Pergunta de verificação

Cada teste E2E tem o nome de um objetivo do usuário, e cada assert dele falha só quando o usuário fica impedido de concluir esse objetivo? A feature estava pronta quando o teste nasceu, e ele roda em container?
