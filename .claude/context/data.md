# Data

This document defines an implementation policy for **component data**, then illustrates how specifications are implemented by applying this policy.

This document is intentionally **data** only, but part of a set of implementation policies which together define how specifications should be transformed into implementations which are predictable, maintainable, and production-ready at scale.

---

# How to Read This Policy

Rules in this policy fall into three strengths. Read each rule with its strength in mind:

- **Principles** are non-negotiable. They derive from framework correctness or TDD discipline and hold for every component. A conflict with a principle is a defect.
- **Templates** are invariant skeletons with explicit variation points. The skeleton applies to every component; specific steps activate or deactivate based on the component's declared classification (e.g., attribute-backed vs non-attribute, readonly vs writable, payload-bearing vs payload-free). Variation is part of the template, not a deviation from it.
- **Conventions** are canonical defaults that keep implementations readable across components. A second component may deviate when its shape genuinely warrants it; the deviation should be explained at review time, not forbidden by the policy.

When applying this policy to a new component, classify each rule before reconciling conflicts. A conflict with a principle is a defect; a conflict with a template means a variation point needs to be made explicit; a conflict with a convention is a documented deviation.

---

# 1) Data Contract Must Be Declared in the Specification

Each component specification must declare its data contract under `Data`.

`Data` must be an object whose property names are the canonical data names.

Each data definition must include:

- `type`
- `description`

A data definition may also include:

- `properties`
- `default`
- `readonly`

Interpretation:

- `type` defines the public runtime shape category of the data
- `description` defines the semantic purpose of the data
- `properties` defines the structured fields of object-shaped data
- `default` defines the default runtime value when one exists
- `readonly` defines whether the data is externally writable or internally owned
- if `properties` is present, the data is structured
- if `properties` is absent, the data is scalar or otherwise non-structured

Example specification:

```json
{
  "Data": {
    "metadata": {
      "type": "object",
      "description": "The metadata of the clinical pathway.",
      "properties": {
        "id": {
          "type": "uuid",
          "description": "The unique identifier of the clinical pathway."
        },
        "name": {
          "type": "string",
          "description": "The name of the clinical pathway.",
          "default": "Clinical Pathway"
        },
        "type": {
          "type": "MapType",
          "description": "The type of the map.",
          "default": "pathway"
        }
      },
      "default": null,
      "readonly": false
    }
  }
}
```

This defines the public data contract that the implementation must honor.

# Template Variation Points

Data items vary by structure, ownership, and runtime nullability:

- **Structured vs scalar** — structured data declares `properties` and uses an explicit metadata type (Section 4); scalar data has a flat runtime shape and may not require a structured type definition.
- **Writable vs read-only** — writable data exposes a public setter and follows the normalize → validate → guard → mutate → synchronize mutation order (Sections 8.2, 9); read-only data exposes only a getter and is mutated internally (Section 8.1).
- **Supports unloaded state vs always-present** — when the runtime contract permits an unloaded or cleared state, the public getter and setter types reflect that possibility, and validation may bypass the unloaded sentinel (Section 10). Always-present data does not exercise this variation.

Data-creation operations (Section 13.1), data-loading operations (Section 13.2), workflow events (Section 15), and the editing-surface pattern (Section 17) activate only when the component's specification declares the corresponding patterns. They are valid template instantiations, not extensions of the policy.

# 2) Data Must Represent Canonical Component-Owned Content

This framework distinguishes:

- `Data`: structured or scalar content owned by the component
- `State`: finite runtime mode, visibility, status, or other UI/runtime condition
- `Operations`: callable public actions
- `Events`: observable semantic outcomes
- `Gestures`: interaction inputs

Policy:

- data describes canonical component-owned content
- state describes runtime condition
- operations describe callable public actions
- events describe semantic outcomes
- gestures describe interaction input
- data must not be used to declare state
- data must not be used to declare operations
- data must not be used to declare events
- data must not be used to declare gestures

Examples of valid data:

- `metadata`
- `record`
- `document`
- `selection`
- `payload`

Examples that must not be modeled as data:

- `visibility`
- `status`
- `mode`
- `click`
- `onload`
- `save`

