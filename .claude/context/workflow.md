# Workflow

This document defines the **workflow policy** for component development. It specifies how implementation proceeds from feature branch creation through to merge — the sequence of commits within a feature, the ordering of concerns across the policy hierarchy, the structure of every commit message, and the conventions that govern the entire development flow.

This document is intentionally **workflow** only, but part of a set of implementation policies which together define the policies which should be followed to transform specifications into an implementation which is predictable, maintainable, and production-ready at scale.

Testing patterns, unit test structure, and TDD discipline are covered in a separate testing policy.

---

# How to Read This Policy

Rules in this policy fall into three strengths. Read each rule with its strength in mind:

- **Principles** are non-negotiable. They derive from framework correctness or TDD discipline and hold for every component. A conflict with a principle is a defect.
- **Templates** are invariant skeletons with explicit variation points. The skeleton applies to every component; specific steps activate or deactivate based on the component's declared classification (e.g., attribute-backed vs non-attribute, readonly vs writable, payload-bearing vs payload-free). Variation is part of the template, not a deviation from it.
- **Conventions** are canonical defaults that keep implementations readable across components. A second component may deviate when its shape genuinely warrants it; the deviation should be explained at review time, not forbidden by the policy.

When applying this policy to a new component, classify each rule before reconciling conflicts. A conflict with a principle is a defect; a conflict with a template means a variation point needs to be made explicit; a conflict with a convention is a documented deviation.

---

# 1) Every Feature Is Developed on an Isolated Branch

Each new feature is developed in isolation on a dedicated feature branch created from main.

A feature branch:

- is created from the main branch before any work begins
- contains all commits belonging to a single feature cycle
- is merged into main via a `FEATURE` commit

The `FEATURE` commit is always the last commit on the feature branch. It marks the boundary of the cycle and the merge point back into main.

No behavioral work is committed directly to main. Direct commits to main are limited to non-feature concerns such as `PACKAGE`, `TYPES`, post-merge naming corrections, version bumps, or refactors.

# 2) Every Commit Must Use a Canonical Prefix

Every commit message must begin with a canonical prefix from the following fixed vocabulary:

| Prefix           | Domain                                                                                                        |
| ---------------- | ------------------------------------------------------------------------------------------------------------- |
| `COMPOSITION`    | DOM structure and cached element references                                                                   |
| `STATE`          | State contract — metadata, type, enum values, getter, setter, mutation, attribute sync                        |
| `VALIDATION`     | Input validation — `Validate` class methods and error boundaries (including setter-level invalid-value tests) |
| `OPERATION`      | Public methods — metadata, existence, and behavioral outcome                                                  |
| `EVENT`          | Event contract — metadata, setter, handler behavior, and payload                                              |
| `GESTURE`        | Interaction wiring — metadata and behavioral outcome                                                          |
| `DATA`           | Component-owned data contract                                                                                 |
| `STYLE`          | CSS rules                                                                                                     |
| `SPECIFICATIONS` | Component specification document                                                                              |
| `TESTING`        | Test vocabulary corrections                                                                                   |
| `DOCUMENTATION`  | Generated API documentation                                                                                   |
| `FEATURE`        | Feature boundary marker                                                                                       |
| `PACKAGE`        | Package metadata                                                                                              |
| `CONFIG`         | Test and build infrastructure                                                                                 |
| `TYPES`          | TypeScript type definitions independent of runtime behavior                                                   |

The prefix identifies the concern domain of the commit. It must always be uppercase and must be the first token in the commit message, followed by `: `.

Every commit must use exactly one prefix. The `Initial commit` and version-tag commits (e.g. `0.1.0`) are the only permitted exceptions.

`CONFIG`, `TYPES`, `TESTING`, and refactor prefixes are reserved for their respective concerns and may not appear in every feature cycle.

# 3) Every Behavioral Change Requires a FAIL/PASS Commit Pair

Every behavioral change — `COMPOSITION`, `STATE`, `VALIDATION`, `OPERATION`, `EVENT`, `GESTURE`, or `DATA` — must be introduced as a FAIL/PASS commit pair.

Structure:

- The `FAIL` commit introduces the test that describes the expected behavior. The test must fail at the point of commit.
- The `PASS` commit introduces the minimum implementation required to make the test pass. The test must pass at the point of commit.

