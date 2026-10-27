---
name: test-ids
description: Every interactive element of a frontend component (Vue, React) carries a data-testid with a business name, and the test finds the element by it. Use when you write or review a component with button, a, input, select, textarea, form or an event handler, when you choose the locator of a test, or when the test-id hook denies an edit.
argument-hint: "[file or scope]"
user-invocable: false
---

# Every interactive element has `data-testid`

**Rule**: every interactive element of a component has a `data-testid` with a **business name**. The test finds the element by `data-testid` first. The test id is a contract between the component and the test, like a public API.

Interactive element:

- the tags `button`, `a`, `input`, `select`, `textarea` and `form`
- any element or component with a `click`, `submit`, `change` or `input` handler

The `test-id` hook denies the edit of a `.vue`, `.jsx` or `.tsx` file that adds an interactive element without `data-testid`.

## Why

- The locator stays stable. A change of text, translation, A/B test or layout does not break the test.
- The AI does not need to invent a selector. The test uses the id that is already in the component.
- A selector by CSS, class or position breaks on every visual change.

## Signs of violation

- Interactive element without `data-testid`.
- Generic or position-based name: `button-1`, `item-2`, `test`, `left-column-v2`.
- Appearance name: `blue-button`, `big-card`.
- Repeated item with the list index in the id (`item-${index}`).
- A custom component that does not pass the parent attributes through, so the `data-testid` of the parent is lost.
- A test that finds an element by CSS class, XPath or `nth-child`.

## How to apply

1. **Business name** in kebab-case: `<context>-<thing>-<role>`. Example: `profile-save-button`, `checkout-coupon-input`.
2. **Repeated item**: use the stable business id, such as a slug or SKU (`item-card-${item.sku}`). Never use the list index or the database primary key, which changes between environments.
3. **A custom component passes the parent attributes through** to the interactive element:
   - Vue, with a single root: the attribute falls on the root by itself.
   - Vue, with many roots or with a wrapper: use `defineOptions({ inheritAttrs: false })` and `v-bind="$attrs"` on the interactive element.
   - React: spread the rest of the props on the element (`<button {...rest}>`).
4. **Locator in the test**: `getByTestId` first. Use `getByRole` or `getByLabel` only when the element is not yours, such as a third-party widget without a test id.
5. **Remove the attribute in the production build**, when the project wants clean HTML:
   - React with Vite: `rollup-plugin-jsx-remove-attributes`.
   - React with Babel: `babel-plugin-react-remove-properties`.
   - Vue with Vite: a `nodeTransforms` in the `compilerOptions` of `@vitejs/plugin-vue` that removes `data-testid` only in production.

   Warning: do not remove the attribute from the build that runs the E2E. If the E2E runs against the production build, the test finds no element.

## Example

```vue
<!-- before -->
<li v-for="(item, index) in items" :key="item.sku" :data-testid="`item-${index}`">
  <button class="btn-blue" @click="remove(item)">Remove</button>
</li>

<!-- after -->
<li v-for="item in items" :key="item.sku">
  <button :data-testid="`item-remove-button-${item.sku}`" @click="remove(item)">Remove</button>
</li>
```

```tsx
function BaseButton({ variant, ...rest }: BaseButtonProps) {
  return <button className={styles[variant]} {...rest} />
}

<BaseButton data-testid="profile-save-button" onClick={save}>Save</BaseButton>
```

## Limits

- The test id does not replace accessibility. Use the right HTML element (`<button>`, not `<div @click>`) and a label for the screen reader.
- Do not put `data-testid` on a non-interactive element only for the test. Use the test id of the nearest interactive element or of the region (`items-table`), if the test needs it.
- The hook reads the tags with regex. A rare case, such as a loose `>` inside an unquoted attribute, escapes the hook.

## Verification question

Does every interactive element have a `data-testid` that names the business thing, and does the test find that element by the test id?