Data is the authoritative component-owned content model, not a substitute for the other constructs.

# 3) Public Data Names Must Be Declared in Metadata

For every data item declared in the specification, the implementation must define corresponding metadata in `<component>.meta.ts`.

This metadata defines the canonical data vocabulary for the component.

Policy:

- every declared public data item must have a key in `Data`
- `Data` contains only declared public data names
- the implementation must use data metadata consistently as the canonical data vocabulary

Example pattern:

```typescript
export const Data = {
  METADATA: "metadata",
} as const;

export type Data = (typeof Data)[keyof typeof Data];
```

This gives the implementation a stable, centralized vocabulary that prevents string duplication and keeps naming consistent across metadata, validation, component API, and data-oriented events.

# 4) Data Shape Must Be Defined in Metadata

For every declared data item, the implementation must define the corresponding runtime type in `<component>.meta.ts`.

This type defines the allowed runtime shape of the canonical data object or value.

Policy:

- every declared data item must have a corresponding runtime type definition in metadata
- structured data should be expressed through an explicit TypeScript type
- nested constrained fields may use additional metadata value domains
- the metadata type is the public runtime data contract used by the implementation

Example pattern:

```typescript
export const MapType = {
  PATHWAY: "pathway",
} as const;

export type MapType = (typeof MapType)[keyof typeof MapType];

export type Metadata = {
  id: string;
  name: string;
  type: MapType;
};
```

This makes the data contract explicit in the same way state value domains are made explicit in metadata.

# 5) Data Validation Must Be Implemented in `<component>.validation.ts`

For every declared data item, the implementation must define validation logic in `<component>.validation.ts`.

This validation serves as the runtime enforcement layer for the data contract declared in the specification and expressed in metadata.

Policy:

- validation logic for data must be implemented in `<component>.validation.ts`
- validation must enforce the allowed runtime shape and constrained field domains declared in metadata
- public writable mutation paths must call validation before mutation proceeds
- if validation fails, mutation must not proceed
- validation functions should return the validated value in its narrowed runtime type

Example:

```typescript
import { MapType } from "./title.meta.js";
import type { Metadata } from "./title.meta.js";

export class Validate {
  public static metadata = (value: Metadata) => {
    if (!value.id) {
      throw new Error("Invalid metadata value: id is required");
    }

    if (!Object.values(MapType).includes(value.type as MapType)) {
      throw new Error("Invalid metadata value: type is invalid");
    }

    return value as Metadata;
  };
}
```

This makes the contract explicit:

- `<component>.meta.ts` defines the data shape
- `<component>.validation.ts` enforces the data shape
- `<component>.ts` uses validation in the mutation path

# 6) Data Must Have a Canonical Internal Source of Truth

Each declared data item must have a canonical internal source of truth on the component instance.

That source may be nullable when the runtime contract supports an unloaded or cleared state.

Policy:

- every declared data item must have a canonical internally owned runtime source of truth
- canonical data should normally be stored in a private backing field
- if the runtime data contract includes an unloaded or cleared state, that state must be represented explicitly
- external API access must read from the canonical internal source of truth

Example:

```typescript
private _metadata: Metadata | null = null;

public get metadata(): Metadata | null {
  return this._metadata;
}
```

This keeps ownership clear and prevents DOM structure, transient form controls, or ad hoc derived values from becoming accidental sources of truth.

# 7) Data Does Not Participate in DOM Attribute Observation by Default

Unlike attribute-backed state, data is not DOM attribute-backed by default.

Policy:

- data must not be declared in `Attributes` unless an explicit policy for attribute-backed data exists
- data does not participate in `attributeChangedCallback` by default
- data must not be treated as DOM attribute state merely because it is externally readable or writable
- data reflection to DOM, serialization, or persistence must be modeled explicitly rather than assumed

This keeps structured content separate from the DOM attribute system used for finite state.

# 8) Data Must Declare External Access Contract

For each non-attribute data item, the implementation must declare its external access contract as one of:

- **Read-only external**
- **Writable external**

## 8.1) Read-only External Data

For data with `readonly: true`:

- expose a public getter
- do not expose a public setter
- internal logic may update the canonical value