Rules:

- The `FAIL` commit must precede the `PASS` commit.
- The `FAIL` and `PASS` commits must always be adjacent — no other commits may appear between them.
- Every `FAIL` must have a corresponding `PASS`.
- No behavioral implementation may be committed without a preceding `FAIL` commit.

`STYLE`, `SPECIFICATIONS`, `DOCUMENTATION`, `FEATURE`, `PACKAGE`, `CONFIG`, `TYPES`, `TESTING`, and refactor commits do not require a FAIL/PASS pair.

# 4) The Feature Development Sequence Is Policy-Ordered

Within a behavioral feature, commits must follow this canonical order:

```
COMPOSITION
STATE
VALIDATION
OPERATION
EVENT
STYLE  (state-driven)
GESTURE
DOCUMENTATION
FEATURE
```

This ordering reflects the dependency structure of the implementation. Each layer depends on the layers above it, so work proceeds top-down through the policy hierarchy.

`STYLE` for state-driven rules appears after `EVENT` because the visual states it reflects are fully established only once the state and event contracts are in place.

`GESTURE` follows state-driven `STYLE` because gesture wiring depends on cached element references, which in turn depend on the composition being final.

Deviations from this order are permitted only under the just-in-time rule (see Section 14).

# 5) COMPOSITION Commits Follow an Outside-In Structural Order

`COMPOSITION` commits introduce structural DOM parts and cached element references.

Within a feature, `COMPOSITION` commits must precede all other behavioral commits, except for the cached-reference commit which is placed just-in-time between `GESTURE` metadata and `GESTURE` behavior (see Section 10).

Ordering rules:

- Container elements are introduced before their children.
- Parent-child structural relationships use the word `contains` in the commit description.
- Cached element references are a `COMPOSITION` concern and must use the `COMPOSITION` prefix.

Example:

```
COMPOSITION: `pin.root` contains `div.icon` -> FAIL
COMPOSITION: `pin.root` contains `div.icon` -> PASS
COMPOSITION: `div.icon` contains `svg.unpinned` -> FAIL
COMPOSITION: `div.icon` contains `svg.unpinned` -> PASS
```

Structural parts are added incrementally across features. Only the parts required by the current feature are introduced in that feature's cycle.

# 6) STATE Commits Follow a Fixed Coverage Sequence

For each state property introduced in a feature, `STATE` commits must follow this order:

1. **Metadata pair** — `Attributes.X` and `State.X` tested together in one commit
2. **Type** — the value-domain type for the state property (e.g. `Visibility`, `Status`)
3. **Enum values** — tested in source-declaration order (the order they appear in `<component>.meta.ts`)
4. **Getter existence**
5. **Default value** — the internal runtime default returned by the getter
6. **Attribute default** — only when the attribute is compulsory and always written to the DOM (two commits: `<attribute> attribute exists` and `<attribute> attribute is <default>`)
7. **Setter existence**
8. **Mutation persists** — setting the value via the setter updates the internal state
9. **Null normalization** — only when the setter normalizes `null` to a default value
10. **Attribute synchronization (state → attribute)** — setter assignment updates the DOM attribute
11. **Attribute synchronization (attribute → state)** — `setAttribute` drives the getter

Steps 6 and 9 are conditional:

- Include attribute-default only when the attribute is compulsory and always present in the DOM.
- Include null normalization only when the setter contains normalization logic (`value ?? default`).

The validation-boundary commit — `set <component>.<state> to invalid throws error` — is logically a STATE-layer assertion but is committed under the `VALIDATION:` prefix. It appears immediately after the `VALIDATION` method-existence and method-error commits (see Section 7).

# 7) VALIDATION Commits Are Placed Between STATE and OPERATION

`VALIDATION` commits introduce the `Validate` class methods that enforce input boundaries.

Within a feature, `VALIDATION` commits appear after the main body of `STATE` commits and before `OPERATION` commits.

The validation block has three commit pairs:

1. `VALIDATION: \`Validate.x\` static method exists`— verifies the method on the`Validate` class
2. `VALIDATION: \`Validate.x(value)\` throws error if \`value\` is \`invalid\`` — verifies the validator-level error
3. `VALIDATION: set \`pin.x\` to \`invalid\` throws error` — verifies that the setter propagates the validator error

