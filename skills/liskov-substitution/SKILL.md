---
name: liskov-substitution
description: L of SOLID, Liskov substitution. Use when several implementations share one contract (interface, base class, function type) and one of them throws "not supported", ignores parameters, changes the return format or forces the caller to check the concrete type.
argument-hint: "[file or scope]"
user-invocable: false
---

# L: Liskov substitution

**Rule**: any implementation of a contract can take the place of another **without the caller noticing**. It accepts the same input, returns the same output format, throws the same possible errors and gives no surprises.

Inheriting or implementing is not about "is a" in the real world (a square is a rectangle). It is about the **behavior** that the code promises.

## Why

- The caller trusts the contract, not the implementation. A change from local storage to S3 changes no caller.
- The contract test runs against all implementations.
- Without this rule, polymorphism becomes `instanceof` checks spread across the code.

## Signs of a violation

- An implementation throws `NotImplemented` or "not supported" for a method of the contract.
- `if (x instanceof Y)` or a concrete type check in the code that consumes the abstraction.
- One implementation requires an extra precondition (it accepts only files up to 5 MB) or delivers less (it returns `null` where the others throw an error).
- An override ignores a parameter or changes the expected side effect.

## How to apply

1. Write the contract explicitly: valid inputs, output, errors.
2. For each implementation, check four things. It accepts at least the same inputs. It returns the same format. It throws only the expected errors. It keeps the invariants.
3. If an implementation does not comply, it does not belong to this contract. Split the contract (`craft:interface-segregation`) or use composition.
4. Run the same contract suite against all implementations.

## Example

```ts
interface Storage {
  put(key: string, content: Buffer): Promise<void>
  get(key: string): Promise<Buffer>
}

// violates: the caller must know that this storage does not write
class ReadOnlyCdnStorage implements Storage {
  async put() { throw new Error('not supported') }
  async get(key: string) { return fetchFromCdn(key) }
}

// fix: separate contracts, each one fully met
interface Reader { get(key: string): Promise<Buffer> }
interface Writer { put(key: string, content: Buffer): Promise<void> }

class CdnReader implements Reader {
  async get(key: string) { return fetchFromCdn(key) }
}
```

A reused contract test:

```ts
for (const [name, make] of [['local', makeLocalStorage], ['s3', makeS3Storage]] as const) {
  test(`${name} returns what it stored`, async () => {
    const storage = make()
    await storage.put('a', Buffer.from('x'))
    assert.deepStrictEqual(await storage.get('a'), Buffer.from('x'))
  })
}
```

## Limits

- This rule applies only where **real substitution** exists: more than one implementation, or a double in a test.
- A difference in performance does not violate the contract, unless the contract promises a time.

## Verification question

If I swap the implementation at the injection point, does a caller need to change or does a contract test fail?
