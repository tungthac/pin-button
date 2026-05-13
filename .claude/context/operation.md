# Operation

This document defines an implementation policy for **component operations**, then illustrates how specifications are implemented by applying this policy.

This document is intentionally **operations** only, but part of a set of implementation policies which together defines the policies which should be followed to transform specifications into an implementation which is predictable, maintainable, and production-ready at scale.

---

# How to Read This Policy

Rules in this policy fall into three strengths. Read each rule with its strength in mind:

- **Principles** are non-negotiable. They derive from framework correctness or TDD discipline and hold for every component. A conflict with a principle is a defect.
- **Templates** are invariant skeletons with explicit variation points. The skeleton applies to every component; specific steps activate or deactivate based on the component's declared classification (e.g., attribute-backed vs non-attribute, readonly vs writable, payload-bearing vs payload-free). Variation is part of the template, not a deviation from it.
- **Conventions** are canonical defaults that keep implementations readable across components. A second component may deviate when its shape genuinely warrants it; the deviation should be explained at review time, not forbidden by the policy.

When applying this policy to a new component, classify each rule before reconciling conflicts. A conflict with a principle is a defect; a conflict with a template means a variation point needs to be made explicit; a conflict with a convention is a documented deviation.

---

# 1) Operation Contract Must Be Declared in the Specification

Each component specification must declare its operation contract under `Operations`.

`Operations` must be an object whose property names are the canonical operation names.

Each operation definition must include:

- `description`
- `parameters`
- `returns`

Interpretation:

- `description` defines the public action intent
- `parameters` defines the public invocation contract
- `returns` defines the public result contract
- if `parameters` is empty, the operation takes no arguments
- if `returns` is `"void"`, the operation does not return a value

Example specification:

```json
"toggle": {
  "description": "Toggles the 'status' between 'pinned' and 'unpinned'.",
  "parameters": [],
  "returns": "void"
}
```

This defines the public action contract that the implementation must honor.

# Template Variation Points

Operations vary by their relationship to component state and data. The classification determines which sub-rules activate:

- **Primitive operations** — delegate to a single authoritative state mutation path (Section 7). Their semantic event is emitted by the accepted state transition, not by the operation (Section 8). Examples: `hide`, `show`, `pin`, `unpin`.
- **Composite operations** — derive the next target from current component context and delegate through the same authoritative mutation path (Section 11). They typically have no own event because the underlying state transition emits the existing event vocabulary. Example: `toggle`.
- **Coordinating operations** — orchestrate multiple internal steps as one public action and may dispatch their own semantic events directly when the operation itself is the semantic unit (Section 10). Examples: `save`, `cancel`.
- **Data-bearing operations** — accept or construct a data value and delegate through the authoritative data setter (Section 13). Examples: `load`, `create`, `update`, `reset`.

Each operation must be classifiable as exactly one type. A new operation type is a signal that this list needs to be extended, not that the operation deviates from the template.

# 2) Operations Must Represent Public Actions

This framework distinguishes:

- `Operations`: the set of callable public actions exposed by the component

Policy:

- operations describe callable public actions
- operations must not be used to declare state
- operations must not be used to declare gestures
- operations must not be used to declare events

Examples of valid operations:

- `hide`
- `show`
- `pin`
- `unpin`
- `toggle`

Examples that must not be modeled as operations:

- `visibility`
- `status`
- `click`
- `hover`
- `onpin`

These belong to other framework concerns.

# 3) Public Operation Names Must Be Declared in Metadata

For every operation declared in the specification, the implementation must define corresponding metadata in `<component>.meta.ts`.

This metadata defines the canonical operation vocabulary for the component.

Policy:

- every declared public operation must have a key in `Operation`
- `Operation` contains only declared public operation names
- the implementation must use operation metadata consistently as the canonical operation vocabulary

Example pattern:

```typescript
export const Operation = {
  HIDE: "hide",
  SHOW: "show",
  PIN: "pin",
  UNPIN: "unpin",
  TOGGLE: "toggle",
} as const;

export type Operation = (typeof Operation)[keyof typeof Operation];
```

# 4) Every Declared Public Operation Must Be Implemented as a Public Arrow Function Class Property

For every operation declared in the specification, the component class must implement a corresponding public arrow function class property.

Policy:

- every operation declared in `Operations` must have a corresponding public arrow function class property on the component class
- the property name must match the canonical operation name
- the property signature must honor the declared `parameters` and `returns` contract
- public operations form part of the component's imperative API

Operations are implemented as arrow function class properties — not prototype methods — because this guarantees `this` binding at the point of definition. This makes operations safe to pass as callbacks without `.bind()`, which is important for gesture handlers and external consumers.

Example pattern:

```typescript
public hide = () => (this.visibility = Visibility.HIDDEN);
public show = () => (this.visibility = Visibility.VISIBLE);
public pin = () => (this.status = Status.PINNED);
public unpin = () => (this.status = Status.UNPINNED);
public toggle = () =>
  (this.status =
    this.status === Status.PINNED ? Status.UNPINNED : Status.PINNED);
```

This gives the component a stable imperative API:

```typescript
pin.hide();
pin.show();
pin.pin();
pin.unpin();
pin.toggle();
```

# 5) Operations Form the Public Imperative Surface of the Component

Operations form the public imperative surface of the component.

Policy:

- public operations define the callable action surface exposed to external consumers
- public operations must be intentionally named according to the declared operation contract
- public operations must provide a stable imperative entry for the behaviors they represent
- where a declared public operation exists for a behavior, it should be reusable by both imperative callers and runtime gesture handlers

Example imperative usage:

```typescript
pin.toggle();
pin.pin();
```

Example runtime reuse:

```typescript
private _handleClick = () => this.toggle();
```

# 6) Public Operation Methods Must Honor the Declared Return Contract

The default return contract for action-oriented operations is `void`.

If an operation returns a value, that return contract must be declared explicitly in the specification.

Policy:

- the public operation property must honor the `returns` contract declared in the specification
- `void` is the default return contract for action-oriented operations
- non-`void` return contracts are valid only when explicitly declared in the specification

Pin follows the default pattern: all declared operations return `void`.

# 7) Operations Must Remain Thin and Delegate to the Authoritative Mutation Path

Operations must not duplicate mutation logic internally.

When an operation produces its effect by mutating a component-owned construct, it must delegate through the authoritative mutation path of that construct or through a controlled internal transition.

Policy:

- operations express action intent
- operations must not reimplement validation, guard logic, reflection, transition acceptance, or other mutation behavior that belongs to an authoritative construct mutation path
- when the operation maps to a writable public construct, it should normally delegate to that construct's public mutation path
- when the operation requires a controlled internal transition or coordinated internal workflow, that path must remain authoritative
- operations may act on state, data, or other internally owned constructs, provided they preserve the authoritative ownership of mutation behavior

Example:

```typescript
public hide = () => (this.visibility = Visibility.HIDDEN);
public pin = () => (this.status = Status.PINNED);
```

In this example, `hide()` and `pin()` remain thin because they express public action intent while delegating mutation behavior to the authoritative `visibility` and `status` state setters. The operation does not become a second mutation system.

# 8) State-Outcome Semantic Events Must Be Emitted by Accepted State Transitions

If an operation produces a semantic outcome by changing state, the operation must not dispatch the semantic event directly.

Instead, the operation must delegate to state mutation, and the event must be emitted by the accepted state transition.

Preferred flow:

```text
operation
  ↓
state mutation
  ↓
accepted state transition
  ↓
event dispatch
```

Policy:

- operations must not dispatch semantic events directly when those events represent state outcomes
- accepted state transition is the single semantic source of truth for state-outcome event emission
- if the requested state transition is not accepted, the semantic event must not be emitted

This rule applies only to semantic events whose meaning is an accepted state outcome. Operations may dispatch semantic events directly when the operation itself is the semantic unit and the event does not merely restate a state transition.

Example:

```typescript
public pin = () => (this.status = Status.PINNED);

public set status(status: Status) {
  status = Validate.status(status);

  if (this._status === status) return;

  this._status = status;
  this.setAttribute(Attributes.STATUS, status);

  const event = { detail: { status } };

  status === Status.PINNED && this._dispatchEvent(Event.ON_PIN, event);
  status === Status.UNPINNED && this._dispatchEvent(Event.ON_UNPIN, event);
}
```

# 9) Operations Must Be Safe to Call Repeatedly

Operations must be safe to call repeatedly.

Where the requested outcome is already true, the operation must resolve through the normal authoritative mutation path without producing a duplicate accepted outcome or duplicate semantic side effects.

Policy:

- repeated invocation of an operation must not create invalid transitions
- where the requested outcome is already satisfied, the operation must not produce a duplicate accepted outcome
- repeated safety should normally be achieved through the authoritative mutation path, not by duplicating guard logic in the operation itself
- if no accepted outcome occurs, no duplicate semantic side effects should be produced
- when the operation delegates through state, data, or another internally owned construct, repeat safety must be preserved by that construct's authoritative mutation path or controlled internal workflow

Example:

```typescript
public show = () => (this.visibility = Visibility.VISIBLE);

public set visibility(visibility: Visibility) {
  visibility = visibility ?? Visibility.VISIBLE;
  visibility = Validate.visibility(visibility);

  if (this._visibility === visibility) return;

  this._visibility = visibility;
  visibility === Visibility.VISIBLE && this.removeAttribute(Attributes.VISIBILITY);
  visibility === Visibility.HIDDEN && this.setAttribute(Attributes.VISIBILITY, visibility);
}
```