Example:

```typescript
private _metadata: Metadata | null = null;

public get metadata(): Metadata | null {
  return this._metadata;
}

protected _loadMetadata = (metadata: Metadata) => {
  this._metadata = Validate.metadata(metadata);
};
```

## 8.2) Writable External Data

For data with `readonly: false`:

- expose a public getter
- expose a public setter
- public writable mutation must converge on that setter

Example:

```typescript
private _metadata: Metadata | null = null;

public get metadata(): Metadata | null {
  return this._metadata;
}

public set metadata(metadata: Metadata | null) {
  this._metadata = metadata ? Validate.metadata(metadata) : null;
}
```

Readonly therefore does **not** mean the data never changes. It means the data is externally readable but internally owned.

# 9) Public Data Mutation Path Must Be Normalize → Validate → Guard → Mutate → Synchronize

For writable data, the public mutation path must follow this order:

1. **Normalize**
2. **Validate**
3. **Guard**
4. **Mutate**
5. **Synchronize**

Interpretation:

- **Normalize** converts incoming values into the runtime shape expected by validation
- **Validate** enforces the declared data contract
- **Guard** prevents duplicate accepted outcomes when no effective change is needed
- **Mutate** updates the canonical internal value
- **Synchronize** updates dependent projections such as state, composition, or internal helpers

A mutation path may omit phases that are not needed for a given data item, but the order of any phases that are used must remain Normalize → Validate → Guard → Mutate → Synchronize.

Example:

```typescript
public set metadata(metadata: Metadata | null) {
  // Normalize
  metadata = metadata ?? null;

  // Validate
  metadata = metadata ? Validate.metadata(metadata) : null;

  // Guard
  if (this._metadata === metadata) return;

  // Mutate
  this._metadata = metadata;

  // Synchronize
  this._updateLabel();
  this._syncContent();
  this._syncMode();
}
```

For structured object data, the guard strategy may be referential, structural, semantic, or omitted when no safe equality rule is available. The implementation must choose a strategy that is predictable for the declared contract.

# 10) Null or Unloaded Runtime Data State Must Be Explicitly Modeled

Some components support a meaningful runtime state where data is not yet loaded, has been cleared, or has not yet been created.

This is valid, but it must be modeled explicitly.

Policy:

- when a data item supports an unloaded or cleared runtime state, that state must be explicit in the implementation contract
- the public getter and setter types must reflect that runtime possibility
- validation may bypass the unloaded sentinel if that sentinel is part of the runtime access contract rather than part of the structured data shape itself
- operations and events must treat the unloaded state predictably

Example:

```typescript
private _metadata: Metadata | null = null;

public set metadata(metadata: Metadata | null) {
  this._metadata = metadata ? Validate.metadata(metadata) : null;
}
```

This keeps unloaded runtime absence distinct from invalid structured data.

# 11) Data Synchronization May Update Dependent State and Composition

Data often drives state projections and rendered composition.

This is valid, but those dependent constructs must preserve their own authoritative mutation behavior.

Policy:

- data mutation may synchronize dependent component state
- data mutation may synchronize composition-facing values such as labels, inputs, or cached display content
- when data mutation updates writable state, it should do so through that state's authoritative mutation path
- data synchronization must remain predictable and traceable from the data contract to the dependent runtime behavior

Example:

```typescript
private _updateLabel = () =>
  (this.elements.label.textContent = this.metadata?.name ?? "Untitled");

private _syncContent = () =>
  (this.content = !this.metadata?.name ? Content.EMPTY : Content.NAME);

private _syncMode = () =>
  (this.mode = this.content === Content.EMPTY ? Mode.EDIT : Mode.VIEW);
```

In this pattern:

- `metadata` is the canonical data
- `content` is derived runtime state
- `mode` may be further coordinated from that derived state
- label text is a composition projection of the canonical data

# 12) Operations Must Remain Thin or Orchestrational Around Data

When an operation affects component data, it must not become a second authoritative mutation system.

Policy:

