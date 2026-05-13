# Gesture

This document defines an implementation policy for **component gestures**, then illustrates how specifications are implemented by applying this policy.

This document is intentionally **gesture** only, but part of a set of implementation policies which together defines the policies which should be followed to transform specifications into an implementation which is predictable, maintainable, and production-ready at scale.

---

# How to Read This Policy

Rules in this policy fall into three strengths. Read each rule with its strength in mind:

- **Principles** are non-negotiable. They derive from framework correctness or TDD discipline and hold for every component. A conflict with a principle is a defect.
- **Templates** are invariant skeletons with explicit variation points. The skeleton applies to every component; specific steps activate or deactivate based on the component's declared classification (e.g., attribute-backed vs non-attribute, readonly vs writable, payload-bearing vs payload-free). Variation is part of the template, not a deviation from it.
- **Conventions** are canonical defaults that keep implementations readable across components. A second component may deviate when its shape genuinely warrants it; the deviation should be explained at review time, not forbidden by the policy.

When applying this policy to a new component, classify each rule before reconciling conflicts. A conflict with a principle is a defect; a conflict with a template means a variation point needs to be made explicit; a conflict with a convention is a documented deviation.

---

# 1) Gesture Contract Must Be Declared in the Specification

Each component specification must declare its gesture contract under `Gestures`.

`Gestures` must be an object whose property names are the canonical gesture names.

Each gesture definition must include:

- `description`

A gesture definition must also declare exactly one implementation intent:

- `triggers` for behavioral gestures
- `effects` for visual gestures

Interpretation:

- `description` defines the user interaction intent
- a gesture declared with `triggers` is a behavioral gesture
- a gesture declared with `effects` is a visual gesture
- behavioral gestures describe an interaction that causes runtime behavior
- visual gestures describe an interaction that affects presentation only
- the gesture name defines the canonical gesture vocabulary used by the specification
- gestures declare interaction input, not semantic outcome
- every gesture definition must include exactly one of `triggers` or `effects`

The `effects` object declares the CSS properties affected by the visual gesture and the interaction condition. The CSS implementation is the authoritative source for per-element specifics — the spec declares the interaction intent and the set of affected properties.

Example behavioral gesture specification:

```json
"click": {
  "description": "Toggle pin button when icon clicked.",
  "triggers": {
    "operation": "toggle",
    "condition": "on element.icon"
  }
}
```

Example visual gesture specification:

```json
"hover": {
  "description": "Change button appearance when hovered over the icon.",
  "effects": {
    "properties": ["background-color", "border-color", "box-shadow", "fill"],
    "condition": "on element.icon"
  }
}
```

This defines the public interaction contract that the implementation must honor.

# 2) Gestures Must Represent Interaction Inputs

This framework distinguishes:

- `Gestures`: the set of user or runtime interactions recognized by the component
- `Operations`: the set of callable public actions exposed by the component
- `Events`: the set of observable semantic outcomes exposed by the component
- `State`: the set of component-owned values that may be read, mutated, or reflected

Policy:

- gestures describe interaction input
- operations describe callable public action
- events describe semantic outcome
- state describes component-owned value
- gestures must not be used to declare operations
- gestures must not be used to declare events
- gestures must not be used to declare state

Examples of valid gestures:

- `click`
- `hover`
- `focus`
- `keydown`

Examples that must not be modeled as gestures:

- `toggle`
- `pin`
- `onpin`
- `visibility`
- `status`

A component may support both behavioral and visual interaction responses, but each declared gesture remains a single interaction input with a single declared implementation role.

# 3) Gestures Must Be Classified by Implementation Role

Every declared gesture must be classified as exactly one of:

- **Behavioral**
- **Visual**

This classification determines whether the gesture participates in runtime implementation or presentation-only implementation.

## 3.1) Behavioral Gestures

Behavioral gestures are interaction inputs that trigger runtime behavior.

A behavioral gesture may:

- invoke a declared public operation
- delegate through an authoritative mutation path when no public operation exists for the behavior
- indirectly produce accepted state transitions
- indirectly cause semantic event emission

Examples:

- `click`
- `keydown`
- `drag`

## 3.2) Visual Gestures

Visual gestures are interaction inputs that affect presentation only.

A visual gesture may:

- change appearance through CSS
- express interaction feedback such as hover, focus, or active styling

A visual gesture must not by itself:

- invoke operations
- mutate component state
- dispatch component events

Examples:

- `hover`
- `focus` styling
- `active` styling

## 3.3) Classification Must Match the Specification Contract

Interpretation:

