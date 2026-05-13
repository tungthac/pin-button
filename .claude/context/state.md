# State

This document defines an implementation policy for **component state**, then illustrates how specifications are implemented by applying this policy.

This document is intentionally **state** only, but part of a set of implementation policies which together defines the policies which should be followed to transform specifications into an implementation which is predictable, maintainable, and production-ready at scale.

---

# How to Read This Policy

Rules in this policy fall into three strengths. Read each rule with its strength in mind:

- **Principles** are non-negotiable. They derive from framework correctness or TDD discipline and hold for every component. A conflict with a principle is a defect.
- **Templates** are invariant skeletons with explicit variation points. The skeleton applies to every component; specific steps activate or deactivate based on the component's declared classification (e.g., attribute-backed vs non-attribute, readonly vs writable, payload-bearing vs payload-free). Variation is part of the template, not a deviation from it.
- **Conventions** are canonical defaults that keep implementations readable across components. A second component may deviate when its shape genuinely warrants it; the deviation should be explained at review time, not forbidden by the policy.

When applying this policy to a new component, classify each rule before reconciling conflicts. A conflict with a principle is a defect; a conflict with a template means a variation point needs to be made explicit; a conflict with a convention is a documented deviation.

---

## 1) State Contract Must Be Declared in Specification

Each component specification must declare its state contract under `States`.

`States` must be an object whose property names are the canonical state names.

Each state definition must include:

- `type`
- `description`
- `values`
- `default`
- `readonly`

A state definition may also include:

- `attribute`

If `attribute` is present, it must include:

- `optional`

Interpretation:

- if `attribute` is present, the state is attribute-backed
- if `attribute.optional = true`, the attribute-backed state is optional
- if `attribute.optional = false`, the attribute-backed state is compulsory
- if `attribute` is absent, the state is non-attribute state
- `readonly` applies to all state, regardless of whether it is attribute-backed

## Template Variation Points

The classification of each declared state determines which sub-rules of this policy activate when it is implemented:

- **`attribute` present, `attribute.optional: true`** — activates implicit-default initialization (Section 5.1), optional attribute reflection (Section 5.2), and null normalization in the mutation path (Section 7).
- **`attribute` present, `attribute.optional: false`** — activates explicit-default materialization (Section 5.1) and compulsory attribute reflection (Section 5.2). Null normalization does not apply.
- **`attribute` absent** — Sections 3–7 do not apply. The state participates only in the non-attribute access contract (Section 8).
- **`readonly: false`** — activates the public setter and the writable mutation path. If attribute-backed, the state participates in declarative mutation via `_attributeHandlers` (Section 6).
- **`readonly: true`** — no public setter; if attribute-backed, declarative mutation is intercepted to restore the canonical value (Section 9.2). Internal mutation only.

These are declared variation points of the template. A state whose classification activates a combination not described here is a signal that this list needs to be extended, not that the state deviates from the template.

## 2) State Model Must Be Explicit

This framework distinguishes:

- `Attributes`: the set of state keys that are DOM attribute-backed
- `State`: the set of all state keys known to the component

Policy:

- All `Attributes` are state.
- Not all state is attribute-backed.

### 2.1) State Value Domains Must Be Defined in Metadata

For every state declared in the specification, the implementation must define corresponding metadata in `<component>.meta.ts`.

This metadata serves two distinct purposes:

- state keys
- state value domains

Policy:

- Every attribute-backed state must have:
  - a key in `Attributes`
  - a key in `State`
  - a corresponding value-domain definition
- Every non-attribute state must have:
  - a key in `State`
  - a corresponding value-domain definition

Where:

- `Attributes` contains only attribute-backed state keys
- `State` contains all state keys known to the component
- value-domain definitions declare the allowed runtime values for each state

State key metadata pattern:

```typescript
export const Attributes = {
  VISIBILITY: "visibility",
  STATUS: "status",
} as const;

export type Attributes = typeof Attributes;

export const State = {
  ...Attributes,
  LOCKED: "locked",
  PERSISTED: "persisted",
} as const;

export type State = (typeof State)[keyof typeof State];
```