- operations that affect data must remain thin where possible
- operations may orchestrate multi-step workflows around data
- operations must not duplicate validation logic that belongs to the authoritative data mutation path
- operations must not mutate scattered data fields ad hoc when a canonical data mutation path exists
- operations may derive a next data value and delegate it through the authoritative data mutation path

Examples:

```typescript
public load = (metadata: Metadata) => {
  this.metadata = metadata;

  const event = { detail: { metadata: this.metadata } };
  this._dispatchEvent(Event.ON_LOAD, event);
};

public update = () => {
  if (!this.metadata) return;

  this.metadata = {
    ...this.metadata,
    name: this.elements.name.value.trim(),
  };

  const event = { detail: { metadata: this.metadata } };
  this._dispatchEvent(Event.ON_UPDATE, event);
};

public reset = () => {
  this.metadata = null;
  this._syncName();
  this._dispatchEvent(Event.ON_RESET);
};
```

This preserves a single authoritative mutation path for the canonical data while still allowing workflow-oriented operations.

# 13) Data-Creation and Data-Loading Operations Are Valid Public Patterns

Some components need to create internal default data or load external data into the component.

These are valid public operation patterns.

## 13.1) Create

A create operation may internally construct a valid data instance and assign it through the authoritative data mutation path.

Example:

```typescript
public create = () => {
  this.metadata = {
    id: crypto.randomUUID(),
    name: "",
    type: MapType.PATHWAY,
  };

  const event = { detail: { metadata: this.metadata } };
  this._dispatchEvent(Event.ON_CREATE, event);
};
```

## 13.2) Load

A load operation may accept external data and assign it through the authoritative data mutation path.

Example:

```typescript
public load = (metadata: Metadata) => {
  this.metadata = metadata;

  const event = { detail: { metadata: this.metadata } };
  this._dispatchEvent(Event.ON_LOAD, event);
};
```

These patterns are especially common for structured domain data and should be treated as first-class data workflows.

# 14) Data Update Should Prefer Whole-Value Reassignment Over Ad Hoc Nested Mutation

When public behavior changes canonical data, the implementation should prefer constructing the next accepted data value and assigning it through the authoritative data mutation path.

Policy:

- public data updates should prefer whole-value reassignment when practical
- nested ad hoc mutation should be avoided in public workflow paths when it bypasses the authoritative mutation path
- reconstructing the next data value keeps validation, guard logic, synchronization, and event behavior centralized

Example:

```typescript
public update = () => {
  if (!this.metadata) return;

  this.metadata = {
    ...this.metadata,
    name: this.elements.name.value.trim(),
  };
};
```

This keeps the data setter authoritative rather than letting workflow operations mutate backing fields directly.

# 15) Data-Oriented Semantic Events Must Be Emitted by Accepted Data Outcomes or Declared Workflow Outcomes

Public data-oriented events must represent accepted semantic outcomes.

Some data events describe a direct accepted data outcome, such as load or update. Others describe a declared workflow milestone, such as save, reset, or create.

Policy:

- public data-oriented events must be dispatched through `_dispatchEvent(...)`
- data-outcome events must not be emitted before the corresponding accepted outcome has occurred
- when an event payload includes data, that payload must be emitted through `detail`
- emitted data payload must match the declared event contract
- operations must not dispatch data-outcome events before the authoritative data mutation path has accepted the outcome

Examples:

```typescript
public load = (metadata: Metadata) => {
  this.metadata = metadata;

  const event = { detail: { metadata: this.metadata } };
  this._dispatchEvent(Event.ON_LOAD, event);
};

public save = () => {
  if (!this.metadata) return;

  this.update();

  const event = { detail: { metadata: this.metadata } };
  this._dispatchEvent(Event.ON_SAVE, event);

  this.mode = Mode.VIEW;
};
```

This preserves the same event discipline already used for state-outcome events, while accommodating richer data workflows.

# 16) Data Payload Contract Must Match the Specification

When a public event emits data payload, the runtime payload must match the declared data contract or declared event payload contract.

Policy:

- data payload emitted through events must use `detail`
- the emitted payload must conform to the declared runtime data shape
- the implementation must not emit undeclared data payload for a declared public event
- payload should reflect the accepted canonical value, not a stale or pre-validation value

