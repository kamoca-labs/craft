# When a project hook denies

Every finding of a hook falls into one of three cases:

| Case | What to do |
|---|---|
| Real problem | Fix what the hook pointed at. |
| False positive with evidence | Record the narrowest possible exception in the repo, with the reason. State the exception in the reply. |
| Doubt | Leave the finding standing. Ask the user once, in one line. |

- Evidence is a fact you can cite: a test fixture, an intentional example in the docs, a choice the user already confirmed.
- The reason follows the format `"<who decided>: <evidence>"`. Example: `"user confirmed: the seed uses city names in another language"`.
- Write "user confirmed" only when the user really confirmed.
- The narrowest exception covers one value, one line or one path. A wide exception (whole file, whole rule) needs a request from the user.
- Never use an exception to force through a denied edit.
- Record the exception where the rule already accepts one (a list in the rule itself), with a test of the allowed case. The reason goes in the body of the commit.

This skill is a policy, not a mechanism. Do not create new code only to record exceptions.