Note: `type Attributes = typeof Attributes` exports the object shape — useful for typing the static `Attributes` getter on the component class. `type State = (typeof State)[keyof typeof State]` exports a union of all state values — useful for constraining which strings are valid state identifiers. These different shapes are intentional and serve different purposes.

Attribute value-domain metadata pattern:

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

Non-attribute value-domain metadata pattern:

```typescript
export const Locked = {
  TRUE: true,
  FALSE: false,
} as const;

export type Locked = (typeof Locked)[keyof typeof Locked];

export type Timestamp = number;
export const Persisted = {
  NONE: null,
} as const;

export type Persisted = Timestamp | (typeof Persisted)[keyof typeof Persisted];
```

Note: For boolean value domains such as `Locked`, `Object.values(Locked).includes(value as Locked)` is always true for any runtime boolean. The validation check is structurally consistent with other domains but serves primarily as a type narrowing mechanism rather than a runtime guard against invalid input.

### 2.2) State Validation Must Be Implemented in `<component>.validation.ts`

For every state declared in the specification, the implementation must define validation logic in `<component>.validation.ts`.

This validation serves as the runtime enforcement layer for the value domains declared in `<component>.meta.ts`.

Policy:

- Validation logic for state must be implemented in `<component>.validation.ts`
- Validation must enforce the allowed runtime values defined by the state value-domain metadata in `<component>.meta.ts`
- Public writable mutation paths must call validation before mutation proceeds
- If validation fails, mutation must not proceed
- Validation functions should return the validated value in its narrowed runtime type

Example:

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

This makes the contract explicit:

- `<component>.meta.ts` defines the domain
- `<component>.validation.ts` enforces the domain
- `<component>.ts` uses validation in the mutation path

## 3) Attribute Observation Must Be Contract-Driven

Attribute-backed state is observed through the base `Component` contract.

In this framework, the base component defines attribute observation as follows:

```typescript
public static get observedAttributes(): string[] {
  return Object.values(this.Attributes);
}

attributeChangedCallback(name: string, oldValue: any, newValue: any) {
  const handler = this._attributeHandlers[name];
  handler && handler(newValue);
}
```

Policy:

- Only state keys declared in `Attributes` participate in DOM attribute observation.
- Only specification states with an `attribute` contract may be declared in `Attributes`.
- Observed attribute changes must be routed through `_attributeHandlers`.
- If a state is not declared in `Attributes`, it is not observed by `attributeChangedCallback`.

Note: When a component is parsed from HTML with attributes already present (e.g., `<pin-button status="pinned">`), `attributeChangedCallback` fires before `connectedCallback`. These attribute changes are routed through `_attributeHandlers` → setter. When `_initialize` subsequently runs, it finds the attribute already present and does not overwrite it. External attributes set at parse time are therefore handled by the existing `_attributeHandlers` path, not by `_initialize`.

## 4) Attribute-Backed State Must Be Classified

Every attribute-backed state must be classified as exactly one of:

- **Optional** (`attribute.optional = true`)
- **Compulsory** (`attribute.optional = false`)

This classification determines how the state is represented in the DOM and how missing attributes are handled.

## 5) Default Representation Policy Must Match Attribute Classification

The classification of an attribute-backed state as **optional** or **compulsory** determines two implementation behaviors:

1. how missing attributes are handled during initialization
2. how state is reflected back into the DOM during mutation


### 5.1) Initialization Policy Must Match Attribute Classification

- **Optional**: implicit default  
  The attribute may be absent. Initialization must not force materialization of the default attribute.

- **Compulsory**: explicit representation  
  The attribute must always have an explicit DOM representation. If missing, it must be materialized in `_initialize`.

```typescript
private _status: Status = Status.UNPINNED;

protected _initialize = () => {
  !this.hasAttribute(Attributes.STATUS) &&
    this.setAttribute(Attributes.STATUS, this._status);
};
```


### 5.2) Attribute Reflection Policy Must Match Attribute Classification

- **Optional**: default may be represented by attribute absence  
  The setter must manage both the state value and the presence of the attribute. Assigning the default removes the attribute. Because attribute absence corresponds to the default state, nullish incoming values must be normalized to the default before reflection. Assigning the default may remove the attribute.