Example event contract:

```json
{
  "Events": {
    "onload": {
      "description": "Dispatched when the metadata is loaded.",
      "parameters": [
        {
          "name": "detail",
          "type": "object",
          "properties": {
            "metadata": {
              "type": "Metadata"
            }
          }
        }
      ]
    }
  }
}
```

Example dispatch:

```typescript
const event = { detail: { metadata: this.metadata } };
this._dispatchEvent(Event.ON_LOAD, event);
```

# 17) Data May Drive Temporary Editing Surfaces Without Those Surfaces Becoming Canonical

Components often project canonical data into editable DOM controls such as inputs, textareas, or other form surfaces.

These controls are not themselves canonical data.

Policy:

- DOM editing controls must not become the canonical source of truth for the component data
- canonical data may be projected into the editing surface
- user edits may remain tentative until accepted through an operation or authoritative update path
- operations such as `edit`, `change`, `save`, and `cancel` may coordinate the relationship between tentative input and canonical data

Example:

```typescript
private _syncName = () =>
  (this.elements.name.value = this.metadata?.name ?? "");

public edit = () => {
  this._syncName();
  this._focusName();
  this.mode = Mode.EDIT;
};

public save = () => {
  if (!this.metadata) return;

  this.update();

  const event = { detail: { metadata: this.metadata } };
  this._dispatchEvent(Event.ON_SAVE, event);

  this.mode = Mode.VIEW;
};

public cancel = () => {
  this._syncName();
  this.content = !this.metadata?.name ? Content.EMPTY : Content.NAME;
  this._dispatchEvent(Event.ON_CANCEL);
  this.mode = Mode.VIEW;
};
```

In this pattern:

- the input field is an editing surface
- `metadata` remains canonical
- save accepts the edited value into canonical data
- cancel restores the editing surface from canonical data

# 18) Initialization Policy Must Be Explicit About Data Lifecycle Entry

If a component requires initial data creation or default data loading during initialization, that behavior must be explicit and predictable.

Policy:

- initialization must not hide data lifecycle behavior
- if the component creates default data on mount, that should occur through a declared operation or controlled internal helper
- if callers are expected to load external data after connection, that expectation should be explicit in the implementation contract
- initialization behavior must remain compatible with the declared data access contract

Example:

```typescript
protected _initialize = () => {
  this.setAttribute(Attributes.VISIBILITY, this._visibility);
  this.setAttribute(Attributes.STATUS, this._status);
  this.setAttribute(Attributes.CONTENT, this._content);
  this.setAttribute(Attributes.MODE, this._mode);

  this.create();
};
```

This pattern is valid because the initialization path is explicit and the creation behavior still routes through the authoritative data mutation path.

# 19) Readonly Policy Must Define Internal Ownership for Data

`readonly` defines whether data is externally writable.

- `readonly: false`
  The data may participate in the component's public mutation contract.

- `readonly: true`
  The data is externally readable but internally owned. External mutation must not be authoritative.

This rule applies to all data, regardless of whether the data is scalar or structured.

Readonly therefore does **not** mean the value never changes. It means the value is **not writable from the outside**. The component implementation retains ownership of mutation.

# 20) Naming Must Be Predictably Transformed Across Layers

Public data naming must remain consistent across the specification, metadata, component API, validation, operations, and event payloads.

Policy:

- the specification defines the canonical public data name
- metadata must define a corresponding `Data` key whose value is that canonical data name
- the component class must expose a public getter using that same canonical name
- if externally writable, the component class must expose a public setter using that same canonical name
- validation should use a predictably related function name
- event payload properties should use the same canonical data name when they emit that data

Transformation pattern:

| Layer | Example |
|---|---|
| Specification | `metadata` |
| Metadata Vocabulary | `Data.METADATA = "metadata"` |
| Metadata Type | `type Metadata = { ... }` |
| Validation | `Validate.metadata(...)` |
| Component API | `get metadata()` / `set metadata(...)` |
| Event Payload | `detail.metadata` |

This predictable transformation keeps the implementation traceable back to the specification and consistent with the framework's metadata-driven design.

---

# Policy Applied to Specification