- a gesture declared with `triggers` is behavioral
- a gesture declared with `effects` is visual
- the implementation strategy must follow that declared classification
- a gesture must not be implemented partly as behavioral and partly as visual unless the specification declares separate gestures for those distinct concerns

# 4) Runtime Gesture Names Must Be Declared in Metadata

For every behavioral gesture declared in the specification, the implementation must define corresponding metadata in `<component>.meta.ts`.

`Gesture` metadata represents the canonical runtime gesture vocabulary, not the full declared gesture vocabulary from the specification.

Policy:

- every declared behavioral gesture must have a key in `Gesture`
- `Gesture` contains only behavioral gestures that participate in runtime listener wiring
- visual gestures must not be declared in `Gesture` when they are implemented purely through CSS
- the implementation must use gesture metadata consistently as the canonical runtime gesture vocabulary

Example pattern:

```typescript
export const Gesture = {
  CLICK: "click",
} as const;

export type Gesture = (typeof Gesture)[keyof typeof Gesture];
```

This gives the implementation a stable, centralized gesture vocabulary that prevents string duplication and keeps listener wiring consistent across metadata and component runtime implementation.

# 5) Runtime Gesture Listener Lifecycle Must Be Centralized

Behavioral gestures must be wired through a centralized listener lifecycle on the component class.

Required methods:

- `_addEventListeners`
- `_removeEventListeners`

These methods define the authoritative attachment and detachment points for runtime gesture listeners.

Policy:

- behavioral gesture listeners must be attached in `_addEventListeners`
- behavioral gesture listeners must be removed in `_removeEventListeners`
- listener lifecycle must be reversible
- listener wiring must not be scattered across unrelated lifecycle or helper methods
- visual gestures implemented only through CSS must not participate in this runtime listener lifecycle

Example:

```typescript
protected _addEventListeners = () =>
  this.elements.icon?.addEventListener(Gesture.CLICK, this._handleClick);

protected _removeEventListeners = () =>
  this.elements.icon?.removeEventListener(Gesture.CLICK, this._handleClick);
```

# 6) Runtime Gesture Listeners Must Target Explicit DOM References

Behavioral gesture listeners must be attached to explicit component-owned DOM references.

These references should be cached on the component instance and used as the authoritative listener targets.

Policy:

- runtime gesture listeners must target explicit DOM references owned by the component
- listener targets should be obtained during the component's caching phase
- runtime listener wiring must use cached references rather than repeated selector queries
- listener wiring must not depend on ad hoc selector lookup at the point of attachment
- the specification target described by the gesture contract must be traceable to the implementation target reference

Example:

```typescript
protected elements: { icon: HTMLDivElement | null } = { icon: null };

protected _cache = () => {
  this.elements.icon = this.root.querySelector(".icon");
};

protected _addEventListeners = () =>
  this.elements.icon?.addEventListener(Gesture.CLICK, this._handleClick);
```

This keeps gesture wiring stable, explicit, and resilient to template complexity while preserving a predictable mapping from specification target to implementation target.

# 7) Runtime Gestures Must Route Through Dedicated Handlers

Each behavioral gesture listener must delegate to a dedicated handler method on the component class.

The handler defines the component's immediate response entry for that gesture.

Policy:

- every behavioral gesture listener must call a dedicated handler
- the handler must be a component method with a name that predictably reflects the gesture, such as `_handleClick`
- handler methods must remain small and focused on gesture routing intent
- listener wiring must not inline gesture behavior directly inside `_addEventListeners`
- visual gestures implemented only through CSS do not require handler methods

Example:

```typescript
protected _addEventListeners = () =>
  this.elements.icon?.addEventListener(Gesture.CLICK, this._handleClick);

private _handleClick = () => this.toggle();
```

This keeps listener wiring declarative, preserves readable separation between attachment and behavior routing, and gives each behavioral gesture a clear implementation entry point.

# 8) Behavioral Gestures Must Route Through the Canonical Behavior Entry

When a behavioral gesture triggers behavior that is declared as a public operation, the gesture handler must invoke that operation.

If the behavior is not declared as a public operation, the gesture handler must delegate through the authoritative mutation path of the relevant construct.

Policy:

- if a behavior is declared in `Operations`, behavioral gesture handlers must invoke that operation
- gesture handlers must not reimplement declared public action logic inline
- if no public operation exists for the behavior, the handler must use the authoritative mutation path of the affected construct
- gesture handlers remain the interaction entry point, not the authoritative owner of mutation logic, transition acceptance, or semantic event emission

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

In this example, the click handler does not implement toggle behavior itself. It delegates to `toggle()`, keeping the operation layer as the single reusable action entry for both runtime interaction and imperative use.

# 9) Visual Gestures Should Prefer CSS