```typescript
public set visibility(visibility: Visibility) {
  visibility = visibility ?? Visibility.VISIBLE;

  visibility = Validate.visibility(visibility);

  if (this._visibility === visibility) return;

  this._visibility = visibility;

  visibility === Visibility.VISIBLE && this.removeAttribute(Attributes.VISIBILITY);
  visibility === Visibility.HIDDEN && this.setAttribute(Attributes.VISIBILITY, visibility);
}
```

- **Compulsory**: current value must always be explicit  
  The setter must always reflect the current value into the DOM using `setAttribute(...)`.

```typescript
public set status(status: Status) {
  status = Validate.status(status);

  if (this._status === status) return;

  this._status = status;
  this.setAttribute(Attributes.STATUS, status);
}
```


## 6) Mutation Entry Styles Must Converge on the Public Mutation Path

Attribute-backed writable state has two entry styles:  
  
- **Imperative**: direct setter assignment  
- **Declarative**: DOM attribute changes routed through `_attributeHandlers`

```typescript
protected _attributeHandlers = {
  [Attributes.VISIBILITY]: (value: Visibility) => (this.visibility = value),
  [Attributes.STATUS]: (value: Status) => (this.status = value),
};
```

`_attributeHandlers` are only for declarative mutation. The setter is the single unification point for writable attribute-backed state.

For readonly attribute-backed state, declarative mutation must still be intercepted in `_attributeHandlers`, but it must not become authoritative. Instead, the implementation must restore the canonical internally owned value. See Section 9.2 for the readonly interceptor pattern.

## 7) Public Mutation Order Must Be Normalize → Validate → Guard → Mutate

For writable state, the public mutation path must follow this order:

1. **Normalize**
2. **Validate**
3. **Guard**
4. **Mutate**

Validation must be performed by logic defined in `<component>.validation.ts`, against the value-domain metadata defined in `<component>.meta.ts`. If the normalized value is invalid, validation must fail and the mutation must not proceed.

A mutation path may omit phases that are not needed for a given state, but the order of any phases that are used must remain Normalize → Validate → Guard → Mutate.

Note: The normalization step for optional attribute-backed state handles a specific platform behavior: `attributeChangedCallback` passes `null` as the new value when an attribute is removed from the DOM. Without normalization, this `null` would reach validation and throw. Normalization ensures attribute removal is treated as equivalent to assigning the default value. Use `??` (nullish coalescing) rather than `||` (logical OR) so that only `null` and `undefined` are normalized — any other invalid value is left for validation to reject.

Optional attribute-backed example:

```typescript
public set visibility(visibility: Visibility) {
  // Normalize — ?? handles null passed by attributeChangedCallback on attribute removal
  visibility = visibility ?? Visibility.VISIBLE;

  // Validate
  visibility = Validate.visibility(visibility);

  // Guard
  if (this._visibility === visibility) return;

  // Mutate
  this._visibility = visibility;
  visibility === Visibility.VISIBLE && this.removeAttribute(Attributes.VISIBILITY);
  visibility === Visibility.HIDDEN && this.setAttribute(Attributes.VISIBILITY, visibility);
}
```

Compulsory attribute-backed example:

```typescript
public set status(status: Status) {
  // Validate
  status = Validate.status(status);

  // Guard
  if (this._status === status) return;

  // Mutate
  this._status = status;
  this.setAttribute(Attributes.STATUS, status);
}
```

## 8) Non-Attribute State Must Declare External Access Contract

For non-attribute state, the implementation must declare its external access contract as one of:

- **Read-only external**: public getter, internal mutation only
- **Writable external**: public getter and public setter

Non-attribute state does not participate in DOM attribute observation or reflection.

## 9) Readonly Policy Must Define Internal Ownership

`readonly` defines whether state is externally writable.

- `readonly: false`  
  The state may participate in the component's public mutation contract.

- `readonly: true`  
  The state is externally readable but internally owned. External mutation must not be authoritative.

This rule applies to both:

- non-attribute state
- attribute-backed state

