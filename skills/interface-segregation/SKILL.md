---
name: interface-segregation
description: I of SOLID, interface segregation. Use when a function, class or component receives a large type, object or props and uses only a fraction of it, or when an interface forces implementations to provide methods that make no sense for them.
argument-hint: "[file or scope]"
user-invocable: false
---

# I: interface segregation

**Rule**: nobody depends on what it does not use. Interfaces, parameter types and props are **small and focused** on what the consumer needs, not on what the producer has.

## Why

- A change to a field that you do not use does not force you to recompile, re-test or adjust mocks.
- The test is cheap: the double has two fields, not thirty.
- The signature documents exactly what the function depends on.
- Implementations do not need to fake methods (see `craft:liskov-substitution`).

## Signs of a violation

- A function receives a whole `user: User` and reads only `user.email`.
- A component receives the whole API object as a prop.
- A test mock uses `as unknown as Service` or has many irrelevant fields.
- An interface has methods that some implementations leave empty or make throw an error.

## How to apply

1. For each consumer, list what it really reads or calls.
2. Declare the parameter type with only that (`Pick<User, 'email'>`, a dedicated type, or the primitive value).
3. A large interface with different consumers becomes small interfaces by role. A consumer that needs several combines them (`Reader & Writer`).

## Example

```ts
// before: the test must build a full User
function sendWelcome(user: User) {
  return mailer.send(user.email, `Hello, ${user.name}`)
}

// after: it depends only on what it reads
function sendWelcome(recipient: Pick<User, 'email' | 'name'>) {
  return mailer.send(recipient.email, `Hello, ${recipient.name}`)
}
```

In a component:

```vue
<!-- before: <UserBadge :user="user" /> that uses only the name and the photo -->
<UserBadge :name="user.name" :avatar-url="user.avatarUrl" />
```

## Limits

- Do not create one interface per method. If all consumers use the same three methods, use one interface.
- Passing the whole object is acceptable when the function **is** about that entity as a whole (serialize, validate the `User`).

## Verification question

Does the test double of this consumer have a field that the code never reads?
