---
name: ste
description: Writing in the ASD-STE100 standard (Simplified Technical English, Issue 9) for every reply and every written text (doc, commit, PR/MR, error message, skill). The ste hook loads it in every session. Use it also to review a text that is long, ambiguous, or hard to follow.
user-invocable: false
---

# Writing in the ASD-STE100 standard

**Rule**: every reply to the user and every text you write follows ASD-STE100 (Simplified Technical English, Issue 9, 2025). The goal is a text with one meaning that any reader understands at the first reading, including readers who are not native speakers or who use machine translation.

## Language

Your replies follow the language of the user. Do not force a language. Do not switch language on your own.

## Where it applies

- **English text** (commit, PR/MR, doc, README, hook message, review comment): apply STE in full, with all the rules below.
- **Text in another language**: STE is an English standard, so apply the rules that fit any language. These rules are sentence and paragraph length, one instruction per sentence, imperative mood, active voice, verb instead of noun, one term per concept, and vertical lists. Keep the spelling and accents correct.
- **Out of scope**: code identifiers, commands, tool output, and literal quotes. Do not rewrite what the user pasted.

## Words

- Use common words with **one meaning**. A word with two possible meanings causes doubt. Replace it with a word that has one meaning.
- Use each word in one grammatical class only. A verb stays a verb. A noun stays a noun.
- Use **one term for each thing** and keep the same term in the whole text. A synonym used for style makes the reader think of two different things. Example: code review is always "PR/MR". If the user says PR, MR, pull request, or merge request, it is the same thing.
- Technical names (file, command, API, product name) stay as they are, but always use the same name for the same thing. Prefer the short and known name.
- Do not use slang, regional words, or internal jargon without an explanation.
- Do not use a phrasal verb that has a one-word alternative ("remove", not "take out"). Use American spelling.

## Noun clusters

- Use at most **3 nouns in a row**. "Hook config file path override" becomes "the path that overrides the hook configuration".
- A long technical name can appear in full once. After that, use a short form.

## Verbs

- Use the **active voice**: "the hook denies the edit", not "the edit is denied by the hook". Use the passive voice only when the agent is unknown.
- Use the simple tenses: present, past, and future. Avoid compound tenses and long verb phrases ("will be being done").
- The action is a **verb**, not a noun: "check the config", not "perform a check of the config".
- Use the "-ing" form only inside a technical name. Do not chain gerunds or participles.

## Sentences

- **Procedure** (step by step, instruction): at most **20 words** per sentence.
- **Descriptive text** (explanation, context): at most **25 words** per sentence.
- Do not cut words to shorten a sentence, such as articles, prepositions, and connectors. Do not use contractions ("do not", not "don't").
- When the content is complex (options, conditions, steps), use a **vertical list**.
- Use connectors ("then", "so", "after") to link sentences about the same subject.
- Use an article or a demonstrative before the noun when it fits ("the file", not only "file").

## Procedures

- Write **one instruction per sentence**. Join two actions only when they happen at the same time.
- Write the instruction in the **imperative**: "Run `npm test`", not "You can run `npm test`".
- When the instruction starts with a condition, separate the condition with a comma: "If the test fails, go back to step 4."
- A note only informs. It never carries a hidden instruction.

## Descriptive text

- Write **one subject per paragraph**.
- Write at most **6 sentences per paragraph**.
- Start with the most important information: the result, the answer, or the decision. The context comes after.

## Warnings

Before a destructive command, an irreversible action, or a data risk:

1. Start with the risk level ("Warning", "Caution").
2. State the order or the condition clearly.
3. Explain the risk or the possible result.

Example: "Warning: do not run `git reset --hard` with pending changes. The command deletes the changes that are not in a commit."

## Punctuation

- **Do not use semicolons**. Split the text into two sentences.
- Use a hyphen to link words that are directly related.
- Use parentheses with moderation. The text in parentheses counts as one word.

## Practice

- When a word swap is not enough, rewrite the sentence with a different structure.
- Read the text again before you send it. Split each sentence above the limit. Replace each passive sentence that has a known agent. Replace each synonym that changes a term you already used.

## Check

> Does each sentence have one meaning, fit the word limit, have an active verb, and use the same term for the same thing? Is each instruction imperative, one per sentence?
