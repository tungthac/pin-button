# Composition

This document defines an implementation policy for **component composition**, then illustrates how specifications are implemented by applying this policy.

This document is intentionally **composition** only, but part of a set of implementation policies which together define the policies which should be followed to transform specifications into an implementation which is predictable, maintainable, and production-ready at scale.

---

# How to Read This Policy

Rules in this policy fall into three strengths. Read each rule with its strength in mind:

- **Principles** are non-negotiable. They derive from framework correctness or TDD discipline and hold for every component. A conflict with a principle is a defect.
- **Templates** are invariant skeletons with explicit variation points. The skeleton applies to every component; specific steps activate or deactivate based on the component's declared classification (e.g., attribute-backed vs non-attribute, readonly vs writable, payload-bearing vs payload-free). Variation is part of the template, not a deviation from it.
- **Conventions** are canonical defaults that keep implementations readable across components. A second component may deviate when its shape genuinely warrants it; the deviation should be explained at review time, not forbidden by the policy.

When applying this policy to a new component, classify each rule before reconciling conflicts. A conflict with a principle is a defect; a conflict with a template means a variation point needs to be made explicit; a conflict with a convention is a documented deviation.

---

# 1) Composition Contract Must Be Declared in the Specification

Each component specification must declare its composition contract under `Composition`.

`Composition` must be an object whose property names are the canonical composition part names.

Part names must follow CSS-selector notation: `{type}.{class}` when the part has a class, or just `{type}` when the type alone is sufficient to identify the part. This convention keeps part names directly traceable to both the realized template element and the CSS selectors that target it.

Each composition definition must include:

- `description`
- `type`

A composition definition may also include:

- `contains`
- `id`
- `class`
- `cached`

Interpretation:

- `description` defines the semantic purpose of the structural part
- `type` defines the structural or element kind used to realize that part
- `contains` defines the direct child parts of that structural part in the composition contract
- `id` and `class` define structural identity where relevant to template realization
- if `contains` is absent, the part is treated as a leaf part in the declared composition
- if `cached` is `true`, the implementation must create a cached element reference for that part on the component instance
- if `cached` is absent or `false`, the part is realized in the template but does not require a cached runtime reference

Framework-injected template infrastructure such as stylesheet link elements is managed through component configuration and must not be declared as a composition part.

Example specification:

```json
"Composition": {
  "template": {
    "description": "The HTML template for the component.",
    "contains": ["div.icon"],
    "type": "template",
    "id": "pin-button"
  },
  "div.icon": {
    "description": "The main container of the component.",
    "contains": ["svg.pinned", "svg.unpinned"],
    "type": "div",
    "class": "icon",
    "cached": true
  },
  "svg.pinned": {
    "description": "The SVG icon used for the pinned mode.",
    "type": "svg",
    "class": "pinned"
  }
}
```

This defines the public structural contract that the implementation must honor.

# 2) Composition Must Describe Structure, Not Behavior

This framework distinguishes:

- `Composition`: the set of structural parts that make up the component and their containment relationships
- `State`: the set of component-owned runtime conditions
- `Data`: the set of component-owned content values
- `Operations`: the set of callable public actions exposed by the component
- `Events`: the set of observable semantic outcomes exposed by the component
- `Gestures`: the set of interaction inputs recognized by the component

Policy:

- composition describes what the component is structurally made of
- composition defines internal parts and their parent-child relationships
- composition may identify structural identity such as `id` or `class` where relevant to template realization
- composition must not be used to declare runtime condition
- composition must not be used to declare component-owned data
- composition must not be used to declare callable behavior
- composition must not be used to declare interaction input
- composition must not be used to declare semantic outcome
- composition must not be used to declare presentation attributes such as `fill`, `height`, `width`, or `viewBox` — these belong to CSS or the template

Examples of valid composition entries:

- `template`
- `div.icon`
- `div.panel`
- `span.label`
- `input.name`
- `svg.pinned`
- `svg.unpinned`

Examples that must not be modeled as composition:

- `visibility`
- `status`
- `mode`
- `metadata` as data content
- `toggle`
- `save`
- `click`
- `hover`
- `onpin`
- `onshow`

Composition therefore defines the structural contract that other policies depend on, but it does not redefine their concerns.

Examples:

- composition may declare that a `span.label` element exists
- data may define the canonical value rendered into that label
- state may determine when that label is shown or hidden
- gestures may target a structural part such as `div.icon` or `button.edit`
- operations may update data or state that affects the rendered structure
- events may report semantic outcomes produced through those other authoritative paths

# 3) Composition Must Be Realized in `<component>.template.html`

Declared composition must be realized concretely in `<component>.template.html`.

The template is the authoritative structural realization of the composition contract.

Policy:

- every declared composition part must be realized in the component template
- the template must preserve the declared parent-child containment relationships from `Composition`
- structural identity declared in the specification, such as `id` or `class`, must be realized in the template where applicable
- the template is the authoritative source of internal component structure
- runtime code, styling, gesture wiring, and DOM synchronization must depend on the realized template structure rather than redefining structure independently
- composition must not be realized through ad hoc manual DOM construction in component logic when the framework template mechanism is the intended structural path

Part names trace directly to template elements and CSS selectors:

| Part name | Template element | CSS selector |
|---|---|---|
| `template` | `<template id="pin-button">` | — |
| `div.icon` | `<div class="icon">` | `.icon` |
| `svg.pinned` | `<svg class="pinned">` | `.pinned` or `svg.pinned` |
| `svg.unpinned` | `<svg class="unpinned">` | `.unpinned` or `svg.unpinned` |

Example:

```html
<template id="pin-button">
  <div class="icon">
    <svg class="pinned">...</svg>
    <svg class="unpinned">...</svg>
  </div>
</template>
```

The implementation therefore follows this structural flow:

```text
Composition specification
  ↓
`<component>.template.html`
  ↓
realized internal DOM structure
  ↓
dependent runtime references / CSS targeting / gesture wiring
```

The template is where the declared composition becomes actual component structure. Other implementation layers may depend on that structure, but they must not become competing sources of structural truth.

# 4) Root Template Identity Must Be Predictably Transformed Across Layers

The root template identity must remain consistent across the specification, metadata, configuration, and template.

This framework uses that identity to keep the composition contract traceable across implementation layers.

Policy:

- the specification must declare the root template identity as part of the `template` composition entry
- metadata must define the canonical template identity through `Tag`
- component configuration must use that canonical `Tag` value as the template id
- `<component>.template.html` must realize that same identity in the root `<template>` element
- root template identity must remain predictably aligned across all composition layers
- root template identity must not drift between specification, metadata, configuration, and template

Transformation pattern:

| Layer | Example |
|---|---|
| Specification | `Composition.template.id = "pin-button"` |
| Metadata | `Tag = "pin-button"` |
| Configuration | `template: { id: Tag }` |
| Template | `<template id="pin-button">` |

Example metadata and configuration pattern:

```typescript
export const Tag = "pin-button" as const;

export const configuration = {
  url: import.meta.url,
  template: {
    id: Tag,
  },
  css: {
    name: "pin.style.css",
  },
} as const;
```

Example template:

```html
<template id="pin-button">
  <div class="icon">...</div>
</template>
```

This predictable transformation keeps the root composition identity directly traceable back to the specification and prevents naming drift across implementation layers.

# 5) Runtime-Relevant Composition Parts Must Be Cached as Explicit Element References

Any composition part declared with `cached: true` must be cached on the component instance as an explicit element reference.

This cached structure is the component's runtime access layer for realized composition. It is derived from the template structure, but it does not need to reproduce the full composition tree.

Policy:

- any composition part declared with `cached: true` must have a cached element reference on the component instance
- cached references must be derived from the realized template structure
- cached references form the runtime access vocabulary for internal structural parts used by the component
- cached references must be explicit rather than relying on repeated ad hoc selector queries at the point of use
- the cache structure does not need to mirror the full composition nesting hierarchy
- a flat cache is valid when it preserves clear and stable traceability back to the declared composition and realized template

Example pattern:

```typescript
protected elements: { icon: HTMLDivElement | null } = { icon: null };
```

Example with multiple cached parts:

```typescript
protected elements = {
  label: null as HTMLElement | null,
  name: null as HTMLInputElement | null,
  edit: null as HTMLElement | null,
  save: null as HTMLElement | null,
  cancel: null as HTMLElement | null,
};
```

Benefits:

- prevents repeated querying
- makes runtime dependencies explicit
- keeps gesture wiring, DOM updates, and internal synchronization traceable to composition
- avoids forcing the runtime cache to duplicate the full composition tree when that would add structural noise without improving clarity

The composition contract defines the full structure. The runtime cache defines only the internal structural references that runtime behavior depends on, as declared by `cached: true` in the specification.

# 6) Cached Element Reference Names Must Prefer the Deepest Unambiguous Composition Name

When a composition part is cached for runtime use, its cached reference name should be derived from the class portion of its CSS-selector part name.

This keeps cached references compact while preserving traceability back to the composition contract and realized template.

Policy:

- cached element reference names must be derived from declared composition parts
- the preferred cached name is the class portion of the part name when it uniquely identifies the runtime-relevant part within the cache
- full structural path naming is not required when the class portion is already unambiguous
- if two or more runtime-relevant parts would produce the same cached name, the implementation must add enough qualification to make the names distinct
- cached reference naming must remain stable and predictable for the declared composition
- cached reference names should remain as small as possible while still being unambiguous

Preferred pattern:

- composition part: `div.icon`
- template realization: `<div class="icon">`
- runtime cache: `elements.icon`

Also valid when qualification is required:

- composition part: `span.title` inside `div.header`
- composition part: `span.title` inside `div.dialog`
- possible runtime cache: `elements.headerTitle`, `elements.dialogTitle`

Examples:

```typescript
protected elements: { icon: HTMLDivElement | null } = { icon: null };
```

```typescript
protected elements = {
  label: null as HTMLElement | null,
  name: null as HTMLInputElement | null,
  edit: null as HTMLElement | null,
  save: null as HTMLElement | null,
  cancel: null as HTMLElement | null,
};
```

In these examples:

- `elements.icon` is derived from part `div.icon` — the class `icon` is the cached name
- `elements.label` is derived from part `span.label` — the class `label` is the cached name
- `elements.panel.metadata.label` is not required because `label` is already unambiguous

The composition contract defines the full structural hierarchy. Cached element reference names define the smallest unambiguous runtime vocabulary derived from that hierarchy.

# 7) Only Composition Parts Declared with `cached: true` Need Cached References

Not every declared composition part requires a cached runtime reference.

The composition contract may describe more structure than runtime logic needs to access directly.

Policy:

- only composition parts declared with `cached: true` must be cached as explicit element references
- a composition part should be declared with `cached: true` when component logic reads from it, writes to it, attaches listeners to it, or otherwise depends on it as an explicit DOM target
- purely structural or presentational descendants do not require `cached: true` when runtime logic does not access them directly
- the absence of `cached: true` does not mean a composition part is absent from the structural contract; it means the part is not part of the component's runtime access layer
- cached references should be limited to the smallest set of structural parts that runtime behavior actually depends on

In `Pin`:

- `div.icon` is declared with `cached: true` because runtime gesture listeners attach to it
- `svg.pinned` does not require `cached: true` when it participates only in structural rendering and CSS-driven visual state
- `svg.unpinned` does not require `cached: true` when it participates only in structural rendering and CSS-driven visual state

In `Title`:

- `span.label` is declared with `cached: true` because runtime logic writes text content to it
- `input.name` is declared with `cached: true` because runtime logic reads, writes, and focuses the input
- `button.edit`, `button.save`, and `button.cancel` are declared with `cached: true` because runtime gesture listeners attach to them
- higher structural containers such as `div.panel`, `div.metadata`, and `div.tasks` do not require `cached: true` when runtime logic does not directly depend on them

Examples:

```typescript
protected elements: { icon: HTMLDivElement | null } = { icon: null };
```

```typescript
protected elements = {
  label: null as HTMLElement | null,
  name: null as HTMLInputElement | null,
  edit: null as HTMLElement | null,
  save: null as HTMLElement | null,
  cancel: null as HTMLElement | null,
};
```

The composition specification defines the full internal structure. The element cache defines only the `cached: true` subset of that structure.

# 8) Composition Must Provide Stable Structural Targets for Other Policies

Composition is the structural foundation that other implementation policies depend on.

Composition does not redefine state, data, operations, events, or gestures. Instead, it provides the stable internal structure that those policies use when they interact with the realized component DOM.

Policy:

- composition must provide stable internal structural targets for runtime concerns defined by other policies
- gesture wiring must attach to structural targets realized through composition
- state-driven styling must target structural parts realized through composition
- data and state synchronization may update structural parts realized through composition
- runtime logic must depend on the realized composition structure rather than inventing separate structural targets ad hoc
- composition remains the authoritative structural contract even when other policies depend on parts of that structure

Example dependency flow:

```text
Composition
  ↓
template structure
  ↓
cached runtime references
  ↓
gesture wiring / DOM synchronization / CSS targeting
```

In `Pin`:

- composition defines `div.icon`, `svg.pinned`, and `svg.unpinned`
- the template realizes those parts
- the component caches `elements.icon` as the runtime gesture target
- gestures attach to `elements.icon`
- CSS targets `.icon`, `.pinned`, and `.unpinned`
- reflected state such as `status` and `visibility` changes how those structural parts are presented

In `Title`:

- composition defines structural parts such as `span.label`, `input.name`, `button.edit`, `button.save`, and `button.cancel`
- the template realizes those parts
- the component caches the `cached: true` subset in `elements`
- gesture wiring attaches to `button.edit`, `button.save`, `button.cancel`, and `input.name`
- DOM synchronization writes to `span.label` and `input.name`
- reflected state such as `mode`, `visibility`, and `content` changes how those structural parts are presented

Composition therefore supplies the structural targets that other policies rely on, while those other policies remain authoritative for behavior, mutation, dispatch, and interaction semantics.

# 9) Composition Should Prefer Structural Minimalism

A component should declare the smallest internal structure necessary to realize its public contract and support its dependent implementation policies.

Composition is a structural contract, not a complete serialization of incidental markup.

Policy:

- composition should include structural parts that are semantically meaningful to the component implementation
- composition should include structural parts that other policies depend on for runtime targeting, DOM synchronization, or CSS/state-driven presentation
- composition should avoid declaring incidental markup that carries no meaningful structural role in the component contract
- composition should avoid unnecessary wrapper layers when they do not contribute structural meaning
- composition should remain small enough to stay traceable across specification, template, runtime references, and dependent policies
- composition minimalism must not remove structural parts that are required by runtime logic, styling, or the declared structural contract
- framework-injected template infrastructure such as stylesheet link elements is not a declared composition part

Examples of composition parts that are often worth declaring:

- root template parts
- interactive containers
- named display surfaces
- editable form surfaces
- task or action targets
- structural variants that state-driven styling depends on

Examples of structure that may remain implicit unless it carries contract value:

- incidental wrapper elements with no runtime or styling role
- leaf SVG internals such as `path` when no other policy depends on them directly
- markup introduced only for formatting convenience without structural meaning
- framework-injected infrastructure managed through component configuration

In `Pin`, the composition remains intentionally small:

- one root `template`
- one interactive container `div.icon`
- two visual variants `svg.pinned` and `svg.unpinned`

In `Title`, the composition may be broader because more runtime and styling concerns depend on internal structure, but it should still stop at the level where structural parts remain meaningful to the component contract.

Composition should therefore be as small as possible, but no smaller than the structure required to keep the component's contract explicit and its dependent policies traceable.

# 10) Composition Must Separate Structural Parts from Visual Styling

Composition defines structure. CSS defines presentation.

A composition entry may identify structural parts that styling depends on, but composition itself must not become a styling contract.

Policy:

- composition must define the existence and structural role of internal parts
- composition may identify structural identity such as `class` or `id` when that identity is part of template realization
- composition must not define presentation rules, visual appearance, or styling behavior
- composition must not declare presentation attributes such as `fill`, `height`, `width`, `viewBox`, or `stroke` — these belong to CSS or the template
- CSS must remain the authoritative layer for presentation concerns
- state-reflective styling may target composition parts, but the styling logic itself belongs to CSS rather than to composition
- composition may declare that a structural part exists; CSS may define how that part appears in different states or interaction conditions

Examples:

- composition says that a `div.icon` part exists
- CSS says how `.icon` looks
- composition says that `svg.pinned` and `svg.unpinned` exist
- CSS says when `.pinned` and `.unpinned` are shown or hidden
- composition says that `span.label`, `input.name`, `button.edit`, `button.save`, and `button.cancel` exist
- CSS says how those parts are laid out and how state such as `mode`, `content`, or `visibility` affects presentation

Example CSS:

```css
:host([status="pinned"]) .pinned {
  display: inline-block;
}

:host([status="pinned"]) .unpinned {
  display: none;
}

:host([mode="view"]) .label {
  display: block;
}

:host([mode="view"]) .name {
  display: none;
}
```

Composition therefore provides the stable structural targets that styling depends on, while CSS remains the authoritative implementation layer for presentation.

# 11) Composition Must Be Realized Through the Framework Template Mechanism

Composition must be implemented through the framework's template-loading mechanism rather than through ad hoc DOM construction in component logic.

The framework template mechanism is the authoritative implementation path for realizing declared component composition.

Policy:

- declared composition must be realized through `<component>.template.html`
- the component class must use the framework template-loading mechanism to realize that template
- component logic must not become a competing source of structural truth by manually constructing the declared internal DOM tree
- runtime logic may cache, read, update, or attach listeners to realized structural parts, but it should depend on the realized template rather than constructing those parts imperatively
- composition remains declarative when structure is defined in the template and loaded through the framework mechanism

Example pattern:

```typescript
public static Template = new Template(import.meta.url);

constructor() {
  super(configuration);
}
```

Example configuration:

```typescript
export const configuration = {
  url: import.meta.url,
  template: {
    id: Tag,
  },
  css: {
    name: "pin.style.css",
  },
} as const;
```

This ensures:

- composition remains declarative
- the template remains the canonical source of internal structure
- component logic remains focused on runtime behavior rather than DOM construction
- the implementation stays traceable from composition specification to template realization to runtime access

The composition flow is therefore:

```text
Composition specification
  ↓
`<component>.template.html`
  ↓
framework template-loading mechanism
  ↓
realized internal DOM structure
```

The framework template mechanism is the authoritative path by which declared composition becomes actual component structure.

# 12) Composition Changes Must Be Treated as Contract Changes

If a declared composition part is referenced by runtime logic, styling, or other framework policies, changing that part is a contract-level change.

Composition is the authoritative structural contract. Changes to that contract must be reflected consistently across all dependent implementation layers.

Policy:

- renaming, removing, reparenting, or changing the structural identity of a declared composition part must be treated as a composition contract change
- a composition contract change must be reflected consistently in the specification, template, runtime cache, styling, and any dependent policy implementations
- runtime references must not continue to depend on outdated structural names or selectors after a composition contract change
- styling must not continue to target outdated structural identities after a composition contract change
- gesture wiring, DOM synchronization, and other runtime logic must remain aligned with the updated realized composition
- composition changes must preserve cross-layer traceability after the update

Examples of contract-impacting changes:

- renaming `div.icon` to `button.icon`
- changing `.icon` to a different structural identity without updating runtime references
- removing `svg.pinned` while CSS still depends on `.pinned`
- renaming `span.label` to `span.title` while runtime logic still writes to `elements.label`
- changing the structure so that `button.edit`, `button.save`, or `button.cancel` no longer match their cached references or listener targets

Examples of layers that may require coordinated updates:

- `Composition` in the specification
- `<component>.template.html`
- cached runtime references in `elements`
- selector-based styling in `<component>.style.css`
- gesture listener wiring and DOM synchronization in `<component>.ts`

Composition changes therefore must be treated with the same discipline as changes to state contracts, data contracts, event contracts, operation contracts, or gesture contracts: dependent implementation layers must be updated together so the component remains predictable and internally consistent.

---

# Policy Applied to Specification

Specification fragment:

```json
{
  "Composition": {
    "template": {
      "description": "The HTML template for the pin component.",
      "contains": ["div.icon"],
      "type": "template",
      "id": "pin-button"
    },
    "div.icon": {
      "description": "The main container of the pin component, styled as a button.",
      "contains": ["svg.pinned", "svg.unpinned"],
      "type": "div",
      "class": "icon",
      "cached": true
    },
    "svg.pinned": {
      "description": "The SVG icon used for the pinned mode.",
      "type": "svg",
      "class": "pinned"
    },
    "svg.unpinned": {
      "description": "The SVG icon used for the unpinned mode.",
      "type": "svg",
      "class": "unpinned"
    }
  }
}
```

How this specification is implemented:

- every declared composition part is realized in `<component>.template.html`
- the root template identity is predictably transformed across specification, metadata, configuration, and template
- the framework template mechanism is the authoritative realization path for declared composition
- only the composition parts declared with `cached: true` are cached as explicit element references
- cached element reference names are derived from the class portion of the CSS-selector part name
- other policies such as gestures, state-reflective styling, and runtime DOM synchronization depend on the realized composition structure, but do not redefine it

Applied to `Pin`:

- `template`
    - declared in the specification with `id: "pin-button"`
    - realized by `<template id="pin-button">`
    - mapped through `Tag = "pin-button"`
    - loaded through component configuration with `template: { id: Tag }`
- `div.icon`
    - declared as a structural child of `template` with `cached: true`
    - realized by `<div class="icon">`
    - cached as `elements.icon` — the class `icon` is the cached name
    - used as the runtime gesture target
- `svg.pinned`
    - declared as a structural child of `div.icon`
    - realized by `<svg class="pinned">`
    - not declared with `cached: true` — participates in CSS-controlled visual state rendering only
- `svg.unpinned`
    - declared as a structural child of `div.icon`
    - realized by `<svg class="unpinned">`
    - not declared with `cached: true` — participates in CSS-controlled visual state rendering only

Implementation:

```typescript
export const Tag = "pin-button" as const;

export const configuration = {
  url: import.meta.url,
  template: {
    id: Tag,
  },
  css: {
    name: "pin.style.css",
  },
} as const;

export class Pin extends Component {
  protected elements: { icon: HTMLDivElement | null } = { icon: null };

  public static Template = new Template(import.meta.url);

  constructor() {
    super(configuration);
  }
}
```

Template:

```html
<template id="pin-button">
  <div class="icon">
    <svg class="pinned">...</svg>
    <svg class="unpinned">...</svg>
  </div>
</template>
```

How the implementation applies the policy:

- the specification defines the structural contract under `Composition`
- part names follow CSS-selector notation — each name traces directly to its template element and CSS selector
- the root template identity is declared in the specification and predictably transformed into metadata, configuration, and template realization
- `<component>.template.html` is the authoritative structural realization of the declared composition
- the framework template-loading mechanism realizes that declared structure without requiring manual DOM construction in component logic
- `elements.icon` is the only cached reference, derived from the class of `div.icon`, because it is the only part declared with `cached: true`
- `svg.pinned` and `svg.unpinned` remain part of the declared and realized composition even though they are not cached
- gesture wiring and CSS styling depend on the realized structural parts defined by composition

The important transformation is therefore:

```text
Composition specification
  ↓
template identity mapping
  ↓
`<component>.template.html`
  ↓
framework template-loading mechanism
  ↓
realized internal DOM structure
  ↓
cached: true references / CSS targeting / gesture wiring
```

---

# Policy Checklist

A compliant component must:

1. Declare composition under `Composition` in the specification.
2. Define each composition part using the required specification contract.
3. Name composition parts using CSS-selector notation — `{type}.{class}` when a class distinguishes the part, or `{type}` when the type alone is sufficient.
4. Distinguish composition from state, data, operations, events, and gestures.
5. Avoid declaring presentation attributes such as `fill`, `height`, `width`, or `viewBox` in composition — these belong to CSS or the template.
6. Avoid declaring framework-injected infrastructure such as stylesheet link elements as composition parts.
7. Realize every declared composition part in `<component>.template.html`.
8. Preserve declared parent-child containment relationships in the realized template.
9. Keep root template identity predictably aligned across specification, metadata, configuration, and template.
10. Use the framework template-loading mechanism as the authoritative realization path for declared composition.
11. Avoid manual component-side DOM construction as a competing source of structural truth for declared composition.
12. Declare `cached: true` on every composition part that runtime logic reads from, writes to, attaches listeners to, or otherwise depends on as an explicit DOM target.
13. Cache every composition part declared with `cached: true` as an explicit element reference on the component instance.
14. Derive cached element reference names from the class portion of the CSS-selector part name.
15. Add qualification to cached element reference names only when needed to avoid ambiguity.
16. Cache only the `cached: true` subset of declared composition.
17. Treat uncached composition parts as still part of the structural contract when they are realized in the template.
18. Provide stable structural targets for gesture wiring, DOM synchronization, and CSS/state-reflective styling.
19. Keep runtime logic dependent on realized composition rather than inventing ad hoc structural targets.
20. Prefer structural minimalism in the declared composition.
21. Avoid declaring incidental markup that carries no meaningful contract value.
22. Keep composition separate from visual styling concerns.
23. Keep CSS as the authoritative layer for presentation.
24. Treat renames, removals, reparenting, or structural identity changes of declared composition parts as contract changes.
25. Reflect composition contract changes consistently across specification, template, runtime cache, styling, and dependent policy implementations.
26. Preserve cross-layer traceability from composition specification to template realization to runtime access.

