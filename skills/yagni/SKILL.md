---
name: yagni
description: YAGNI (you aren't gonna need it). Use when code has a parameter, option, flag, config, layer, abstraction, extension hook or handled case that no current use exercises, or that was written "for when we need it".
argument-hint: "[file or scope]"
user-invocable: false
---

# YAGNI: you aren't gonna need it

**Rule**: **less code is better than more code**. Write only what a **test or a current use** requires. Add no option, layer, generalization or handled case "for the future". The future writes its own code, with information that you do not have today.

## Why

- Speculative code has a cost today (read, test, maintain) and a benefit that may never come.
- The prediction almost always gets the shape wrong. When the real need arrives, the early abstraction gets in the way.
- Unused code is not really tested, so it rots.

## Signs of a violation

- A parameter that always has the same value, or that nobody passes.
- A config or environment variable for something that never changes.
- An interface with only one implementation and no test double.
- A base class with one subclass.
- A `// TODO: support X in the future` with a structure already built for X.
- A code branch that no test covers and no real flow reaches.

## How to apply

1. For each option, parameter or layer, look for the current use (grep). If there is no use, remove it.
2. A parameter with a fixed value becomes an internal constant.
3. An abstraction with one implementation becomes the direct implementation.
4. Dead code goes away. Git remembers it if you ever need it.

## Example

```ts
// before: options that nobody uses
function formatPrice(value: number, options: { currency?: string, locale?: string, decimals?: number } = {}) {
  const { currency = 'USD', locale = 'en-US', decimals = 2 } = options
  return value.toLocaleString(locale, { style: 'currency', currency, minimumFractionDigits: decimals })
}

// after: the system only uses US dollars
function formatPrice(value: number) {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}
```

## Limits

- YAGNI does not apply to: input validation at a boundary, error handling that prevents data loss, security, accessibility. These are current needs, even if no test asks for them.
- An I/O boundary with a test double is already a "current use" of an abstraction (see `craft:dependency-inversion`).
- Reusable generic code (`craft:dry`) is not configurable. It does not gain an option, parameter or mode for an imagined use.
- A decision that is expensive to reverse (database schema, public API contract) deserves thought about the near future. Internal code does not.

## Verification question

If I delete this, does a test fail or does a real flow break? If not, delete it.