The third commit is the setter-level validation boundary. Although it asserts on the STATE setter, it remains conceptually part of the validation contract and uses the `VALIDATION:` prefix.

Sequence:

```
STATE: ... (main body, steps 1-11 excluding the boundary)
VALIDATION: `Validate.x` static method exists -> FAIL/PASS
VALIDATION: `Validate.x(value)` throws error if `value` is `invalid` -> FAIL/PASS
VALIDATION: set `pin.x` to `invalid` throws error -> FAIL/PASS
OPERATION: ...
```

# 8) OPERATION Commits Follow a Semantic-Group Batch-Then-Sequence Pattern

Operations are grouped semantically — paired operations such as `hide`/`show` or `pin`/`unpin` belong to one group; composite or derived operations such as `toggle` belong to a separate group.

For each semantic group:

1. Test all metadata constants for the group first — all `Operation.X exists` commits for the group appear before any method or behavior commit in that group.
2. For each operation in the group: method exists → `Invoke` behavior.

Behavior commit rules:

- Use `Invoke` as the uniform verb for all operation behavior commits.
- Include a precondition in the commit description when the operation is only semantically meaningful from a specific prior state (e.g., `show` requires the component to already be hidden).
- Omit the precondition when the operation can be meaningfully called from the default state.
- When an operation covers a bidirectional transition, state both directions in one commit description using `from X to Y and visa versa`.

Example — paired group followed by composite group:

```
OPERATION: `Operation.PIN` exists -> FAIL/PASS
OPERATION: `Operation.UNPIN` exists -> FAIL/PASS
OPERATION: `pin.pin` method exists -> FAIL/PASS
OPERATION: Invoke `pin.pin` sets `pin.status` to `Status.PINNED` -> FAIL/PASS
OPERATION: `pin.unpin` method exists -> FAIL/PASS
OPERATION: Invoke `pin.unpin` when `pin.status` is `Status.PINNED` sets `pin.status` to `Status.UNPINNED` -> FAIL/PASS
OPERATION: `Operation.TOGGLE` exists -> FAIL/PASS
OPERATION: `pin.toggle` method exists -> FAIL/PASS
OPERATION: Invoke `pin.toggle` toggles `pin.status` from `Status.UNPINNED` to `Status.PINNED` and visa versa -> FAIL/PASS
```

# 9) EVENT Commits Follow a Three-Per-Event Pattern

For each semantic event group, `EVENT` commits follow this pattern:

1. Test all event metadata constants for the group first — all `Event.ON_X exists` commits for the group appear before any setter, handler, or payload commit.
2. For each event in the group, three behavioral commit pairs:
   - **Setter existence** — `pin.on{x} setter exists`
   - **Handler trigger** — `pin.on{x} listener is called when pin.<state> changes from <Before> to <After>`
   - **Payload contract** — `When pin.on{x} listener is called then it is called with \`{ detail: { ... } }\``

Handler-trigger commit rules:

- Describe the full state transition using `from X to Y` phrasing.
- The direction must be explicit in the commit description — the before and after state values must both be named.

Example:

```
EVENT: `Event.ON_HIDE` exists -> FAIL/PASS
EVENT: `Event.ON_SHOW` exists -> FAIL/PASS
EVENT: `pin.onhide` setter exists -> FAIL/PASS
EVENT: `pin.onhide` listener is called when `pin.visibility` changes from `Visibility.VISIBLE` to `Visibility.HIDDEN` -> FAIL/PASS
EVENT: When `pin.onhide` listener is called then it is called with `{ detail: { visibility: Visibility.HIDDEN } }` -> FAIL/PASS
EVENT: `pin.onshow` setter exists -> FAIL/PASS
EVENT: `pin.onshow` listener is called when `pin.visibility` changes from `Visibility.HIDDEN` to `Visibility.VISIBLE` -> FAIL/PASS
EVENT: When `pin.onshow` listener is called then it is called with `{ detail: { visibility: Visibility.VISIBLE } }` -> FAIL/PASS
```

# 10) GESTURE Commits Bracket the COMPOSITION Cached Reference

`GESTURE` commits introduce interaction wiring.

Within a feature, `GESTURE` commits appear after `STYLE` and before `DOCUMENTATION`.