When a declared visual gesture affects presentation only, the implementation should realize that gesture directly in CSS.

These gestures do not participate in runtime listener wiring.

Policy:

- visual gestures that affect presentation only should be implemented in CSS
- CSS-implemented visual gestures must not require entries in runtime gesture metadata
- CSS-implemented visual gestures must not require `_addEventListeners` or `_removeEventListeners`
- CSS-implemented visual gestures must not require dedicated runtime handler methods
- visual gesture implementation should remain traceable to the declared specification target and effect

Example specification:

```json
"hover": {
  "description": "Change button appearance when hovered over the icon.",
  "effects": {
    "properties": ["background-color", "border-color", "box-shadow", "fill"],
    "condition": "on element.icon"
  }
}
```

Example implementation:

```css
@media (hover: hover) {
  .icon:hover {
    background-color: var(--button-hover-background-color);
    border-color: var(--button-border-hover-color);
    box-shadow: var(--button-shadow-hover);
  }

  .icon:hover svg {
    fill: var(--svg-hover-fill-color);
  }
}
```

This keeps presentation-only interaction in the presentation layer and avoids promoting visual feedback into unnecessary runtime behavior.

# 10) CSS-Implemented Visual Gestures Must Not Become Runtime Behavior

A visual gesture implemented in CSS must remain presentation-only.

It must not become an implicit behavioral gesture unless the specification declares a behavioral contract for that interaction.

Policy:

- a CSS-implemented visual gesture must not invoke operations
- a CSS-implemented visual gesture must not mutate component state
- a CSS-implemented visual gesture must not dispatch component events
- if an interaction requires runtime behavior, that behavior must be declared and implemented as a behavioral gesture
- visual feedback and behavioral response must remain separately modeled unless the specification explicitly declares both concerns

Example:

```css
@media (hover: hover) {
  .icon:hover {
    background-color: var(--button-hover-background-color);
    border-color: var(--button-border-hover-color);
    box-shadow: var(--button-shadow-hover);
  }

  .icon:hover svg {
    fill: var(--svg-hover-fill-color);
  }
}
```

In this example, `hover` changes appearance only. It does not call `toggle()`, change `status`, or emit `onpin`.

# Policy Applied to Specification

Specification fragment:

```json
{
  "Gestures": {
    "click": {
      "description": "User clicks the icon to toggle the pin status.",
      "triggers": {
        "operation": "toggle",
        "condition": "on element.icon"
      }
    },
    "hover": {
      "description": "Changes the button appearance when hovered.",
      "effects": {
        "properties": ["background-color", "border-color", "box-shadow", "fill"],
        "condition": "on element.icon"
      }
    }
  }
}
```

How this specification is implemented:

- `click`
    - behavioral gesture
    - declared in runtime gesture metadata as `Gesture.CLICK`
    - wired through the runtime listener lifecycle in `_addEventListeners` and `_removeEventListeners`
    - attached to the cached DOM reference `elements.icon`
    - routed through the dedicated handler `_handleClick`
    - delegated to the declared public operation `toggle()`
- `hover`
    - visual gesture
    - not declared in runtime gesture metadata — implemented purely through CSS
    - not wired through runtime listener lifecycle
    - realized in CSS on the `.icon` and `.icon svg` targets using the declared presentation effects
    - the `effects.properties` array declares the full set of affected CSS properties; per-element specifics are an implementation detail expressed in CSS

Implementation:

```typescript
export const Gesture = {
  CLICK: "click",
} as const;

protected _addEventListeners = () =>
  this.elements.icon?.addEventListener(Gesture.CLICK, this._handleClick);

protected _removeEventListeners = () =>
  this.elements.icon?.removeEventListener(Gesture.CLICK, this._handleClick);

private _handleClick = () => this.toggle();
```

```css
@media (hover: hover) {
  .icon:hover {
    background-color: var(--button-hover-background-color);
    border-color: var(--button-border-hover-color);
    box-shadow: var(--button-shadow-hover);
  }

  .icon:hover svg {
    fill: var(--svg-hover-fill-color);
  }
}
```

How the implementation applies the policy:

- the specification declares the interaction contract under `Gestures`
- behavioral and visual gestures are classified by specification shape (`triggers` vs `effects`)
- behavioral gestures become part of the canonical runtime `Gesture` vocabulary
- behavioral gesture listeners are attached and removed through the centralized listener lifecycle
- behavioral listeners target explicit cached DOM references
- behavioral listeners route through dedicated handlers
- handlers delegate to the canonical behavior entry — the declared public operation when one exists
- visual gestures that affect presentation only are implemented in CSS
- the `effects` spec declares the full set of affected CSS properties; per-element specifics are implementation detail owned by CSS
- CSS-implemented visual gestures do not participate in runtime metadata, listener wiring, handler methods, state mutation, or event dispatch

