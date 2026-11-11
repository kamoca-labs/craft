---
name: agent-agnostic-skills
description: skill text names no tool of one harness (AskUserQuestion), it states the rule in generic words
type: feedback
---

A skill or reference must not name a tool of one harness, such as `AskUserQuestion` of Claude Code. State the rule in generic words. Example from `skills/grill/references/round.md` (2026-11-11): "Send the round as plain text in your reply. DO NOT USE A QUESTION TOOL."

**Why:** the user corrected a rule that named `AskUserQuestion`. The skills must stay expandable to other agents and harnesses, and a tool name ties the text to Claude Code.

**How to apply:** before you write a skill or reference, replace each harness tool name with its generic class (a question tool, a task tool). A short, direct rule is enough. Do not add the limits of a specific tool as the reason.