The `COMPOSITION` cached element reference commit is placed just-in-time between the gesture metadata commit and the gesture behavior commit — not at the start of the feature cycle — because the cache is the direct prerequisite for listener wiring and not needed before that point.

Order:

```
GESTURE: `Gesture.X` exists -> FAIL/PASS
COMPOSITION: `pin.elements.x` is a cached reference to the `<element>` with class `<class>` -> FAIL/PASS
GESTURE: `Gesture.X` on `<element>` with class `<class>` <behavior> -> FAIL/PASS
```

GESTURE behavior descriptions identify the realized DOM element using selector phrasing (`\`div\` with class \`icon\``), not by the cached reference name. This keeps the commit description aligned with how the test exercises the interaction — by querying the realized DOM.

When a gesture behavior covers a bidirectional toggle, both directions are stated in a single behavior commit description using `from X to Y and visa versa`.

Example:

```
GESTURE: `Gesture.CLICK` exists -> FAIL/PASS
COMPOSITION: `pin.elements.icon` is a cached reference to the `div` with class `icon` -> FAIL/PASS
GESTURE: `Gesture.CLICK` on `div` with class `icon` toggle `pin.status` from `Status.UNPINNED` to `Status.PINNED` and visa versa -> FAIL/PASS
```

# 11) STYLE Commits Are Placed at the Point of Visual Readiness

`STYLE` commits are placed at the earliest point in the feature cycle where the elements and state they depend on are fully established.

Two placement rules apply:

- **Base element styles** — styles that apply to DOM elements with no state dependency may be committed immediately after the `COMPOSITION` commits that establish those elements. These can appear before `STATE` commits if the elements already exist.
- **State-driven styles** — styles whose selectors depend on state attributes (`:host([attribute="value"])`) must appear after all `EVENT` commits for that state, since the full state contract must be in place before its visual representation is added.

All `STYLE` commits must appear before `DOCUMENTATION`.

`STYLE` commit rules:

- `STYLE` commits never have a FAIL/PASS pair.
- Use `Define` for base element styles — rules with no state dependency that establish a default appearance for a structural part.
- Use `Add` for state-driven styles, media-query styles, hover/focus styles, and any style that extends an existing visual contract.
- One selector (or one logically-grouped selector list bound to a single rule) per commit. Complementary visual states (e.g., pinned rules and unpinned rules) are separated into distinct `STYLE` commits.
- `@media` blocks are committed per rule inside the block — the media query is part of the commit description, not a wrapper around multiple selector commits.

Examples:

```
STYLE: Define `svg` style
STYLE: Define `.icon` style
STYLE: Add `:host([visibility="hidden"])` style
STYLE: Add `:host([status="pinned"]) .icon` style
STYLE: Add `@media (hover: hover) .icon:hover svg` style
STYLE: Add `@media (prefers-color-scheme: dark) :host` style
```

# 12) CSS-Only Features Follow a Collapsed Sequence

When a feature introduces only visual changes with no new behavioral contract, it follows a collapsed cycle with no `FAIL/PASS` pairs and no `DOCUMENTATION` commit:

```
STYLE
FEATURE
```

This applies to features whose entire change is within CSS — such as hover responsiveness or dark mode support. No behavioral commit sequence is required.

# 13) DOCUMENTATION Closes Every Behavioral Feature

After all `FAIL/PASS` pairs and `STYLE` commits are complete, the behavioral feature cycle closes with:

```
DOCUMENTATION
FEATURE
```

Rules:

- `DOCUMENTATION` is always generated after implementation is complete. It must not precede any behavioral commits.
- `FEATURE` follows `DOCUMENTATION`. It is the boundary commit for the branch.

# 14) Just-in-Time Addition of Infrastructure and Composition

Not all `COMPOSITION` parts and `CONFIG` infrastructure are added at the start of a feature cycle. They are added at the earliest point in the sequence where they become necessary.

Rules:

- A `CONFIG` commit introducing test infrastructure appears immediately before the first commit that requires it.
- A `COMPOSITION` commit for a structural part appears at the start of the feature cycle that first requires that part.
- A `COMPOSITION` cached reference commit appears between `GESTURE` metadata and `GESTURE` behavior — not at the start of the cycle — because the cache is the direct prerequisite for listener wiring.

The just-in-time principle avoids speculative additions and keeps every commit traceable to the specific need that drove it.