# Policy Checklist

A compliant component must:

1. Declare all gestures under `Gestures` in the specification.
2. Define each gesture using the required specification contract.
3. Classify every declared gesture as either behavioral (`triggers`) or visual (`effects`).
4. Ensure every gesture definition includes exactly one of `triggers` or `effects`.
5. Ensure the gesture classification matches the declared specification shape.
6. Define every declared behavioral gesture in `<component>.meta.ts` as part of the canonical runtime `Gesture` vocabulary.
7. Avoid declaring CSS-only visual gestures in runtime gesture metadata.
8. Attach behavioral gesture listeners in `_addEventListeners`.
9. Remove behavioral gesture listeners in `_removeEventListeners`.
10. Keep runtime gesture listener lifecycle centralized and reversible.
11. Target explicit component-owned DOM references for behavioral gesture listeners.
12. Obtain listener targets through the component caching path and reuse cached references during wiring.
13. Route every behavioral gesture through a dedicated handler method.
14. Keep dedicated handler methods small and focused on gesture routing intent.
15. Invoke the declared public operation when the behavioral gesture maps to behavior declared in `Operations`.
16. Avoid reimplementing declared public action logic inline in gesture handlers.
17. When no public operation exists for the behavior, delegate through the authoritative mutation path of the affected construct.
18. Implement presentation-only visual gestures in CSS.
19. Keep CSS-implemented visual gestures out of runtime listener wiring.
20. Ensure CSS-implemented visual gestures do not invoke operations, mutate component state, or dispatch component events.
21. List all affected CSS properties in `effects.properties` — per-element specifics are implementation detail owned by the CSS file.
22. Keep gesture naming and implementation traceable from specification target to implementation target and behavior path.

---

# Component Gesture Specification Schema

JSON Schema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://scalable.software/schema/component-gestures.schema.json",
  "title": "Component Gestures",
  "description": "Schema for the Gestures object in a component specification.",
  "type": "object",
  "propertyNames": {
    "type": "string",
    "pattern": "^[a-z][a-zA-Z0-9]*$",
    "description": "Canonical gesture name in lowerCamelCase, for example: click, hover, focus, keydown."
  },
  "additionalProperties": {
    "type": "object",
    "description": "A gesture definition.",
    "required": ["description"],
    "additionalProperties": false,
    "properties": {
      "description": {
        "type": "string",
        "minLength": 1,
        "description": "Human-readable description of the interaction input represented by the gesture."
      },
      "triggers": {
        "type": "object",
        "description": "Behavioral gesture contract. Presence of this object means the gesture triggers runtime behavior.",
        "required": ["condition"],
        "minProperties": 1,
        "additionalProperties": false,
        "properties": {
          "operation": {
            "type": "string",
            "pattern": "^[a-z][a-zA-Z0-9]*$",
            "description": "Canonical operation name triggered by this gesture, for example: toggle, pin, hide."
          },
          "condition": {
            "type": "string",
            "minLength": 1,
            "description": "Human-readable interaction target and condition, for example: on element.icon."
          }
        }
      },
      "effects": {
        "type": "object",
        "description": "Visual gesture contract. Presence of this object means the gesture affects presentation only. The properties array declares the full set of affected CSS properties across all targeted elements — per-element specifics are implementation detail owned by the CSS file.",
        "required": ["properties", "condition"],
        "additionalProperties": false,
        "properties": {
          "properties": {
            "type": "array",
            "description": "All CSS properties affected by the gesture across all targeted elements, for example: background-color, border-color, box-shadow, fill.",
            "minItems": 1,
            "items": {
              "type": "string",
              "minLength": 1
            }
          },
          "condition": {
            "type": "string",
            "minLength": 1,
            "description": "Human-readable interaction target and condition, for example: on element.icon."
          }
        }
      }
    },
    "oneOf": [
      {
        "required": ["triggers"],
        "not": {
          "required": ["effects"]
        }
      },
      {
        "required": ["effects"],
        "not": {
          "required": ["triggers"]
        }
      }
    ]
  }
}
```

Example JSON:

```json
{
  "Gestures": {
    "click": {
      "description": "User clicks the icon to toggle the pin status.",
      "triggers": {
        "operation": "toggle",
        "condition": "on element.icon"
      }
    },
    "hover": {
      "description": "Changes the button appearance when hovered.",
      "effects": {
        "properties": [
          "background-color",
          "border-color",
          "box-shadow",
          "fill"
        ],
        "condition": "on element.icon"
      }
    }
  }
}
```