Readonly therefore does **not** mean the value never changes. It means the value is **not writable from the outside**. The component implementation retains ownership of mutation.

### 9.1) Non-Attribute Readonly State

For non-attribute state with `readonly: true`:

- expose a public getter
- do not expose a public setter
- internal logic may update the canonical value

This is the standard pattern for runtime-only derived, lifecycle, or persistence state.

Example: `persisted`

```typescript
private _persisted: Persisted = Persisted.NONE;

public get persisted(): Persisted {
  return this._persisted;
}

// Internal mutation only
protected _markPersisted = (timestamp: Timestamp) => {
  this._persisted = timestamp;
};
```

In this pattern:

- the state is readable from the component API
- the state is not reflected to the DOM
- the state is mutated only by internal component logic

### 9.2) Attribute-Backed Readonly State

For attribute-backed state with `readonly: true`:

- expose a public getter
- do not expose a public setter
- maintain a canonical internal source of truth
- reflect that canonical value to the DOM attribute
- if the attribute is externally changed, restore the canonical value

This is the standard pattern for reflected but internally owned state.

Example: `id` generated from a UUID during instantiation

Specification fragment:

```json
{
  "States": {
    "id": {
      "type": "Id",
      "description": "Stable component identity generated during instantiation.",
      "values": ["<uuid>"],
      "default": "<generated>",
      "readonly": true,
      "attribute": { "optional": false }
    }
  }
}
```

Metadata pattern:

```typescript
export const Attributes = {
  ID: "id",
} as const;

export type Attributes = typeof Attributes;

export const State = {
  ...Attributes,
} as const;

export type State = (typeof State)[keyof typeof State];

export type Id = string;
```

Implementation pattern:

```typescript
private _id: Id = crypto.randomUUID();

public get id(): Id {
  return this._id;
}

protected _initialize = () => {
  !this.hasAttribute(Attributes.ID) &&
    this.setAttribute(Attributes.ID, this._id);
};

protected _attributeHandlers = {
  [Attributes.ID]: (value: Id) =>
    value !== this._id && this.setAttribute(Attributes.ID, this._id),
};
```

In this pattern:

- the component creates the canonical value internally
- the attribute is reflected for DOM visibility
- external mutation attempts do not become authoritative
- the DOM is restored to the canonical value

### 9.3) Canonical Source of Truth May Be Stored or Computed

Readonly state must have a canonical internal source of truth.

That source may be:

- a private backing field
- a value computed from other internal state

The policy standardizes ownership, not storage strategy.

Computed example:

```typescript
public get persisted(): Persisted {
  return this._saveSucceededAt ?? Persisted.NONE;
}
```

A computed getter is valid as long as:

- the value is internally owned
- no public setter is exposed
- external mutation is not authoritative

### 9.4) Readonly Does Not Replace Optional / Compulsory Classification

If a readonly state is attribute-backed, it must still be classified as:

- **Optional**
- **Compulsory**

That means the existing rules in Section 4 and Section 5 still apply.

So a readonly attribute-backed state must still define:

- whether the attribute may be absent
- how missing attributes are handled during initialization
- how the state is reflected in the DOM

`readonly` adds ownership constraints.  
It does not replace the existing attribute classification model.

### 9.5) Standardized Interpretation

Use the following interpretation consistently across all components:

- `readonly: false`  
  externally writable according to the normal state contract

- `readonly: true`  
  externally readable, internally owned, externally non-authoritative for mutation

---

# Applying the Policy to a Specification

Specification fragment:

```json
{
  "States": {
    "visibility": {
      "type": "Visibility",
      "description": "Indicates whether the component is shown or hidden.",
      "values": ["visible", "hidden"],
      "default": "visible",
      "readonly": false,
      "attribute": {
        "optional": true
      }
    },
    "status": {
      "type": "Status",
      "description": "Indicates the component's status.",
      "values": ["pinned", "unpinned"],
      "default": "unpinned",
      "readonly": false,
      "attribute": {
        "optional": false
      }
    },
    "locked": {
      "type": "Locked",
      "description": "Indicates whether external logic allows edits.",
      "values": [true, false],
      "default": false,
      "readonly": false
    },
    "persisted": {
      "type": "Persisted",
      "description": "Stores the last successful persistence marker.",
      "values": [null, "<timestamp>"],
      "default": null,
      "readonly": true
    }
  }
}
```