---

# Component Composition Specification Schema

JSON Schema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://scalable.software/schema/component-composition.schema.json",
  "title": "Component Composition",
  "description": "Schema for the Composition object in a component specification.",
  "type": "object",
  "propertyNames": {
    "type": "string",
    "minLength": 1,
    "description": "Canonical composition part name in CSS-selector notation. Use {type}.{class} when a class distinguishes the part (for example: div.icon, svg.pinned, span.label, button.save), or {type} when the type alone is sufficient (for example: template)."
  },
  "additionalProperties": {
    "type": "object",
    "description": "A composition part definition.",
    "required": ["description", "type"],
    "additionalProperties": false,
    "properties": {
      "description": {
        "type": "string",
        "minLength": 1,
        "description": "Human-readable description of the structural part."
      },
      "type": {
        "type": "string",
        "minLength": 1,
        "description": "Structural or element kind used to realize this part, for example: template, div, span, input, button, svg."
      },
      "contains": {
        "type": "array",
        "description": "Ordered list of direct child composition parts contained by this structural part.",
        "minItems": 1,
        "items": {
          "type": "string",
          "minLength": 1,
          "description": "Canonical composition part name of a direct child."
        }
      },
      "id": {
        "type": "string",
        "minLength": 1,
        "description": "Structural identity used when the realized template part is identified by id."
      },
      "class": {
        "type": "string",
        "minLength": 1,
        "description": "Structural identity used when the realized template part is identified by class."
      },
      "cached": {
        "type": "boolean",
        "description": "When true, the implementation must create a cached element reference for this part on the component instance. Declare cached: true on every part that runtime logic reads from, writes to, or attaches listeners to."
      }
    }
  }
}
```

Example JSON:

```json
{
  "Composition": {
    "template": {
      "description": "The HTML template for the pin component.",
      "contains": ["div.icon"],
      "type": "template",
      "id": "pin-button"
    },
    "div.icon": {
      "description": "The main container of the pin component, styled as a button.",
      "contains": ["svg.pinned", "svg.unpinned"],
      "type": "div",
      "class": "icon",
      "cached": true
    },
    "svg.pinned": {
      "description": "The SVG icon used for the pinned mode.",
      "type": "svg",
      "class": "pinned"
    },
    "svg.unpinned": {
      "description": "The SVG icon used for the unpinned mode.",
      "type": "svg",
      "class": "unpinned"
    }
  }
}
```

Example JSON with a richer component:

```json
{
  "Composition": {
    "template": {
      "description": "The HTML template for the title component.",
      "contains": ["div.panel"],
      "type": "template",
      "id": "app-title"
    },
    "div.panel": {
      "description": "The root panel of the title component.",
      "contains": ["div.metadata", "div.tasks"],
      "type": "div",
      "class": "panel"
    },
    "div.metadata": {
      "description": "The metadata display and editing region.",
      "contains": ["span.label", "input.name"],
      "type": "div",
      "class": "metadata"
    },
    "span.label": {
      "description": "The label used to display the current title.",
      "type": "span",
      "class": "label",
      "cached": true
    },
    "input.name": {
      "description": "The input used to edit the current title.",
      "type": "input",
      "class": "name",
      "cached": true
    },
    "div.tasks": {
      "description": "The task action container.",
      "contains": ["button.edit", "button.cancel", "button.save"],
      "type": "div",
      "class": "tasks"
    },
    "button.edit": {
      "description": "The button used to enter edit mode.",
      "type": "button",
      "class": "edit",
      "cached": true
    },
    "button.cancel": {
      "description": "The button used to cancel editing.",
      "type": "button",
      "class": "cancel",
      "cached": true
    },
    "button.save": {
      "description": "The button used to save editing.",
      "type": "button",
      "class": "save",
      "cached": true
    }
  }
}
```