In this example, repeated safety is illustrated by calling `show()` when the component is already in the visible state `Visibility.VISIBLE`. The setter's guard clause detects that no accepted outcome is needed and returns without mutation, reflection, or event dispatch.

# 10) Coordinating Operations May Orchestrate Multiple Internal Steps as One Public Action

Some public operations represent a coordinated component workflow rather than a single direct mutation.

These are valid public operations.

Policy:

- a coordinating operation may mutate more than one component-owned construct
- a coordinating operation may call other public operations or controlled internal helpers
- a coordinating operation must preserve authoritative ownership of each affected construct
- a coordinating operation must not duplicate mutation logic that already belongs to another authoritative mutation path
- where semantic events belong to the operation itself rather than to a single state outcome, the operation may dispatch those events directly

# 11) Composite Operations May Derive the Next Target from Current Component Context

Some operations do not map to a single fixed target value. Instead, they derive the next target from current component context.

These are valid public operations.

Policy:

- a composite operation may read current state or other internally owned component constructs to determine the next target
- a composite operation must remain small and deterministic
- a composite operation must not reimplement mutation logic that belongs to an authoritative mutation path
- the derived next target must still be applied through the authoritative mutation path of the affected construct or through a controlled internal workflow

Example:

```typescript
public toggle = () =>
  (this.status =
    this.status === Status.PINNED ? Status.UNPINNED : Status.PINNED);
```

In this example, `toggle()` reads the current `status`, computes the opposite allowed `status`, and then delegates through the normal `status` setter. The operation remains thin because the setter still owns transition acceptance, reflection, and semantic event emission.

# 12) Runtime Gestures Must Route Through the Canonical Behavior Entry

When a runtime gesture triggers behavior that is declared as a public operation, the gesture handler must invoke that operation.

If the behavior is not declared as a public operation, the gesture handler must delegate through the authoritative mutation path of the relevant construct.

Policy:

- if a behavior is declared in `Operations`, runtime gesture handlers must invoke that operation
- gesture handlers must not reimplement declared public action logic inline
- if no public operation exists for the behavior, the gesture handler must use the authoritative mutation path of the affected construct
- operations remain the canonical public action surface for both imperative callers and runtime gesture handlers

Example:

```typescript
private _handleClick = () => this.toggle();
```

Preferred flow when the behavior is declared as an operation:

```text
gesture
  ↓
handler
  ↓
operation
  ↓
construct mutation
  ↓
accepted outcome
  ↓
event dispatch
```

In this example, the click handler does not implement toggle behavior itself. It delegates to `toggle()`, keeping the operation layer as the single reusable action entry point for both user-driven and imperative behavior.

---

# Policy Checklist

1. Declare every public action under `Operations` in the specification with `description`, `parameters`, and `returns`.
2. Ensure operations represent callable public actions only — not state, gestures, or events.
3. Add a key to `Operation` in `<component>.meta.ts` for every declared operation.
4. Implement every declared operation as a public arrow function class property whose name matches the canonical operation name.
5. Ensure the property signature honors the declared `parameters` and `returns` contract.
6. Keep every operation thin — it must not reimplement validation, guard logic, reflection, or transition logic that belongs to the authoritative mutation path.
7. For operations that change state, delegate to the authoritative state setter. Do not dispatch semantic events from the operation itself.
8. Ensure repeated calls are safe — repeat safety must be owned by the authoritative mutation path, not duplicated in the operation.
9. For composite operations (e.g., `toggle`), derive the next target from current component context and delegate through the same authoritative mutation path.
10. For coordinating operations that orchestrate multiple steps, preserve authoritative ownership of each affected construct.
11. Ensure runtime gesture handlers invoke the declared public operation rather than reimplementing the behavior inline.

---

# Policy Applied to Specification

Specification fragment:

```json
{
  "Operations": {
    "hide": {
      "description": "Sets 'visibility' state to 'hidden' and hides the pin.",
      "parameters": [],
      "returns": "void"
    },
    "show": {
      "description": "Sets 'visibility' state to 'visible' and shows the pin.",
      "parameters": [],
      "returns": "void"
    },
    "pin": {
      "description": "Sets the 'status' to 'pinned', and pins the pin.",
      "parameters": [],
      "returns": "void"
    },
    "unpin": {
      "description": "Sets the 'status' to 'unpinned', and unpins the pin.",
      "parameters": [],
      "returns": "void"
    },
    "toggle": {
      "description": "Toggles the 'status' between 'pinned' and 'unpinned'.",
      "parameters": [],
      "returns": "void"
    }
  }
}
```

How this specification is implemented:

- every declared operation is represented in metadata as part of the canonical `Operation` vocabulary
- every declared operation is implemented as a corresponding public arrow function class property
- `hide`
    - public operation
    - delegates to the authoritative `visibility` state mutation path with `Visibility.HIDDEN`
- `show`
    - public operation
    - delegates to the authoritative `visibility` state mutation path with `Visibility.VISIBLE`
- `pin`
    - public operation
    - delegates to the authoritative `status` state mutation path with `Status.PINNED`
- `unpin`
    - public operation
    - delegates to the authoritative `status` state mutation path with `Status.UNPINNED`
- `toggle`
    - public composite operation
    - reads the current `status`
    - computes the next allowed `status`
    - delegates the derived value through the same authoritative `status` mutation path as the direct operations

Implementation:

```typescript
public hide = () => (this.visibility = Visibility.HIDDEN);

public show = () => (this.visibility = Visibility.VISIBLE);

public pin = () => (this.status = Status.PINNED);

public unpin = () => (this.status = Status.UNPINNED);

public toggle = () =>
  (this.status =
    this.status === Status.PINNED ? Status.UNPINNED : Status.PINNED);
```

How the implementation applies the policy:

- the specification defines the public operation contract under `Operations`
- metadata defines the canonical operation vocabulary
- the component class implements each declared operation as a public arrow function class property with the same canonical name
- operations remain thin and do not duplicate authoritative mutation logic
- in this specification, direct operations delegate through the authoritative public state mutation path
- composite operations may derive the next target state from current state, but still delegate through the same authoritative mutation path
- semantic events that represent state outcomes are emitted by accepted state transitions, not by the operations directly
- repeated calls remain safe because the delegated state setters guard and no-op when no real transition is accepted
- runtime gestures invoke operations as the canonical public behavior entry for declared actions

In this specification, all declared operations have an empty `parameters` contract and a `void` return contract, so each implementation is a nullary public arrow function class property whose effect is expressed through delegated state transition rather than through returned data.

# Component Operation Specification Schema

JSON Schema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://scalable.software/schema/component-operations.schema.json",
  "title": "Component Operations",
  "description": "Schema for the Operations object in a component specification.",
  "type": "object",
  "propertyNames": {
    "type": "string",
    "pattern": "^[a-z][a-zA-Z0-9]*$",
    "description": "Canonical operation name in lowerCamelCase, for example: hide, show, pin, unpin, toggle."
  },
  "additionalProperties": {
    "type": "object",
    "description": "An operation definition.",
    "required": ["description", "parameters", "returns"],
    "additionalProperties": false,
    "properties": {
      "description": {
        "type": "string",
        "minLength": 1,
        "description": "Human-readable description of the public action performed by the operation."
      },
      "parameters": {
        "type": "array",
        "description": "Ordered list of public invocation parameters for the operation. Use an empty array when the operation takes no arguments.",
        "items": {
          "type": "object",
          "required": ["name", "type", "description"],
          "additionalProperties": false,
          "properties": {
            "name": {
              "type": "string",
              "pattern": "^[a-z][a-zA-Z0-9]*$",
              "description": "Canonical parameter name in lowerCamelCase."
            },
            "type": {
              "type": "string",
              "minLength": 1,
              "description": "Declared parameter type, for example: Metadata, string, boolean."
            },
            "description": {
              "type": "string",
              "minLength": 1,
              "description": "Human-readable description of the parameter."
            }
          }
        }
      },
      "returns": {
        "type": "string",
        "minLength": 1,
        "description": "Declared return contract for the operation. Use \"void\" for action-oriented operations that do not return a value."
      }
    }
  }
}
```

Example JSON:

```json
{
  "Operations": {
    "hide": {
      "description": "Sets 'visibility' state to 'hidden' and hides the pin.",
      "parameters": [],
      "returns": "void"
    },
    "show": {
      "description": "Sets 'visibility' state to 'visible' and shows the pin.",
      "parameters": [],
      "returns": "void"
    },
    "pin": {
      "description": "Sets the 'status' to 'pinned', and pins the pin.",
      "parameters": [],
      "returns": "void"
    },
    "unpin": {
      "description": "Sets the 'status' to 'unpinned', and unpins the pin.",
      "parameters": [],
      "returns": "void"
    },
    "toggle": {
      "description": "Toggles the 'status' between 'pinned' and 'unpinned'.",
      "parameters": [],
      "returns": "void"
    }
  }
}
```

Example JSON with parameters:

```json
{
  "Operations": {
    "load": {
      "description": "Load metadata into the component.",
      "parameters": [
        {
          "name": "metadata",
          "type": "Metadata",
          "description": "The metadata instance to load into the component."
        }
      ],
      "returns": "void"
    },
    "create": {
      "description": "Create a new metadata instance for the component.",
      "parameters": [],
      "returns": "void"
    }
  }
}
```