How this specification is implemented:

Note: the examples below are intentionally state-only and exclude event-dispatch logic. The additional `locked` and `persisted` examples illustrate non-attribute state patterns beyond the fragment shown.

- `visibility`
    - Attribute-backed, optional, writable
    - Implicit default (`visible`), no forced `_initialize` materialization
    - Getter returns the canonical internal state
    - Setter normalizes nullish input — including `null` passed by `attributeChangedCallback` when the attribute is removed — validates against metadata, and reflects/removes the attribute
- `status`
    - Attribute-backed, compulsory, writable
    - Explicit DOM representation, must be materialized in `_initialize` when absent
    - Getter returns the canonical internal state
    - Setter validates against metadata and always keeps the attribute explicit
- `locked`
    - Non-attribute, writable
    - Runtime-only state, not in `Attributes`, not observed via callback pipeline
    - Public getter + public setter
- `persisted`
    - Non-attribute, read-only
    - Runtime-only state, not in `Attributes`, not observed via callback pipeline
    - Public getter only; updated internally by other component logic

`<component>.validation.ts` for this specification:

```typescript
import { Visibility, Status, Locked } from "./pin.meta.js";

export class Validate {
  public static visibility = (value: string) => {
    const valid = Object.values(Visibility).includes(value as Visibility);
    if (!valid) throw new Error(`Invalid visibility value: ${value}`);
    return value as Visibility;
  };

  public static status = (value: string) => {
    const valid = Object.values(Status).includes(value as Status);
    if (!valid) throw new Error(`Invalid status value: ${value}`);
    return value as Status;
  };

  public static locked = (value: boolean) => {
    const valid = Object.values(Locked).includes(value as Locked);
    if (!valid) throw new Error(`Invalid locked value: ${value}`);
    return value as Locked;
  };
}
```

`visibility` implementation (attribute-backed, optional):

```typescript
private _visibility: Visibility = Visibility.VISIBLE;

public get visibility(): Visibility {
  return this._visibility;
}

public set visibility(visibility: Visibility) {
  visibility = visibility ?? Visibility.VISIBLE;
  visibility = Validate.visibility(visibility);

  if (this._visibility === visibility) return;

  this._visibility = visibility;
  visibility === Visibility.VISIBLE && this.removeAttribute(Attributes.VISIBILITY);
  visibility === Visibility.HIDDEN && this.setAttribute(Attributes.VISIBILITY, visibility);
}
```


`status` implementation (attribute-backed, compulsory):

```typescript
private _status: Status = Status.UNPINNED;

public get status(): Status {
  return this._status;
}

public set status(status: Status) {
  status = Validate.status(status);

  if (this._status === status) return;

  this._status = status;
  this.setAttribute(Attributes.STATUS, status);
}

protected _initialize = () => {
  !this.hasAttribute(Attributes.STATUS) &&
    this.setAttribute(Attributes.STATUS, this._status);
};
```

Declarative attribute wiring (`_attributeHandlers`):

```typescript
protected _attributeHandlers = {
  [Attributes.VISIBILITY]: (value: Visibility) => (this.visibility = value),
  [Attributes.STATUS]: (value: Status) => (this.status = value),
};
```

`persisted` implementation (non-attribute, read-only):

```typescript
private _persisted: Persisted = Persisted.NONE;

public get persisted(): Persisted {
  return this._persisted;
}

// No setter since readonly
```

`locked` implementation (non-attribute, writable):

```typescript
private _locked: Locked = Locked.FALSE;

public get locked(): Locked {
  return this._locked;
}

public set locked(locked: Locked) {
  locked = Validate.locked(locked);

  if (this._locked === locked) return;

  this._locked = locked;
}
```

---

# Policy Checklist

