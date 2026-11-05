# Write the change

- Before you edit, read the code the change touches and search every caller. Fix a bug once, in the shared code that the callers use.
- Keep the public signature of a function that has callers. Inject a new dependency (a clock, a sleep, a fetch) without breaking the callers: where the module already receives its dependencies, or as an optional last parameter.
- Never edit an existing test to fit the change. A failing existing test shows a caller that the change broke. Change a test only when the request changes the behavior that it describes.
- Check the inputs that break the rule: zero, empty, negative, the limit value, a duplicate, two calls at the same time. Reject with an error only an input that the rule cannot compute, never with a silent wrong result. Accept every common form of a valid value (upper case, spaces).
- Write the smallest complete change. Add no option, abstraction, or code for later that nobody asked for. Add the fewest tests that prove the change: one per rule or edge, never the same case twice.
- Test behavior: a rule, a branch, a parser, money, security, a contract. A visual-only change (style, color, spacing, layout, animation, decorative markup) gets no test: review the rendered screen (design:style). A text, a rename, or a config value gets no new test.
- Run the tests once per step: the red run of the new test, then the green run after the code. Do not run the suite before the change only to see it pass, except before a refactor, which needs it green before and after. Do not run it again to read another part of the output.
