---
name: style
description: Style mode for a visual-only change (style, layout, spacing, color, responsiveness, element position, animation). Iterates the screen with the user without a Given/When/Then specification or a prior red test, and runs the tests of the touched files at the end. Use when the change does not touch behavior. Behavior goes to craft:atdd.
argument-hint: "<what must change on the screen>"
---

# Style mode

A visual-only change has no rule to test first. The user sees the screen and decides. In this mode, you iterate the screen with the user and check for breakage at the end.

With this skill loaded, the `atdd-first` hook allows only UI components: `.vue`, `.tsx`, `.jsx`, `.svelte` and `.astro`. CSS, SCSS and Less always pass. Service, store, API and back-end stay denied without `craft:atdd`.

## How to proceed

1. **Impeccable**: check whether the `impeccable` skill is in the session skill list.
   - If it is, load `/impeccable` with the `Skill` tool. Follow its guidance for the visual part.
   - If it is not, ask the user to install it and wait for the answer. The official command for Claude Code is `/plugin marketplace add pbakaus/impeccable`. Then the user opens `/plugin` and installs Impeccable from the list. Source: `https://impeccable.style` and the repo `pbakaus/impeccable`.
2. **Iteration**: make the visual change that the user asks for. The user looks at the screen and asks for the next adjustment. Do not write a Given/When/Then specification or a red test first.
3. **Closing**: when the user says the screen is ok, run the filtered tests of the touched files once (component and E2E). This catches a breakage. Do at most one fix round and one confirmation round. Then stop.

## Limit of the mode

Style mode covers only appearance. If the change touches behavior, it leaves style mode and goes to `craft:atdd`. Behavior is:

- a handler (click, submit, change, input)
- a state or a piece of data
- a condition that shows or hides content by rule
- an API call
- a business rule.

## Mixed feature (screen with back-end)

Do not decide the order alone. Ask the user with `AskUserQuestion`, with these options:

- **Back-end first (recommended)**: ATDD covers the contract and the rule. Then style mode iterates the screen with the real data.
- **Screen first**: style mode iterates the screen with fixed data (mock). Then ATDD builds the back-end and replaces the mock with the real data.
- **By slice**: each scenario goes through ATDD. Then the visual part of that scenario goes through style mode, before the next scenario.

In all three cases, logic never enters without a test. The `atdd-first` hook guarantees this.

## Motion: never an abrupt break

The user never sees a jump. Every change on the screen is gradual.

- **Entry and exit animate.** Every element that appears, disappears or changes size animates. It never shows up or vanishes suddenly. Examples: the modal that opens and closes, the item that enters and leaves a list, the panel that expands and collapses, the message that appears.
- **Size changes gradually.** For automatic height, use one of these techniques:
  - `grid-template-rows` from `0fr` to `1fr`
  - `interpolate-size: allow-keywords`, where the browser supports it
  - the View Transitions API.
- **The modal combines two properties.** Animate `opacity` together with `transform: scale` or `translate`.
- **Avoid animating fixed geometry.** Do not animate `top`, `left`, `width` and `height` with a fixed px value when one of the techniques above solves it.
- **Duration and curve:** the duration is between 150 and 300 ms. Entry uses ease-out. Exit uses ease-in. Do not use bounce.
- **Tokens in one place:** the duration and the curve live in tokens (CSS or theme variables), in one file. Do not write a loose value in each component.
- **`prefers-reduced-motion: reduce` is mandatory.** With this preference, the transition is instant or becomes a short fade. The content stays visible and usable.
- **No layout shift on load.** Reserve the space of the content before it arrives. Prefer to reserve the height or to keep the previous content until the new one arrives. The skeleton is only an option to propose to the user. Never use the skeleton as the default.

## Verification

- The user said the screen is ok.
- The change does not touch behavior, or the behavior part went through `craft:atdd`.
- Every element that appears, disappears or changes size animates, and respects `prefers-reduced-motion`.
- The duration and the curve come from the tokens.
- The filtered tests of the touched files pass.