1. Define `type`, `description`, `values`, `default`, and `readonly`.
2. Decide state type: attribute-backed or non-attribute.
3. If attribute-backed, define `attribute.optional` and classify the state as optional or compulsory.
4. Define state metadata in `<component>.meta.ts`.
5. Define state validation in `<component>.validation.ts`.
6. Ensure validation enforces the value domains declared in `<component>.meta.ts`.
7. If attribute-backed, declare the state in `Attributes` and include it in `State`.
8. If non-attribute, declare the state in `State` but not in `Attributes`.
9. If attribute-backed and compulsory, materialize the attribute in `_initialize()` when absent.
10. If attribute-backed and optional, do not force default attribute materialization in `_initialize()`.
11. If attribute-backed and writable, map declarative mutation in `_attributeHandlers`.
12. If attribute-backed and readonly, intercept declarative mutation in `_attributeHandlers` and restore the canonical internal value.
13. Implement the public mutation path using normalize → validate → guard → mutate.
14. Validate incoming values against metadata value domains.
15. If validation fails, the mutation must not proceed.
16. For optional attribute-backed state, use `??` to normalize `null` and `undefined` to the default — this handles `attributeChangedCallback` passing `null` when an attribute is removed. Manage both value and attribute presence during reflection.
17. For compulsory attribute-backed state, always keep the current value explicitly reflected in the DOM attribute using a single `setAttribute(...)` call.
18. For non-attribute state, choose external contract: read-only or writable.
19. For readonly state, ensure mutation remains internally owned and external mutation is non-authoritative.

---

# Component State Specification Schema

JSON Schema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://scalable.software/schema/component-states.schema.json",
  "title": "Component States",
  "description": "Schema for the States object in a component specification.",
  "type": "object",
  "propertyNames": {
    "type": "string",
    "pattern": "^[a-z][a-zA-Z0-9]*$",
    "description": "Canonical state name in lowerCamelCase, for example: visibility, status, locked, persisted."
  },
  "additionalProperties": {
    "type": "object",
    "description": "A state definition.",
    "required": ["type", "description", "values", "default", "readonly"],
    "additionalProperties": false,
    "properties": {
      "type": {
        "type": "string",
        "pattern": "^[A-Z][a-zA-Z0-9]*$",
        "description": "PascalCase type name for the state value domain, derived from the state name, for example: Visibility, Status, Locked, Persisted."
      },
      "description": {
        "type": "string",
        "minLength": 1,
        "description": "Human-readable description of the state."
      },
      "values": {
        "type": "array",
        "minItems": 1,
        "description": "Allowed values or symbolic domain markers for the state, for example ['visible', 'hidden'] or [null, '<timestamp>']."
      },
      "default": {
        "description": "Default value for the state."
      },
      "readonly": {
        "type": "boolean",
        "description": "Whether the state is externally writable. If true, the state is externally readable but internally owned — external mutation is not authoritative."
      },
      "attribute": {
        "type": "object",
        "description": "Attribute-specific configuration. Presence of this object means the state is DOM attribute-backed. Absence means the state is non-attribute state.",
        "required": ["optional"],
        "additionalProperties": false,
        "properties": {
          "optional": {
            "type": "boolean",
            "description": "Whether the DOM attribute may be absent. If true, attribute absence represents the default — the setter removes the attribute when assigning the default value. If false, the attribute is compulsory and must always be explicitly present in the DOM."
          }
        }
      }
    }
  }
}
```

Example JSON:

```json
{
  "States": {
    "visibility": {
      "type": "Visibility",
      "description": "Indicates whether the component is shown or hidden.",
      "values": ["visible", "hidden"],
      "default": "visible",
      "readonly": false,
      "attribute": {
        "optional": true
      }
    },
    "status": {
      "type": "Status",
      "description": "Indicates the component's status.",
      "values": ["pinned", "unpinned"],
      "default": "unpinned",
      "readonly": false,
      "attribute": {
        "optional": false
      }
    },
    "locked": {
      "type": "Locked",
      "description": "Indicates whether external logic allows edits.",
      "values": [true, false],
      "default": false,
      "readonly": false
    },
    "persisted": {
      "type": "Persisted",
      "description": "Stores the last successful persistence marker.",
      "values": [null, "<timestamp>"],
      "default": null,
      "readonly": true
    }
  }
}
```
