---
name: test-ids
description: Todo elemento interativo de componente de frontend (Vue, React) leva data-testid com nome de negócio, e o teste acha o elemento por ele. Use ao escrever ou revisar componente com button, a, input, select, textarea, form ou handler de evento, ao escolher o locator de um teste, ou quando o hook test-id negar uma edição.
argument-hint: "[arquivo ou escopo]"
user-invocable: false
---

# Todo elemento interativo tem `data-testid`

**Regra**: todo elemento interativo de componente tem um `data-testid` com **nome de negócio**. O teste acha o elemento pelo `data-testid` primeiro. O test id é um contrato entre o componente e o teste, como uma API pública.

Elemento interativo:

- as tags `button`, `a`, `input`, `select`, `textarea` e `form`
- qualquer elemento ou componente com handler de `click`, `submit`, `change` ou `input`

O hook `test-id` nega a edição de um `.vue`, `.jsx` ou `.tsx` que adiciona um elemento interativo sem `data-testid`.

## Por quê

- O locator fica estável. Uma mudança de texto, de tradução, de teste A/B ou de layout não quebra o teste.
- A IA não precisa inventar um seletor. O teste usa o id que já está no componente.
- Um seletor por CSS, classe ou posição quebra em toda mudança visual.

## Sinais de violação

- Elemento interativo sem `data-testid`.
- Nome genérico ou de posição: `button-1`, `item-2`, `test`, `left-column-v2`.
- Nome de aparência: `blue-button`, `big-card`.
- Item repetido com o índice da lista no id (`item-${index}`).
- Componente próprio que não repassa os atributos do pai, então o `data-testid` do pai some.
- Teste que acha um elemento por classe CSS, XPath ou `nth-child`.

## Como aplicar

1. **Nome de negócio** em kebab-case: `<contexto>-<coisa>-<papel>`. Ex.: `profile-save-button`, `checkout-coupon-input`.
2. **Item repetido**: use o id de negócio estável, como um slug ou SKU (`item-card-${item.sku}`). Nunca use o índice da lista nem a chave primária do banco, que muda entre ambientes.
3. **Componente próprio repassa os atributos do pai** ao elemento interativo:
   - Vue, com uma raiz só: o atributo cai sozinho na raiz.
   - Vue, com várias raízes ou com wrapper: use `defineOptions({ inheritAttrs: false })` e `v-bind="$attrs"` no elemento interativo.
   - React: espalhe o resto das props no elemento (`<button {...rest}>`).
4. **Locator no teste**: `getByTestId` primeiro. Use `getByRole` ou `getByLabel` só quando o elemento não é seu, como um widget de terceiro sem test id.
5. **Remova o atributo no build de produção**, quando o projeto quer o HTML limpo:
   - React com Vite: `rollup-plugin-jsx-remove-attributes`.
   - React com Babel: `babel-plugin-react-remove-properties`.
   - Vue com Vite: um `nodeTransforms` no `compilerOptions` do `@vitejs/plugin-vue` que apaga o `data-testid` só em produção.

   Atenção: não remova o atributo do build que roda o E2E. Se o E2E roda contra o build de produção, o teste não acha nenhum elemento.

## Exemplo

```vue
<!-- antes -->
<li v-for="(item, index) in items" :key="item.sku" :data-testid="`item-${index}`">
  <button class="btn-blue" @click="remove(item)">Remover</button>
</li>

<!-- depois -->
<li v-for="item in items" :key="item.sku">
  <button :data-testid="`item-remove-button-${item.sku}`" @click="remove(item)">Remover</button>
</li>
```

```tsx
function BaseButton({ variant, ...rest }: BaseButtonProps) {
  return <button className={styles[variant]} {...rest} />
}

<BaseButton data-testid="profile-save-button" onClick={save}>Salvar</BaseButton>
```

## Limites

- O test id não substitui a acessibilidade. Use o elemento HTML certo (`<button>`, não `<div @click>`) e um rótulo para o leitor de tela.
- Não coloque `data-testid` em elemento que não é interativo só para o teste. Use o test id do elemento interativo mais próximo ou da região (`items-table`), se o teste precisa dele.
- O hook lê as tags com regex. Um caso raro, como um `>` solto dentro de um atributo sem aspas, escapa do hook.

## Pergunta de verificação

Todo elemento interativo tem um `data-testid` que diz a coisa de negócio, e o teste acha esse elemento pelo test id?
