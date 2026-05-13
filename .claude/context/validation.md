# Validation

This document defines an implementation policy for **component validation**, then illustrates how specifications are implemented by applying this policy.

This document is intentionally **validation** only, but part of a set of implementation policies which together defines the policies which should be followed to transform specifications into an implementation which is predictable, maintainable, and production-ready at scale.

---

# How to Read This Policy

Rules in this policy fall into three strengths. Read each rule with its strength in mind:

- **Principles** are non-negotiable. They derive from framework correctness or TDD discipline and hold for every component. A conflict with a principle is a defect.
- **Templates** are invariant skeletons with explicit variation points. The skeleton applies to every component; specific steps activate or deactivate based on the component's declared classification (e.g., attribute-backed vs non-attribute, readonly vs writable, payload-bearing vs payload-free). Variation is part of the template, not a deviation from it.
- **Conventions** are canonical defaults that keep implementations readable across components. A second component may deviate when its shape genuinely warrants it; the deviation should be explained at review time, not forbidden by the policy.

When applying this policy to a new component, classify each rule before reconciling conflicts. A conflict with a principle is a defect; a conflict with a template means a variation point needs to be made explicit; a conflict with a convention is a documented deviation.

---

# 1) Validation Must Be Implemented in a Dedicated File

All validation logic for a component must live in a single dedicated file: `<component>.validation.ts`.

Policy:

- validation logic must not be inlined in `<component>.ts`
- validation logic must not be defined in `<component>.meta.ts`
- `<component>.validation.ts` is the authoritative location for all validation logic in the component

This separation gives each file a single clear responsibility:

- `<component>.meta.ts` declares value domains
- `<component>.validation.ts` enforces value domains
- `<component>.ts` invokes validation inside the mutation path

# Template Variation Points

Validators vary by the shape of the value domain they enforce:

- **String-enum value domains** — use the `Object.values(Domain).includes(value as Domain)` membership check (Section 6). The validator accepts `string` and returns the narrowed enum type. This is the most common case and is illustrated by the examples in this document.
- **Structured-object value domains** — validate each declared field according to its declared type and constraints (see the data policy for the `Metadata` example). The validator accepts the structured input and returns the narrowed structured type.
- **Scalar value domains** (numbers, booleans, UUIDs, timestamps) — use the shape check appropriate to the type. For booleans, the membership check is structurally consistent with enums but serves primarily as type narrowing rather than runtime guard.

The dedicated-file rule (Section 1), the `Validate`-class structure (Sections 2–4), the metadata-sourced domain rule (Section 4), the throw-on-invalid rule (Section 7), the canonical error format (Section 8), and the mutation-path placement (Section 10) are invariant across all value-domain shapes.

# 2) All Validators Belong to a Single Exported Class Named `Validate`

All validation methods for a component must be defined as members of a single exported class.

Policy:

- the class name must always be `Validate`
- the class must be exported from `<component>.validation.ts`
- all validators for the component must belong to this single class
- the class must not contain non-validation logic

Example:

```typescript
export class Validate {
  public static visibility = (value: string) => { ... };
  public static status = (value: string) => { ... };
}
```

# 3) Validators Must Be Public Static Arrow Function Class Properties

Each validator must be defined as a `public static` arrow function class property on the `Validate` class.

Policy:

- validators must be `public` — they are invoked from `<component>.ts`
- validators must be `static` — they are called on the class directly, without instantiation
- validators must be defined as arrow function class properties — consistent with the implementation pattern used across operations and handlers
- validators must not be prototype methods

Example:

```typescript
export class Validate {
  public static visibility = (value: string) => {
    ...
  };
}
```

# 4) Validators Must Source Their Domain from Metadata

Validators enforce the value domains declared in `<component>.meta.ts`. They must not define allowed values independently.

Policy:

- validators must import the relevant value domain objects from `<component>.meta.ts`
- the set of valid values is derived from the imported metadata, not from hardcoded literals inside `<component>.validation.ts`
- `<component>.meta.ts` is the single source of truth for allowed values
- if the allowed values change in metadata, validation must reflect that change automatically

Example:

```typescript
import { Visibility, Status } from "./pin.meta.js";

export class Validate {
  public static visibility = (value: string) => {
    const valid = Object.values(Visibility).includes(value as Visibility);
    ...
  };
}
```

# 5) Validator Signature Must Accept the Raw Input Type and Return the Narrowed Type

The input type of a validator must reflect the raw, unnarrowed value that arrives at the validation boundary.

The return type must be the narrowed TypeScript type defined by the corresponding value domain in metadata.

Policy:

- for string-based enum value domains, the input type is `string`
- the return type is the TypeScript domain type (e.g., `Visibility`, `Status`)
- on valid input, the validator returns the value cast to the narrowed type
- on invalid input, the validator throws — it must not return a fallback or a default value

Example:

```typescript
public static visibility = (value: string) => {
  const valid = Object.values(Visibility).includes(value as Visibility);
  if (!valid) throw new Error(`Invalid visibility value: ${value}`);
  return value as Visibility;
};
```

The validator bridges from the unnarrowed boundary type to the narrowed domain type — or throws. There is no third path.

# 6) Validation Logic Must Use the Enum Membership Pattern

For string-based enum value domains, validation must test membership using `Object.values`.

Policy:

- use `Object.values(Domain).includes(value as Domain)` to test whether the input is a member of the declared value domain
- this pattern derives valid values directly from the metadata object — it does not maintain a separate list
- if the input is not a member, the validator must reject it
- alternative checking strategies may be used only for non-string or non-enum domains

Example:

```typescript
const valid = Object.values(Visibility).includes(value as Visibility);
if (!valid) {
  throw new Error(`Invalid visibility value: ${value}`);
}
return value as Visibility;
```

# 7) Invalid Input Must Throw a Descriptive Error

When a value fails validation, the validator must throw.

Policy:

- the validator must throw a `new Error(...)` on invalid input
- the validator must not return a fallback value on invalid input
- the validator must not silently ignore invalid input
- the thrown error must carry a message that identifies what was invalid and what was received

# 8) Error Messages Must Follow a Canonical Format

The error message thrown by a validator must follow this format:

```
Invalid {name} value: {value}
```

Where:

- `{name}` is the camelCase canonical name of the validated property as declared in the specification
- `{value}` is the actual received value, interpolated at runtime using a template literal

Policy:

- every validator in the component must use this format consistently
- the property name in the message must match the canonical name from the specification
- the received value must always be included in the message

Example:

```typescript
throw new Error(`Invalid visibility value: ${value}`);
throw new Error(`Invalid status value: ${value}`);
```

# 9) Validation Scope Covers Publicly Writable Constructs

The `Validate` class must define validators for every publicly writable state or data property that accepts external input and has a finite value domain.

Policy:

- every publicly writable state property with a finite value domain must have a corresponding validator in `Validate`
- every publicly writable data property with a finite value domain must have a corresponding validator in `Validate`
- readonly state that is only mutated internally does not require a validator in `Validate`
- internally generated values (e.g., UUIDs, timestamps) do not require validation in `Validate`
- the count of validators in `Validate` must equal the count of publicly writable constructs that require boundary enforcement

# 10) Validators Are Invoked Inside the Authoritative Mutation Path

Validators are called by `<component>.ts` inside the public setter of each validated construct. They are not called at the gesture or operation layer.

Policy:

- validation must be invoked inside the setter — the authoritative mutation path
- validation is the second step of the mutation order, after normalization and before the guard: **Normalize → Validate → Guard → Mutate**
- the return value of the validator — the narrowed typed value — must replace the raw input for the remainder of the mutation path
- if validation throws, the mutation path must not proceed past that point
- gesture handlers and operations must not invoke validators directly — they route through the setter which owns validation

The mutation order is defined authoritatively in the state policy. The validation policy governs the implementation of the validator itself, not the order it is called in.

Example showing the validator's position in the mutation path:

```typescript
public set visibility(value: Visibility) {
  // Normalize
  value = value ?? Visibility.VISIBLE;

  // Validate — narrowed return value replaces the raw input
  value = Validate.visibility(value);

  // Guard
  if (this._visibility === value) return;

  // Mutate
  this._visibility = value;
  ...
}
```

---

# Policy Applied to Specification