# 15) Commit Messages Must Follow a Canonical Format

Every commit message must conform to one of the following formats:

**Behavioral commit (FAIL):**

```
{PREFIX}: {description} -> FAIL
```

**Behavioral commit (PASS):**

```
{PREFIX}: {description} -> PASS
```

**Non-behavioral commit:**

```
{PREFIX}: {description}
```

Formatting rules within descriptions:

- Code references — types, values, methods, attributes — must be wrapped in backticks.
- Structural relationships use `contains` as the verb.
- Operation behavior commits begin with `Invoke`.
- Event handler behavior commits include `from X to Y` for state transitions.
- Event payload commits begin with `When ... listener is called then it is called with` followed by the backticked `{ detail: { ... } }` payload.
- Gesture behavior commits identify the target element by selector phrasing (`\`div\` with class \`icon\``), not by cached reference name.
- Bidirectional toggle behaviors state both directions: `from X to Y and visa versa`.
- Preconditions use `when {subject} is {value}` phrasing.

# 16) Commit-Message Hygiene Is a Reviewable Concern

Commit messages are part of the historical record and must be reviewed with the same discipline as code.

Policy:

- The `{PREFIX}: ` token must not be omitted from a behavioral commit.
- State values, event names, and operation names referenced in the description must match the values actually exercised by the test and the implementation.
- Typos in the feature name (the `FEATURE: ` boundary commit) must be corrected before merge.
- A commit message that misnames a state value, event handler, or operation is a defect even if the test and implementation are correct.

A standalone `TESTING: Update naming convention` commit may be used to correct historical commit-message drift only when the drift is in the test vocabulary itself. Correcting an isolated commit-message typo retroactively is not in scope — the discipline is to catch it before merge.

# 17) Naming Convention Corrections Are Standalone Commits

When test vocabulary drifts and requires correction, the correction is committed as a standalone `TESTING: Update naming convention` commit.

This commit must not be bundled with behavioral changes. It is standalone.

# 18) Refactor Commits Use the Domain Prefix

When implementation is refactored without changing behavior:

- Use the domain prefix of the area being refactored (`STATE: refactor ...`, not a separate `REFACTOR` prefix)
- Include `refactor` as a verb in the commit message body
- Do not use a FAIL/PASS pair — behavior does not change under a refactor

# 19) Non-Behavioral Prefixes Have Dedicated Scopes

Non-behavioral concerns use their own prefixes and are not embedded in behavioral commit sequences:

- `SPECIFICATIONS` — Component specification document. Appears at project initialization when the canonical specification is added or when the specification is updated independently of implementation.
- `TYPES` — TypeScript type changes independent of runtime behavior. May appear post-feature when a type correction is identified after merge.
- `PACKAGE` — Package metadata. Appears at project initialization or when package configuration changes.
- `CONFIG` — Test and build infrastructure. Added just-in-time when a new capability is needed.

---

# Policy Applied to Specification

The Pin component was developed across four feature cycles. The following shows how the workflow policy maps onto each cycle.

## Project Initialization

Direct commits to main:

```
Initial commit
SPECIFICATIONS: Add `pin.specifications.json`
PACKAGE: Update package metadata
DOCUMENTATION: Generate API Docs
```

## Feature: Visibility Control

Branch: `feature/visibility-control`

Behavioral feature — full cycle:

```
COMPOSITION: `pin.root` contains `div.icon` -> FAIL/PASS
COMPOSITION: `div.icon` contains `svg.unpinned` -> FAIL/PASS
STYLE: Define `.icon` style
STYLE: Define `svg` style
STATE: `Attributes.VISIBILITY` and `State.VISIBILITY` exists -> FAIL/PASS
STATE: `Visibility` exists -> FAIL/PASS
STATE: `Visibility.VISIBLE` exists -> FAIL/PASS
STATE: `Visibility.HIDDEN` exists -> FAIL/PASS
STATE: `pin.visibility` getter exists -> FAIL/PASS
STATE: `pin.visibility` getter returns `Visibility.VISIBLE` -> FAIL/PASS
STATE: `pin.visibility` setter exists -> FAIL/PASS
STATE: set `pin.visibility` to `Visibility.HIDDEN` updates state -> FAIL/PASS
STATE: set `pin.visibility` to `null` updates state to `Visibility.VISIBLE` -> FAIL/PASS
STATE: set `pin.visibility` to `Visibility.HIDDEN` updates attribute -> FAIL/PASS
STATE: set `visibility` attribute to `Visibility.HIDDEN` updates state -> FAIL/PASS
VALIDATION: `Validate.visibility` static method exists -> FAIL/PASS
VALIDATION: `Validate.visibility(value)` throws error if `value` is `invalid` -> FAIL/PASS
VALIDATION: set `pin.visibility` to `invalid` throws error -> FAIL/PASS
OPERATION: `Operation.HIDE` exists -> FAIL/PASS
OPERATION: `Operation.SHOW` exists -> FAIL/PASS
OPERATION: `pin.hide` method exists -> FAIL/PASS
OPERATION: Invoke `pin.hide` sets `pin.visibility` to `Visibility.HIDDEN` -> FAIL/PASS
OPERATION: `pin.show` method exists -> FAIL/PASS
OPERATION: Invoke `pin.show` when `pin.visibility` is `Visibility.HIDDEN` sets `pin.visibility` to `Visibility.VISIBLE` -> FAIL/PASS
EVENT: `Event.ON_HIDE` exists -> FAIL/PASS
EVENT: `Event.ON_SHOW` exists -> FAIL/PASS
EVENT: `pin.onhide` setter exists -> FAIL/PASS
EVENT: `pin.onhide` listener is called when `pin.visibility` changes from `Visibility.VISIBLE` to `Visibility.HIDDEN` -> FAIL/PASS
EVENT: When `pin.onhide` listener is called then it is called with `{ detail: { visibility: Visibility.HIDDEN } }` -> FAIL/PASS
EVENT: `pin.onshow` setter exists -> FAIL/PASS
EVENT: `pin.onshow` listener is called when `pin.visibility` changes from `Visibility.HIDDEN` to `Visibility.VISIBLE` -> FAIL/PASS
EVENT: When `pin.onshow` listener is called then it is called with `{ detail: { visibility: Visibility.VISIBLE } }` -> FAIL/PASS
STYLE: Add `:host([visibility="hidden"])` style
DOCUMENTATION: Generate API Docs
FEATURE: Visibility Control
```

How the policy is applied:

- `COMPOSITION` parts added outside-in at the start of the cycle
- Base `STYLE` (`.icon`, `svg`) added just-in-time after the composed elements exist, before `STATE`
- `STATE` coverage follows the fixed sequence: metadata → type → enum values (source order) → getter → default → setter → mutation → null normalization → state→attribute → attribute→state
- Enum values tested in source-declaration order: `Visibility.VISIBLE` before `Visibility.HIDDEN`
- Null normalization included because `visibility` normalizes `null` to `Visibility.VISIBLE`
- Attribute-default omitted because `visibility` is optional — the attribute is absent when the value is the default
- `VALIDATION` commits include the method-existence pair, the method-error pair, and the setter-level boundary commit — all under the `VALIDATION:` prefix
- `OPERATION` metadata (`HIDE`, `SHOW`) batched before any method commits
- `EVENT` metadata (`ON_HIDE`, `ON_SHOW`) batched before any setter, handler, or payload commits
- Each event has three behavioral commits: setter existence, handler trigger, payload contract
- State-driven `STYLE` follows `EVENT`
- No `GESTURE` in this feature — visibility is controlled imperatively only
- `DOCUMENTATION` → `FEATURE` close the cycle

## Feature: Pin and Unpin

Branch: `feature/pin-unpin`

Behavioral feature — full cycle:

```
COMPOSITION: `div.icon` contains `svg.pinned` -> FAIL/PASS
STATE: `Attributes.STATUS` and `State.STATUS` exists -> FAIL/PASS
STATE: `Status` exists -> FAIL/PASS
STATE: `Status.PINNED` exists -> FAIL/PASS
STATE: `Status.UNPINNED` exists -> FAIL/PASS
STATE: `pin.status` getter exists -> FAIL/PASS
STATE: `pin.status` getter returns `Status.UNPINNED` -> FAIL/PASS
STATE: `status` attribute exists -> FAIL/PASS
STATE: `status` attribute is `Status.UNPINNED` -> FAIL/PASS
STATE: `pin.status` setter exists -> FAIL/PASS
STATE: set `pin.status` to `Status.PINNED` updates state -> FAIL/PASS
STATE: set `pin.status` to `Status.PINNED` updates attribute -> FAIL/PASS
STATE: set `status` attribute to `Status.PINNED` updates state -> FAIL/PASS
VALIDATION: `Validate.status` static method exists -> FAIL/PASS
VALIDATION: `Validate.status(value)` throws error if `value` is `invalid` -> FAIL/PASS
VALIDATION: set `pin.status` to `invalid` throws error -> FAIL/PASS
OPERATION: `Operation.PIN` exists -> FAIL/PASS
OPERATION: `Operation.UNPIN` exists -> FAIL/PASS
OPERATION: `pin.pin` method exists -> FAIL/PASS
OPERATION: Invoke `pin.pin` sets `pin.status` to `Status.PINNED` -> FAIL/PASS
OPERATION: `pin.unpin` method exists -> FAIL/PASS
OPERATION: Invoke `pin.unpin` when `pin.status` is `Status.PINNED` sets `pin.status` to `Status.UNPINNED` -> FAIL/PASS
OPERATION: `Operation.TOGGLE` exists -> FAIL/PASS
OPERATION: `pin.toggle` method exists -> FAIL/PASS
OPERATION: Invoke `pin.toggle` toggles `pin.status` from `Status.UNPINNED` to `Status.PINNED` and visa versa -> FAIL/PASS
EVENT: `Event.ON_PIN` exists -> FAIL/PASS
EVENT: `Event.ON_UNPIN` exists -> FAIL/PASS
EVENT: `pin.onpin` setter exists -> FAIL/PASS
EVENT: `pin.onpin` listener is called when `pin.status` changes from `Status.UNPINNED` to `Status.PINNED` -> FAIL/PASS
EVENT: When `pin.onpin` listener is called then it is called with `{ detail: { status: Status.PINNED } }` -> FAIL/PASS
EVENT: `pin.onunpin` setter exists -> FAIL/PASS
EVENT: `pin.onunpin` listener is called when `pin.status` changes from `Status.PINNED` to `Status.UNPINNED` -> FAIL/PASS
EVENT: When `pin.onunpin` listener is called then it is called with `{ detail: { status: Status.UNPINNED } }` -> FAIL/PASS
STYLE: Add `.unpinned` style
STYLE: Add `:host([status="unpinned"]) .pinned` style
STYLE: Add `:host([status="unpinned"]) .unpinned` style
STYLE: Add `.pinned` style
STYLE: Add `:host([status="pinned"]) .icon` style
STYLE: Add `:host([status="pinned"]) .pinned` style
STYLE: Add `:host([status="pinned"]) .unpinned` style
GESTURE: `Gesture.CLICK` exists -> FAIL/PASS
COMPOSITION: `pin.elements.icon` is a cached reference to the `div` with class `icon` -> FAIL/PASS
GESTURE: `Gesture.CLICK` on `div` with class `icon` toggle `pin.status` from `Status.UNPINNED` to `Status.PINNED` and visa versa -> FAIL/PASS
DOCUMENTATION: Generate API Docs
FEATURE: Pin and Unpin
```

How the policy is applied:

- Only the remaining `COMPOSITION` part (`svg.pinned`) is added at the start — just the part this feature requires
- `STATE` enum values tested in source-declaration order: `Status.PINNED` before `Status.UNPINNED`
- `STATE` omits null normalization because `status` does not normalize `null`
- `STATE` includes the attribute-default pair (`status attribute exists`, `status attribute is Status.UNPINNED`) because `status` is compulsory and always written to the DOM
- `OPERATION` metadata for `PIN` and `UNPIN` batched together before their methods; `TOGGLE` introduced as a separate semantic group with its own metadata-then-method-then-behavior sequence after the paired operations
- Each event has three behavioral commits: setter existence, handler trigger, payload contract
- State-driven `STYLE` for pinned/unpinned visual states split per selector — complementary states separated
- `GESTURE` follows `STYLE`
- `COMPOSITION` cached reference inserted just-in-time between `GESTURE` metadata and `GESTURE` behavior
- Gesture behavior commit describes the target by selector (`\`div\` with class \`icon\``)
- `DOCUMENTATION` → `FEATURE` close the cycle

