![License: CC BY-NC-SA 4.0](https://flat.badgen.net/static/license/CC-BY-NC-SA-4.0/green)

# Pin Button

A reusable **Pin Button** web component built on `@scalable.software/component`. Toggles between pinned and unpinned states, supports show/hide, hover responsiveness, and automatic light/dark theme.

This implementation is the answer to **Vibe Coding Challenge #2** — built strictly according to the `scalable-software/component.template` framework and its implementation policies (TDD, FAIL/PASS commit pairs, fixed policy ordering).

## Stack

- Vanilla **Web Component** (Custom Element + closed Shadow DOM, native ES Modules, import maps)
- TypeScript 5.x
- **Karma + Jasmine** running in ChromeHeadless
- BDD test vocabulary (`given/and/when/then`) with typed wrappers (`composition/state/operation/events/gesture/metadata/validation`)
- TypeDoc for API documentation

## Folder structure

```
pin-button/
├── specifications/
│   ├── pin.specifications.json       ← authoritative contract (the single source of truth)
│   └── component.specification.schema.json
├── src/
│   ├── pin.ts                        ← Pin component class extending base Component
│   ├── pin.meta.ts                   ← vocabulary: Tag, Attributes, State, Visibility, Status, Operation, Event, Gesture
│   ├── pin.validation.ts             ← Validate class — runtime domain enforcement
│   ├── pin.template.html             ← realized composition (template + div.icon + two SVGs)
│   ├── pin.style.css                 ← base + state-driven + hover + dark theme styles
│   └── index.ts                      ← barrel export
├── test/
│   ├── helper/
│   │   ├── helper.js                 ← BDD vocabulary, typed describe wrappers, DOM helpers
│   │   └── helper.d.ts
│   └── unit/
│       ├── pin.meta.test.ts          ← vocabulary tests
│       ├── pin.validation.test.ts    ← validator tests
│       └── pin.test.ts               ← component behavioral tests
├── demo/
│   ├── index.html                    ← interactive playground (npm run serve)
│   ├── index.js
│   └── html.style.css
├── importmap/
│   ├── importmap.test.js             ← test runtime mapping
│   ├── importmap.build.js            ← demo runtime mapping
│   └── inject.js
├── tasks/                            ← build / clean scripts
├── docs/                             ← TypeDoc-generated API documentation
└── .claude/
    ├── CLAUDE.md
    └── context/                      ← 10 implementation policies (composition, state, operation, event, gesture, validation, data, testing, workflow)
```

## How to run

```bash
npm install                  # one-time install
npm test                     # run Karma + Jasmine (ChromeHeadless), 115 tests
npm run build                # compile to dist/
npm run serve                # serve demo/ at http://localhost:8000/demo/index.html
npm run document             # regenerate TypeDoc API docs into docs/
```

## Public API

```ts
import { Pin, Visibility, Status } from "@tungthac/pin-button";

await Pin.Template.load("pin.template.html");
customElements.define(Pin.Tag, Pin);
```

### States (observable as DOM attributes)

| State        | Type         | Values                  | Default      | Attribute     |
|--------------|--------------|-------------------------|--------------|---------------|
| `visibility` | `Visibility` | `"visible"`, `"hidden"` | `"visible"`  | optional      |
| `status`     | `Status`     | `"pinned"`, `"unpinned"`| `"unpinned"` | compulsory    |

### Operations (imperative API)

```ts
pin.hide();    // visibility → "hidden"
pin.show();    // visibility → "visible"
pin.pin();     // status → "pinned"
pin.unpin();   // status → "unpinned"
pin.toggle();  // flips status between "pinned" and "unpinned"
```

### Events (subscription-property based, single-slot)

```ts
pin.onhide  = (e) => console.log(e.detail.visibility); // "hidden"
pin.onshow  = (e) => console.log(e.detail.visibility); // "visible"
pin.onpin   = (e) => console.log(e.detail.status);     // "pinned"
pin.onunpin = (e) => console.log(e.detail.status);     // "unpinned"

pin.onpin = null; // unsubscribe
```

Events fire **only after accepted state transitions** (no-op assignments and rejected transitions do not emit).

### Gestures

- **`click`** (behavioral) — user clicks the inner `.icon` div → routes through `pin.toggle()`.
- **`hover`** (visual) — pure CSS feedback on `.icon` hover (background, border, shadow, fill). No event fires.

### Theming

The component reflects two CSS custom-property scopes from `pin.style.css`:

- `:host { ... }` — light-theme defaults.
- `@media (prefers-color-scheme: dark) :host { ... }` — dark-theme overrides.

No JS, no reload. The component restyles instantly when the OS theme changes.

## How the project is built

Every behavioural change in this repository was committed as a **FAIL/PASS pair** (test red → test green), strictly following the order defined in `.claude/context/workflow.md`:

```
COMPOSITION → STATE → VALIDATION → OPERATION → EVENT → STYLE → GESTURE → DOCUMENTATION → FEATURE
```

The git history is the implementation audit trail. To browse:

```bash
git log --oneline
git log --grep="FEATURE:"   # 4 features: Visibility Control, Pin and Unpin, Hover Responsiveness, Theme Compatibility
git log --grep="-> FAIL"    # 66 FAIL commits (every one paired with a PASS)
git log --grep="-> PASS"    # 66 PASS commits
```

## Policy references

This component is governed by 10 policies in `.claude/context/`:

| Policy file       | Governs                                                  |
|-------------------|----------------------------------------------------------|
| `composition.md`  | Structural parts, cached element references              |
| `state.md`        | Runtime state, attribute synchronisation, mutation order |
| `data.md`         | Component-owned content (not used by Pin)                |
| `operation.md`    | Public imperative actions                                |
| `event.md`        | Observable semantic outcomes                             |
| `gesture.md`      | User interaction inputs                                  |
| `validation.md`   | Runtime input enforcement                                |
| `testing.md`      | Test file structure, BDD vocabulary, coverage contracts  |
| `workflow.md`     | Branching, commit prefix vocabulary, FAIL/PASS discipline|

Read `pin.specifications.json` for the authoritative contract.

## License

CC BY-NC-SA 4.0 — same as the original `component.template`.