The Pin component declares two publicly writable state properties — `visibility` and `status` — both with string-based enum value domains declared in `pin.meta.ts`. Both require boundary enforcement at the public mutation path.

`pin.meta.ts` — value domain declarations:

```typescript
export const Visibility = {
  VISIBLE: "visible",
  HIDDEN: "hidden",
} as const;

export type Visibility = (typeof Visibility)[keyof typeof Visibility];

export const Status = {
  PINNED: "pinned",
  UNPINNED: "unpinned",
} as const;

export type Status = (typeof Status)[keyof typeof Status];
```

`pin.validation.ts` — the full implementation:

```typescript
import { Visibility, Status } from "./pin.meta.js";

export class Validate {
  public static visibility = (value: string) => {
    const valid = Object.values(Visibility).includes(value as Visibility);
    if (!valid) {
      throw new Error(`Invalid visibility value: ${value}`);
    }
    return value as Visibility;
  };

  public static status = (value: string) => {
    const valid = Object.values(Status).includes(value as Status);
    if (!valid) {
      throw new Error(`Invalid status value: ${value}`);
    }
    return value as Status;
  };
}
```

How the policy is applied:

- all validation lives in `pin.validation.ts` — not in `pin.ts` or `pin.meta.ts`
- a single exported `Validate` class contains both validators
- both validators are `public static` arrow function class properties
- both import their value domains from `pin.meta.ts` — no allowed values are hardcoded in `pin.validation.ts`
- both accept `string` as the raw input type and return the narrowed metadata type on success
- both use `Object.values(Domain).includes(value as Domain)` for membership checking
- both throw `new Error(...)` on invalid input — no fallback is returned
- both use the canonical error format: `` `Invalid {name} value: ${value}` ``
- `Validate` has exactly two methods because there are exactly two publicly writable state properties; readonly or internally-generated values are not covered

Invocation in `pin.ts`:

```typescript
// visibility setter — optional attribute-backed, writable
public set visibility(value: Visibility) {
  value = value ?? Visibility.VISIBLE;     // Normalize
  value = Validate.visibility(value);      // Validate
  if (this._visibility === value) return;  // Guard
  this._visibility = value;               // Mutate
  ...
}

// status setter — compulsory attribute-backed, writable
public set status(value: Status) {
  value = Validate.status(value);          // Validate (no normalization step)
  if (this._status === value) return;      // Guard
  this._status = value;                   // Mutate
  ...
}
```

- `Validate.visibility` is called after normalization because the optional setter must first convert `null` (passed by `attributeChangedCallback` on attribute removal) to the default before validation can safely proceed
- `Validate.status` is called as the first step because the compulsory setter has no normalization step — `null` is not a valid status value and must be rejected by validation
- in both cases the narrowed return value replaces the raw input before the guard check

---

# Policy Checklist

A compliant component must:

1. Implement all validation logic in `<component>.validation.ts`.
2. Not inline validation logic in `<component>.ts` or `<component>.meta.ts`.
3. Export a single class named `Validate` from `<component>.validation.ts`.
4. Define all validators as members of the `Validate` class with no non-validation logic in the class.
5. Define each validator as a `public static` arrow function class property.
6. Import value domain objects from `<component>.meta.ts` — do not hardcode allowed values in validators.
7. Use `Object.values(Domain).includes(value as Domain)` for string-based enum membership checking.
8. Accept the raw unnarrowed input type (typically `string` for string-based enum domains).
9. Return the narrowed TypeScript domain type on valid input.
10. Throw `new Error(...)` on invalid input — do not return a fallback or a default value.
11. Use the canonical error message format: `` `Invalid {name} value: ${value}` ``.
12. Use the camelCase canonical property name in the error message.
13. Include the actual received value in the error message.
14. Define a validator for every publicly writable state or data property with a finite value domain.
15. Do not define validators in `Validate` for readonly state that is only internally mutated.
16. Do not define validators in `Validate` for internally generated values.
17. Invoke validators inside the public setter — the authoritative mutation path — not in gesture handlers or operations.
18. Call the validator as the second step of the mutation path: after normalization, before the guard.
19. Replace the raw input with the narrowed return value of the validator for the remainder of the mutation path.
20. Ensure that if validation throws, mutation does not proceed.