## Feature: Hover Responsiveness

Branch: `feature/hover-responsiveness`

CSS-only feature — collapsed cycle:

```
STYLE: Add `@media (hover: hover) .icon:hover svg` style
STYLE: Add `@media (hover: hover) :host([status="unpinned"]) .icon:hover` style
STYLE: Add `@media (hover: hover) :host([status="pinned"]) .icon:hover` style
FEATURE: Hover Responsiveness
```

## Feature: Theme Compatibility

Branch: `feature/theme-compatibility`

CSS-only feature — collapsed cycle:

```
STYLE: Add `@media (prefers-color-scheme: dark) :host` style
FEATURE: Theme Compatibility
```

---

# Policy Checklist

A compliant feature branch must:

1. Be developed on an isolated feature branch created from main.
2. Begin every commit message with a canonical prefix from the defined vocabulary (with the sole exceptions of `Initial commit` and version-tag commits).
3. Use exactly one prefix per commit.
4. Introduce every behavioral change as a FAIL/PASS commit pair.
5. Place the FAIL commit immediately before its PASS commit with no commits between them.
6. Follow the policy-ordered development sequence: `COMPOSITION → STATE → VALIDATION → OPERATION → EVENT → STYLE → GESTURE → DOCUMENTATION → FEATURE`.
7. Test `COMPOSITION` parts in outside-in structural order using `contains` in the description.
8. Introduce only the `COMPOSITION` parts required by the current feature.
9. Follow the fixed coverage sequence for each `STATE` property: metadata → type → enum values (source-declaration order) → getter → default → [attribute default] → setter → mutation → [null normalization] → state→attribute sync → attribute→state sync.
10. Include attribute-default `STATE` tests only when the attribute is compulsory.
11. Include null-normalization `STATE` tests only when the setter contains normalization logic.
12. Use the verb `updates state` and `updates attribute` for mutation and sync commits — not `persists` or `sets`.
13. Place `VALIDATION` commits after the `STATE` body and before `OPERATION`. Include three pairs: method existence, method error, and setter-level boundary — all under the `VALIDATION:` prefix.
14. Batch `OPERATION` metadata constants per semantic group, before any method or behavior commits in that group. Composite operations such as `toggle` form their own semantic group.
15. Use `Invoke` as the uniform verb for all `OPERATION` behavior commits.
16. Include a precondition in `OPERATION` behavior commits only when the operation requires a specific prior state.
17. Use `from X to Y and visa versa` for bidirectional `OPERATION` and `GESTURE` behavior commits.
18. Batch `EVENT` metadata constants per semantic group, before any setter, handler, or payload commits in that group.
19. Use three commits per event: setter existence, handler trigger (`listener is called when ... changes from X to Y`), and payload (`When ... listener is called then it is called with ...`).
20. Place state-driven `STYLE` commits after `EVENT` and before `GESTURE`.
21. Place base element `STYLE` commits just-in-time after the `COMPOSITION` parts they apply to are established.
22. Use `Define` for base element styles and `Add` for state-driven, gesture-driven, media-query, and extension styles.
23. Commit one selector per `STYLE` commit. Separate complementary visual states into distinct `STYLE` commits.
24. Place the `COMPOSITION` cached reference commit between `GESTURE` metadata and `GESTURE` behavior.
25. Describe `GESTURE` behavior targets by selector phrasing (`\`div\` with class \`icon\``), not by cached reference name.
26. Close every behavioral feature with `DOCUMENTATION → FEATURE`.
27. Follow the collapsed cycle (`STYLE → FEATURE`) for CSS-only features.
28. Use the `FEATURE` commit only as a boundary marker — no new behavior, tests, or styles.
29. Add `CONFIG` and `COMPOSITION` parts just-in-time at the earliest point they are needed.
30. Wrap all code references in backticks in commit message descriptions.
31. Commit test naming convention corrections as standalone `TESTING: Update naming convention` commits, never bundled with behavioral changes.
32. Use the domain prefix for refactor commits with `refactor` in the message body; do not use a FAIL/PASS pair.
33. Use `SPECIFICATIONS` for component specification commits.
34. Use `TYPES` for TypeScript type changes independent of runtime behavior.
35. Verify every commit message before pushing — prefix present, code references backticked, state values and event names correct, no typos in the feature name.
