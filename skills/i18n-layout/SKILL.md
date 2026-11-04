---
name: i18n-layout
description: The layout survives a longer translation and a right-to-left language. Use when a text container (button, label, tab, badge) has a fixed width, when the CSS uses a physical direction (margin-left, padding-right, border-right, text-align left), or when the layout breaks with a long translation or with RTL.
argument-hint: "[file or scope]"
user-invocable: false
---

# Layout for translation

**Rule**: the text container grows with its content, and the CSS uses logical directions. Then a longer translation and a right-to-left language keep the layout intact.

## Why

- A translated sentence can be 30 to 40% longer than the English one. A fixed width cuts it or makes it overflow.
- In a right-to-left language (Arabic, Hebrew), the start of the line is on the right. A physical property such as `margin-left` stays on the wrong side.

## Signs of violation

- A fixed width on a text container: `width: 96px` on a button, `w-24` on a label.
- A physical direction property in CSS: `margin-left`, `padding-right`, `border-right`, `left: 0`, `text-align: left`.

## How to apply

1. **Room for translation**: the text container grows with the content (flex, grid, padding). Use `min-width` only when the design needs a minimum.
2. **RTL**: use the logical properties (`margin-inline-start`, `padding-inline`, `border-inline-end`, `inset-inline-start`, `text-align: start`). Then the layout flips by itself.
3. **Tailwind**: use the logical utilities (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`, `text-start`).

## Example

```css
/* before */
.save-button { width: 96px; margin-left: 8px; }

/* after */
.save-button { padding-inline: 16px; margin-inline-start: 8px; }
```

## Verification question

With a translation 40% longer and with `dir="rtl"`, does the layout stay intact without a change in the CSS?
