# Web Component

A web component built on the `@scalable.software/component` framework. The policies in `.claude/context/` govern how component specifications are transformed into solid implementations.

## How This Project Works

Every component is developed through a specification-driven, test-first pipeline. The specification declares the public contract; the implementation honors it; the tests verify it; the commit history records the transformation.

When working on a component, translate the specification into an implementation that conforms to all applicable policies — without inventing structure, behavior, or vocabulary the specification does not declare.

## Translation Pipeline

```
<component>.specifications.json     ← source of truth
        │
        ├─→ <component>.meta.ts            vocabulary + value-domain types
        ├─→ <component>.validation.ts      Validate class — runtime enforcement
        ├─→ <component>.ts                 state, operations, events, gestures
        ├─→ <component>.template.html      realized composition
        └─→ <component>.style.css          realized presentation

verified by:
        test/unit/<component>.meta.test.ts        — vocabulary tests
        test/unit/<component>.validation.test.ts  — validator tests
        test/unit/<component>.test.ts             — component behavioral tests

recorded by:
        FAIL/PASS commit pairs, policy-ordered, one prefix per commit
        DOCUMENTATION → FEATURE closes each feature branch
```

Names predictably transform across layers. A state named `visibility` in the specification becomes `Attributes.VISIBILITY` + `State.VISIBILITY` in metadata, `Validate.visibility` in validation, `get visibility()`/`set visibility(...)` on the class, `state(State.VISIBILITY, ...)` in tests, and `STATE: ...` in commits.

## Implementation Order

Within any behavioral feature, work proceeds top-down through the policy hierarchy:

```
COMPOSITION → STATE → VALIDATION → OPERATION → EVENT → STYLE → GESTURE → DOCUMENTATION → FEATURE
```

Each layer depends on the layers above. CSS-only features collapse to `STYLE → FEATURE`. See `@context/workflow.md` for the full sequence and per-layer commit format.

## Implementation Policies

Each policy file opens with a **How to Read This Policy** rubric that classifies its rules as one of three strengths:

- **Principles** — non-negotiable; derived from framework correctness or TDD discipline.
- **Templates** — invariant skeletons with explicit variation points based on declared classification (e.g., attribute-backed vs non-attribute, readonly vs writable, payload-bearing vs payload-free).
- **Conventions** — canonical defaults that keep implementations readable across components.

When a new component's shape conflicts with a rule, classify the rule before reconciling: a principle conflict is a defect; a template conflict means a variation point needs to be made explicit; a convention conflict is a documented deviation.

### Specification-driven (per component)

@context/composition.md — structural parts and cached references
@context/data.md — canonical component-owned content
@context/state.md — runtime mode, visibility, status, persistence
@context/operation.md — public imperative actions
@context/event.md — observable semantic outcomes
@context/gesture.md — interaction inputs
@context/validation.md — runtime enforcement of declared value domains

### Cross-cutting (every component)

@context/testing.md — test file structure, BDD vocabulary, coverage contracts
@context/workflow.md — branching, commit sequencing, TDD discipline

## Working Principles

- **Test first.** Every behavioral change starts with a failing test. The FAIL commit precedes the PASS commit. No exceptions.
- **One feature per branch.** Behavioral work is never committed directly to main.
- **One concern per commit.** Every commit message begins with a canonical prefix.
- **Trace names across layers.** A specification name reappears unchanged — modulo standard transformations — in metadata, validation, class API, tests, and commits.
- **Specification is authoritative.** Implementations do not invent structure, behavior, or vocabulary the specification does not declare. If a component's shape does not fit a policy rule, examine the policy's variation points — do not bypass them.