Specification fragment:

```json
{
  "Data": {
    "metadata": {
      "type": "object",
      "description": "The metadata of the clinical pathway.",
      "properties": {
        "id": {
          "type": "uuid",
          "description": "The unique identifier of the clinical pathway."
        },
        "name": {
          "type": "string",
          "description": "The name of the clinical pathway."
        },
        "type": {
          "type": "MapType",
          "description": "The type of the map."
        }
      },
      "default": null,
      "readonly": false
    }
  }
}
```

How this specification is implemented:

- `metadata`
  - canonical data item
  - structured object-shaped data
  - writable external data
  - represented in metadata vocabulary as `Data.METADATA`
  - represented in metadata type space as `type Metadata = { id, name, type }`
  - validated by `Validate.metadata(...)`
  - stored canonically in `private _metadata`
  - exposed through `get metadata()` and `set metadata(...)`
  - synchronized into dependent state and composition through helper methods
  - acted on through data-oriented operations such as `create`, `load`, `update`, `save`, and `reset`
  - emitted through semantic workflow events such as `oncreate`, `onload`, `onupdate`, `onsave`, and `onreset`

Implementation:

```typescript
export const Data = {
  METADATA: "metadata",
} as const;

export type Data = (typeof Data)[keyof typeof Data];

export const MapType = {
  PATHWAY: "pathway",
} as const;

export type MapType = (typeof MapType)[keyof typeof MapType];

export type Metadata = {
  id: string;
  name: string;
  type: MapType;
};

export class Validate {
  public static metadata = (value: Metadata) => {
    if (!value.id) {
      throw new Error("Invalid metadata value: id is required");
    }

    if (!Object.values(MapType).includes(value.type as MapType)) {
      throw new Error("Invalid metadata value: type is invalid");
    }

    return value as Metadata;
  };
}

private _metadata: Metadata | null = null;

public get metadata(): Metadata | null {
  return this._metadata;
}

public set metadata(metadata: Metadata | null) {
  // Normalize
  metadata = metadata ?? null;

  // Validate
  metadata = metadata ? Validate.metadata(metadata) : null;

  // Guard
  if (this._metadata === metadata) return;

  // Mutate
  this._metadata = metadata;

  // Synchronize
  this._updateLabel();
  this._syncContent();
  this._syncMode();
}

public create = () => {
  this.metadata = {
    id: crypto.randomUUID(),
    name: "",
    type: MapType.PATHWAY,
  };

  const event = { detail: { metadata: this.metadata } };
  this._dispatchEvent(Event.ON_CREATE, event);
};

public load = (metadata: Metadata) => {
  this.metadata = metadata;

  const event = { detail: { metadata: this.metadata } };
  this._dispatchEvent(Event.ON_LOAD, event);
};

public update = () => {
  if (!this.metadata) return;

  this.metadata = {
    ...this.metadata,
    name: this.elements.name.value.trim(),
  };

  const event = { detail: { metadata: this.metadata } };
  this._dispatchEvent(Event.ON_UPDATE, event);
};

public reset = () => {
  this.metadata = null;
  this._syncName();
  this._dispatchEvent(Event.ON_RESET);
};
```

How the implementation applies the policy:

- the specification declares the data contract under `Data`
- metadata defines both the canonical data vocabulary and the runtime data shape
- validation enforces the runtime data contract
- the component owns the canonical data through a private backing field
- the public getter and setter define the external data access contract
- the setter is the authoritative public mutation path
- data mutation follows the normalize → validate → guard → mutate → synchronize order
- data mutation synchronizes dependent state and composition
- operations remain thin or orchestrational around the authoritative data path
- semantic data workflow events are emitted through the framework dispatch path
- event payloads expose canonical accepted data through `detail`

---

# Policy Checklist

A compliant component must:

1. Declare all public data under `Data` in the specification.
2. Define each data item using the required specification contract.
3. Use `type` and `description` for every declared data item.
4. Use `properties` when the data is structured.
5. Use `default` when the runtime contract includes a default or unloaded sentinel.
6. Use `readonly` to declare external ownership rules.
7. Define all declared public data names in `<component>.meta.ts`.
8. Use `Data` metadata as the canonical data vocabulary.
9. Define the runtime data shape in `<component>.meta.ts`.
10. Implement validation for each declared data item in `<component>.validation.ts`.
11. Ensure validation enforces the declared runtime shape and constrained field domains.
12. Give each declared data item a canonical internal source of truth.
13. Expose an external access contract for each data item as read-only or writable.
14. Keep public writable data mutation paths authoritative and centralized.
15. Use the mutation order normalize → validate → guard → mutate → synchronize whenever those phases are needed.
16. Model unloaded or cleared runtime data explicitly when supported.
17. Keep data out of `Attributes` and DOM attribute observation by default.
18. Allow data mutation to synchronize dependent state and composition predictably.
19. Preserve authoritative ownership of dependent state when data updates it.
20. Keep data-oriented operations thin or orchestrational around the canonical data mutation path.
21. Prefer whole-value reassignment over ad hoc nested mutation in public workflow paths.
22. Dispatch public data-oriented events through `_dispatchEvent(...)`.
23. Emit data events only after the accepted data outcome or declared workflow outcome has occurred.
24. Emit data payload through `event.detail`.
25. Ensure emitted data payload matches the declared contract.
26. Keep DOM editing surfaces non-canonical unless the specification explicitly says otherwise.
27. Keep naming predictably aligned across specification, metadata, validation, component API, and event payloads.

---

# Component Data Specification Schema

JSON Schema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://scalable.software/schema/component-data.schema.json",
  "title": "Component Data",
  "description": "Schema for the Data object in a component specification.",
  "type": "object",
  "propertyNames": {
    "type": "string",
    "pattern": "^[a-z][a-zA-Z0-9]*$",
    "description": "Canonical data name in lowerCamelCase, for example: metadata, document, payload."
  },
  "additionalProperties": {
    "type": "object",
    "description": "A data definition.",
    "required": ["type", "description"],
    "additionalProperties": false,
    "properties": {
      "type": {
        "type": "string",
        "minLength": 1,
        "description": "Declared runtime shape category for the data, for example: object, array, string, Metadata."
      },
      "description": {
        "type": "string",
        "minLength": 1,
        "description": "Human-readable description of the component-owned data."
      },
      "properties": {
        "type": "object",
        "description": "Structured field definitions for object-shaped data.",
        "minProperties": 1,
        "propertyNames": {
          "type": "string",
          "pattern": "^[a-z][a-zA-Z0-9]*$",
          "description": "Canonical property name in lowerCamelCase, for example: id, name, type."
        },
        "additionalProperties": {
          "type": "object",
          "required": ["type", "description"],
          "additionalProperties": false,
          "properties": {
            "type": {
              "type": "string",
              "minLength": 1,
              "description": "Declared field type, for example: string, uuid, MapType."
            },
            "description": {
              "type": "string",
              "minLength": 1,
              "description": "Human-readable description of the field."
            },
            "default": {
              "description": "Default value for the field when applicable."
            },
            "values": {
              "type": "array",
              "minItems": 1,
              "description": "Allowed values when the field has a constrained domain."
            },
            "readonly": {
              "type": "boolean",
              "description": "Whether the field is externally writable. Field-level readonly is optional and may be interpreted by component-specific policy."
            }
          }
        }
      },
      "default": {
        "description": "Default runtime value for the declared data item."
      },
      "readonly": {
        "type": "boolean",
        "description": "Whether the data item is externally writable. If true, the data is externally readable but internally owned."
      }
    }
  }
}
```

Example JSON:

```json
{
  "Data": {
    "metadata": {
      "type": "object",
      "description": "The metadata of the clinical pathway.",
      "properties": {
        "id": {
          "type": "uuid",
          "description": "The unique identifier of the clinical pathway."
        },
        "name": {
          "type": "string",
          "description": "The name of the clinical pathway.",
          "default": "Clinical Pathway"
        },
        "type": {
          "type": "MapType",
          "description": "The type of the map.",
          "default": "pathway",
          "values": ["pathway"]
        }
      },
      "default": null,
      "readonly": false
    }
  }
}
```
