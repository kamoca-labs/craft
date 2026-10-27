---
name: unit-tests
description: Unit, component and integration tests cover the business rule and its edge cases through the public interface. Use when you write or review a test that checks a private method, mocks everything, tests a getter, constant, framework or library, checks a CSS class or a large snapshot, or repeats the same case with similar values.
argument-hint: "[file or scope]"
user-invocable: false
---

# Unit, component and integration cover the rule

**Rule**: these tests cover the **business rule** and its **edge cases**, through the **public interface**. Use the lowest level that catches the bug. Test what the rule decides, not how the code is written.

## Why

- These are the fast tests of the suite. For this reason, the edge cases stay here, not in E2E (`craft:e2e-tests`).
- A test tied to the implementation breaks on every refactor. Then the refactor stops happening.
- A test of something that cannot break (getter, constant, the library) costs maintenance and catches no bug.

## Which level

| Level | What it covers | Boundary |
|---|---|---|
| Unit | function or class with a rule: calculation, validation, decision, conversion | no I/O. Clock and randomness are injected |
| Component (front end) | what the component shows and what it does when the user interacts | renders and interacts like the user (Testing Library), no network |
| Integration | the module with its real boundary: HTTP route of the app itself, test database, queue | mock only third-party services |

Choose the lowest level that catches the bug. Move up a level only when the bug lives in the link between the parts.

## Signs of violation

- Test of a private method, or `as any` and reflection to reach it.
- Mock of everything: the test verifies that one mock called another mock.
- `expect(repo.save).toHaveBeenCalledWith(...)` when the saved state or the return value is enough.
- Test of a getter, setter, constant, a type that the compiler already checks, or of the framework and the library.
- In the component: assert on a CSS class, style, `hover`, or a snapshot of the whole markup.
- Ten cases with similar values that go through the same path of the rule.
- Unit test that starts a database or makes a real request.

## How to apply

1. **Public interface**: call what the production code calls. If a private method needs its own test, it wants to be a separate unit (`craft:single-responsibility`).
2. **Assert on the result**: return value, persisted state, HTTP response, what appears on the screen of the component.
3. **Mock only at the boundary you do not control**: external network, clock, randomness (`craft:dependency-inversion`). In integration, use the real test database.
4. **Edge cases by the rule, not by a list of values**:
   - one case for each equivalence class (valid, invalid, empty)
   - one case at each limit that the rule has (`10 MB` passes, `10 MB + 1 byte` fails)
   - no case for a limit that the rule does not have
   - to find the classes, go through the [real-world edges](../atdd/SKILL.md#real-world-edges) of `craft:atdd`. Each edge that the rule treats differently is a class. An edge that the rule does not treat gets no case.
5. **Component like the user**: find the element with `getByTestId` (`craft:test-ids`). Verify what appears and the event that leaves, not the appearance.
6. **Do not test what cannot break**: getter, constant, the library, the type.

## Example

```ts
// before: test tied to the implementation
test('upload', async () => {
  const repo = { save: vi.fn() }
  const service = new UploadService(repo)
  service['validateSize'](11 * MB)
  expect(repo.save).not.toHaveBeenCalled()
})

// after: rule through the public interface, one case at each limit
test('attachment of 10 MB is accepted', async () => {
  const result = await uploadAttachment(makeFile({ size: 10 * MB }))

  expect(result.ok).toBe(true)
})

test('attachment above 10 MB is rejected', async () => {
  const result = await uploadAttachment(makeFile({ size: 10 * MB + 1 }))

  expect(result.error).toBe('attachment.tooLarge')
})
```

## Limits

- A contract test across implementations (`craft:liskov-substitution`) can call each concrete implementation.
- A mock of an internal collaborator is acceptable when the collaborator is slow or not deterministic and there is no boundary to inject. Record the reason in the name of the double (`slowPdfRendererStub`).
- A small and stable snapshot (an output JSON, an error message) is acceptable. A snapshot of the whole markup is not.

## Verification question

If I rewrite the code inside without changing the rule, does any of these tests break? If one breaks, it tests the implementation.
