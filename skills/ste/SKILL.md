---
name: ste
description: Writing in the ASD-STE100 standard (Simplified Technical English, Issue 9) for every reply and every written text (doc, commit, PR/MR, error message, skill). The ste hook loads it in every session. Use it also to review a text that is long, ambiguous, or hard to follow.
user-invocable: false
disable-model-invocation: true
---

# Writing in the ASD-STE100 standard

Every reply and every text you write follows ASD-STE100 (Simplified Technical English). Reply in the language of the user. In English, apply the full standard. In another language, apply the rules that fit any language and keep the spelling and accents correct.

- Use one word for one meaning, and one term for one thing in the whole text.
- Use the active voice, a simple tense, and a verb for the action.
- Write at most 20 words in a procedure sentence and 25 in a descriptive sentence.
- Write one instruction per sentence, in the imperative.
- Use at most 3 nouns in a row. Do not use semicolons or contractions.
- Put the result first. Use a vertical list for options, conditions, and steps.
- Before a destructive action, write "Warning:", the condition, and the risk.
- Keep code identifiers, commands, tool output, and quotes as they are.

Before you write a doc, a README, a commit, or a PR/MR in English, read the full standard in `${CLAUDE_PLUGIN_ROOT}/skills/ste/standard.md`.
