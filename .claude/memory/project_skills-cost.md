---
name: skills-cost
description: Cut the tokens that craft adds per session and per request; plan and item status in SKILLS-COST.md
type: project
---

On 2026-11-11 the user started a plan to cut the token cost of craft (hook rules, skill bodies, memory catalog). The plan, the measured state and the items are in `SKILLS-COST.md`. It continues `SKILLS-ARCHITECTURE.md`, which cut the skill listing.

**Why:** the listing is already small (5 skills, 1,284 characters). The cost now comes from the SessionStart rules (about 8.6 KB), the memory catalog (up to 10 KB) and the `craft:craft` body (9.7 KB) that loads on every implementation request.

On 2026-11-11 the user changed the direction: craft becomes an opt-in engineer toolkit, the SessionStart injections stop, ATDD becomes a reference of `craft:craft`, `plan` and `grill` merge into `craft:plan` (Elephant-Goldfish pattern of Google EGM: close every gap, write a linear activity, a fresh subagent reviews it; Goldfish on Haiku, Elephant on Sonnet), `craft:craft` executes with ATDD and the principles, no `craft:refactor` for now, and the `bench/` run is no longer required.

**How to apply:** the user decides each item. Do one approved item at a time, update its status and the log in `SKILLS-COST.md`.
