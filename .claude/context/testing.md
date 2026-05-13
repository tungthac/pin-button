# Testing

This document defines an implementation policy for **component testing**, then illustrates how specifications are implemented by applying this policy.

This document is intentionally **testing** only, but part of a set of implementation policies which together define the policies which should be followed to transform specifications into an implementation which is predictable, maintainable, and production-ready at scale.

TDD discipline and commit sequencing are covered in the workflow policy. This document covers test file structure, test vocabulary, and the required coverage contract for each concern layer.

---

# How to Read This Policy

Rules in this policy fall into three strengths. Read each rule with its strength in mind:

- **Principles** are non-negotiable. They derive from framework correctness or TDD discipline and hold for every component. A conflict with a principle is a defect.
- **Templates** are invariant skeletons with explicit variation points. The skeleton applies to every component; specific steps activate or deactivate based on the component's declared classification (e.g., attribute-backed vs non-attribute, readonly vs writable, payload-bearing vs payload-free). Variation is part of the template, not a deviation from it.
- **Conventions** are canonical defaults that keep implementations readable across components. A second component may deviate when its shape genuinely warrants it; the deviation should be explained at review time, not forbidden by the policy.

When applying this policy to a new component, classify each rule before reconciling conflicts. A conflict with a principle is a defect; a conflict with a template means a variation point needs to be made explicit; a conflict with a convention is a documented deviation.

---

# 1) Tests Must Be Organized in Three Dedicated Files

All tests for a component must be distributed across three dedicated files, each covering a distinct implementation layer.

Policy:

- tests for metadata must live in `<component>.meta.test.ts`
- tests for validation must live in `<component>.validation.test.ts`
- tests for the component must live in `<component>.test.ts`
- test logic must not be shared or inlined across files of different concern layers
- `<component>.meta.test.ts` is the authoritative location for all vocabulary tests
- `<component>.validation.test.ts` is the authoritative location for all validator tests
- `<component>.test.ts` is the authoritative location for all component behavioral tests

This separation gives each test file a single clear responsibility:

- `<component>.meta.test.ts` verifies the vocabulary declared in `<component>.meta.ts`
- `<component>.validation.test.ts` verifies the validators declared in `<component>.validation.ts`
- `<component>.test.ts` verifies the behavior declared in the component specification

# 2) Tests Must Use the BDD Vocabulary

All tests must be expressed using the standard BDD vocabulary provided by the test helper. The vocabulary maps directly to Jasmine primitives with a natural-language prefix.

| Keyword | Maps to                          | Purpose                                                                                |
| ------- | -------------------------------- | -------------------------------------------------------------------------------------- |
| `given` | `describe` prefixed with `Given` | Establishes the outer context — the precondition under which all contained tests apply |
| `and`   | `describe` prefixed with `and`   | Introduces additional context layers or continues the preceding context                |
| `when`  | `describe` prefixed with `when`  | Introduces a triggering action or state change within a context                        |
| `then`  | `it` prefixed with `then`        | Declares a single assertion — the expected observable outcome                          |

Policy:

- every assertion must live in a `then` block
- no assertion may live directly in a `given`, `when`, or `and` block
- setup and teardown (`beforeEach`, `afterEach`) may appear in any `given`, `and`, or `when` block
- test descriptions must read as grammatical sentences when the keyword prefix is prepended
- descriptions must be written in plain language that traces directly to the specification

# 3) Test Suites Must Use Typed Describe Wrappers

Every top-level test group must use one of the typed describe wrappers that declare both the concern type and the canonical spec name.

| Wrapper                     | Concern                 | Canonical label source                                           |
| --------------------------- | ----------------------- | ---------------------------------------------------------------- |
| `metadata(name, spec)`      | Metadata vocabulary     | `Metadata.*` (helper-supplied) or `State.*` (component metadata) |
| `validation(name, spec)`    | Validator method        | `State.*` (component metadata)                                   |
| `configuration(name, spec)` | Component configuration | `Configuration.*` (helper-supplied)                              |
| `utility(name, spec)`       | Utility                 | `Utilities.*` (helper-supplied)                                  |
| `composition(name, spec)`   | DOM composition         | `Composition.*` (helper-supplied)                                |
| `element(name, spec)`       | Element-scoped concern  | `Composition.*` (helper-supplied)                                |
| `state(name, spec)`         | State contract          | `State.*` (component metadata)                                   |
| `operation(name, spec)`     | Public operation        | `Operation.*` (component metadata)                               |
| `events(name, spec)`        | Event contract          | `Event.*` (component metadata)                                   |
| `gesture(name, spec)`       | Interaction gesture     | `Gesture.*` (component metadata)                                 |

Two label-source categories exist and must not be confused:

- **Helper-supplied constants** — `Metadata.*`, `Configuration.*`, `Utilities.*`, `Composition.*` — are declared in the test helper and identify orthogonal concern surfaces (the test names themselves).
- **Component metadata constants** — `State.*`, `Operation.*`, `Event.*`, `Gesture.*` — are declared in `<component>.meta.ts` and identify specification members.

Policy:

- every top-level test suite must use the typed wrapper that matches its concern
- the canonical name passed to the wrapper must come from a constant — never from a string literal
- helper-supplied constants are used when the wrapper name identifies a concern surface
- component metadata constants are used when the wrapper name identifies a specification member
- the typed wrapper sets the `type` and `spec` properties on each spec for structured JSON reporting

Example:

```typescript
metadata(State.VISIBILITY, () => {
  // tests for the Visibility value domain — name from pin.meta.ts
});

configuration(Configuration.TAG, () => {
  // tests for Pin.Tag — name from the test helper
});

state(State.VISIBILITY, () => {
  // tests for the visibility state contract — name from pin.meta.ts
});
```

# 4) Test Suite Ordering Must Mirror the Specification Concern Hierarchy

Within each test file, suites must be ordered to match the concern hierarchy defined in the workflow policy.

Policy for `<component>.meta.test.ts`:

- `Tag`
- `Attributes`
- `State` — followed immediately by one `metadata(...)` suite per value domain, in the order the state keys appear in `Attributes`
- `Operation`
- `Event`
- `Gesture`

Configuration constants such as `CSS` are realized through composition (the stylesheet link is verified in `composition(Composition.CSS, ...)`); they are not declared as metadata suites.

Policy for `<component>.validation.test.ts`:

- one `validation(...)` suite per attribute-backed state, in the order the keys appear in `Attributes`

Policy for `<component>.test.ts`:

- `Configuration` — one `configuration(...)` suite per declared configuration surface (`Configuration.TAG`, `Configuration.ATTRIBUTES`)
- `Utilities` — one `utility(...)` suite per declared utility surface (`Utilities.TEMPLATE`)
- `Composition` — one `composition(...)` suite per declared composition surface (`Composition.TEMPLATE`, `Composition.CSS`, `Composition.ELEMENT`)
- `State` — in the order declared in the specification
- `Operations` — in the order declared in the specification
- `Events` — in the order declared in the specification
- `Gestures` — in the order declared in the specification

# 5) Metadata Tests Must Verify the Declared Vocabulary

For every vocabulary constant declared in `<component>.meta.ts`, the `<component>.meta.test.ts` must verify existence — and, for enum-shaped constants, runtime type and the presence of every declared key.

Policy:

- every vocabulary constant declared in `<component>.meta.ts` must have a `metadata(...)` suite
- vocabulary constants are: `Tag`, `Attributes`, `State`, every value-domain constant exported by the component (e.g. `Visibility`, `Status`), `Operation`, `Event`, `Gesture`
- non-vocabulary configuration constants (e.g. `CSS`) are verified through their realized usage in `<component>.test.ts` and do not require metadata suites
- each suite must verify the constant is defined
- for enum-shaped constants, each suite must additionally verify the constant is of runtime type `"object"`, and that every declared key is defined
- key assertions use `expect(Constant.KEY).toBeDefined()` — not value equality
- value equality belongs to the validation layer, not the metadata layer

## 5.1) Scalar Constants Use the Flat Pattern

A scalar constant such as `Tag` has no key membership to verify. Its suite uses a flat `when → then` shape:

```typescript
metadata(Metadata.TAG, () => {
  when("Tag imported", () => {
    then("Tag is defined", () => {
      expect(Tag).toBeDefined();
    });
  });
});
```

## 5.2) Enum-Shaped Constants Use the Nested Pattern

An enum-shaped constant such as `Attributes`, `State`, `Visibility`, `Status`, `Operation`, `Event`, or `Gesture` uses the nested `and → then → and → then → when → then` shape:

```typescript
metadata(State.VISIBILITY, () => {
  and("Visibility imported", () => {
    then("Visibility is defined", () => {
      expect(Visibility).toBeDefined();
    });

    and("Visibility is defined", () => {
      then("Visibility is an object", () => {
        expect(typeof Visibility).toBe("object");
      });

      when("Visibility is an object", () => {
        then("`Visibility.VISIBLE` exists", () => {
          expect(Visibility.VISIBLE).toBeDefined();
        });

        then("`Visibility.HIDDEN` exists", () => {
          expect(Visibility.HIDDEN).toBeDefined();
        });
      });
    });
  });
});
```

Each declared key is asserted in its own `then` block inside `when("X is an object", ...)`.

# 6) Validation Tests Must Cover the Full Input Domain

For every validator declared in `<component>.validation.ts`, the `<component>.validation.test.ts` must verify the method exists, accepts every valid domain value without throwing, and rejects every invalid value with the exact error message.

Policy:

- every validator must have a `validation(...)` suite keyed to the corresponding state name (e.g. `State.VISIBILITY`)
- the outermost block under the typed wrapper is `given("Validate imported", ...)`
- each suite must verify the validator method is defined on the `Validate` class
- each suite must test every valid domain value independently in its own `and(...)` block:
  - the call must not throw
  - the return value must equal the input value
- each suite must test at least one invalid value:
  - the call must throw
  - the thrown error message must equal the exact expected string

Policy for the try/catch test structure:

- valid and invalid values are set in `beforeEach`
- the validator call is wrapped in a `try/catch` inside `beforeEach` — the result and the error are captured into separate variables
- error and result assertions appear in separate `then` blocks
- both variables must be declared in scope before the `beforeEach` that captures them

Example:

```typescript
validation(State.VISIBILITY, () => {
  given("Validate imported", () => {
    then("Validate is defined", () => {
      expect(Validate).toBeDefined();
    });

    and("Validate is defined", () => {
      then("`Validate.visibility` static method is defined", () => {
        expect(Validate.visibility).toBeDefined();
      });

      and("`value` is `Visibility.VISIBLE`", () => {
        let value: any;
        beforeEach(() => {
          value = Visibility.VISIBLE;
        });

        when("`Validate.visibility(value)` is called", () => {
          let error: unknown | undefined;
          let result: any;
          beforeEach(() => {
            try {
              result = Validate.visibility(value);
            } catch (err) {
              error = err;
            }
          });

          then("no error is thrown", () => {
            expect(error).toBeUndefined();
          });

          then("result is `Visibility.VISIBLE`", () => {
            expect(result).toBe(Visibility.VISIBLE);
          });
        });
      });

      and("`value` is `invalid`", () => {
        let value: any;
        beforeEach(() => {
          value = "invalid";
        });

        when("`Validate.visibility(value)` is called", () => {
          let error: unknown | undefined;
          beforeEach(() => {
            try {
              Validate.visibility(value);
            } catch (err) {
              error = err;
            }
          });

          then("an error is thrown", () => {
            expect(error).not.toBeUndefined();
          });

          and("an error is thrown", () => {
            then(
              "error message contains 'Invalid visibility value: invalid'",
              () => {
                expect((error as Error).message).toEqual(
                  "Invalid visibility value: invalid"
                );
              }
            );
          });
        });
      });
    });
  });
});
```

# 7) Component Tests Must Follow the Standard DOM Setup Pattern

Every test suite in `<component>.test.ts` that exercises the component in the DOM must follow the standard nested setup and teardown pattern.

Policy:

- the component must be registered in the custom element registry with `define(Pin.Tag, Pin)` inside a `beforeEach`
- the HTML template must be loaded with `await Pin.Template.load(...)` inside a `beforeEach`
- the component must be added to the DOM with `add<Pin>(Pin.Tag)` inside a `beforeEach`
- the component element must be removed with `pin.remove()` inside an `afterEach`
- the custom element registration must be cleaned up with `remove(Pin.Tag)` inside an `afterEach`
- DOM setup and teardown must be nested using `and(...)` describe blocks, ordered from outermost (registration) to innermost (element addition)
- any test that mutates component state must restore it to its default in `afterEach`

## 7.1) Outer Block: `given` vs `and`

The outermost block under a typed wrapper expresses the test's precondition narrative. Use `given(...)` when the suite verifies a structural or vocabulary contract; use `and(...)` when the suite verifies runtime behavior:

| Suite type                               | Outer block |
| ---------------------------------------- | ----------- |
| `state(...)`                             | `given`     |
| `validation(...)`                        | `given`     |
| `composition(Composition.TEMPLATE, ...)` | `given`     |
| `composition(Composition.CSS, ...)`      | `given`     |
| `composition(Composition.ELEMENT, ...)`  | `and`       |
| `operation(...)`                         | `and`       |
| `events(...)`                            | `and`       |
| `gesture(...)`                           | `and`       |

The distinction is semantic: structural and vocabulary contracts read naturally with an explicit `Given the component is defined...` precondition, while behavioral suites continue the implicit narrative established by their typed wrapper.

Example:

```typescript
state(State.VISIBILITY, () => {
  given("Pin is defined in custom element registry", () => {
    beforeEach(() => {
      define(Pin.Tag, Pin);
    });

    and("a HTML Template is added to DOM", () => {
      beforeEach(async () => {
        await Pin.Template.load("pin.template.html");
      });
      afterEach(() => {
        remove(Pin.Tag);
      });

      and("a new pin is added to DOM", () => {
        let pin: Pin;
        beforeEach(() => {
          pin = add<Pin>(Pin.Tag);
        });
        afterEach(() => {
          pin.remove();
        });

        // assertions here
      });
    });
  });
});
```

# 8) Configuration, Utility, and Composition Suites Have Defined Coverage

These suites verify the orthogonal surfaces exposed by the component class and its template, distinct from the specification members.

## 8.1) Configuration Suites

A `configuration(...)` suite verifies that a static class member equals the corresponding metadata constant.

Required:

- the static class getter must be verified as defined
- the static class getter must equal the metadata constant

```typescript
configuration(Configuration.TAG, () => {
  and("Pin imported", () => {
    then("Pin is defined", () => {
      expect(Pin).toBeDefined();
    });

    and("Pin is defined", () => {
      then("Pin.Tag static getter is defined", () => {
        expect(Pin.Tag).toBeDefined();
      });

      and("Pin.Tag static getter is defined", () => {
        then("Pin.Tag is Tag", () => {
          expect(Pin.Tag).toBe(Tag);
        });
      });
    });
  });
});
```

## 8.2) Utility Suites

A `utility(...)` suite verifies that a static utility member is defined and of the correct runtime type.

```typescript
utility(Utilities.TEMPLATE, () => {
  then("Pin.Template static property is defined", () => {
    expect(Pin.Template).toBeDefined();
  });

  and("Pin.Template static property is defined", () => {
    then("Pin.Template is a Template", () => {
      expect(Pin.Template).toBeInstanceOf(Template);
    });
  });
});
```

## 8.3) Composition Suites

A `composition(...)` suite verifies the realized DOM structure or the realized runtime caching of declared composition parts.

- `composition(Composition.TEMPLATE, ...)` verifies that loading the template produces the declared parent-child containment in the shadow root.
- `composition(Composition.CSS, ...)` verifies that the shadow root contains a stylesheet link to the declared CSS file.
- `composition(Composition.ELEMENT, ...)` verifies that each `cached: true` part is cached on the component instance and references the realized DOM element.

```typescript
composition(Composition.TEMPLATE, () => {
  given("Pin is defined in custom element registry", () => {
    beforeEach(() => {
      define(Pin.Tag, Pin);
    });

    and("HTML Template is added to DOM", () => {
      let template: HTMLTemplateElement;
      beforeEach(async () => {
        template = (await Pin.Template.load(
          "pin.template.html"
        )) as HTMLTemplateElement;
      });
      afterEach(() => {
        remove(Pin.Tag);
      });

      and("a new pin is added to DOM", () => {
        let pin: Pin;
        beforeEach(() => {
          pin = add<Pin>(Pin.Tag);
        });
        afterEach(() => {
          pin.remove();
        });

        then("`pin.root` contains `div.icon`", () => {
          const div = pin.root.querySelector("div.icon");
          expect(div).not.toBeNull();
        });

        when("`pin.root` contains `div.icon`", () => {
          let div: HTMLDivElement;
          beforeEach(() => {
            div = pin.root.querySelector("div.icon") as HTMLDivElement;
          });

          then("`div.icon` contains `svg.unpinned`", () => {
            const svg = div.querySelector("svg.unpinned");
            expect(svg).not.toBeNull();
          });

          then("`div.icon` contains `svg.pinned`", () => {
            const svg = div.querySelector("svg.pinned");
            expect(svg).not.toBeNull();
          });
        });
      });
    });
  });
});
```

# 9) State Tests Must Cover the Full Mutation Contract

For every state declared in the specification, the `<component>.test.ts` must verify the full mutation contract. The required assertions depend on whether the state is attribute-backed and whether it permits null normalization.

Policy — required for all state:

- the getter must be verified as defined
- the default value must be verified
- the setter must be verified using `hasSetter(pin, "<name>")`
- setting a valid value via the setter must update the getter
- setting an invalid value must throw with the exact error message

Policy — required for attribute-backed state:

- setting a valid value via the setter must sync the DOM attribute via `setAttribute`
- setting the DOM attribute via `setAttribute` must drive the getter (`attributeChangedCallback` path)
- for compulsory attribute-backed state, the attribute default must be verified — both that the attribute exists and that it carries the default value

Policy — required when the setter normalizes `null` to a default:

- setting `null` must leave the getter at the default value

Policy for invalid value tests:

- the invalid assignment must be wrapped in a `try/catch` inside `beforeEach`
- the `Error` is captured and asserted in a `then` block
- the assignment must be annotated with `// @ts-expect-error` to suppress the type error

Example (optional attribute-backed):

```typescript
then("`pin.visibility` getter exists", () => {
  expect(pin.visibility).toBeDefined();
});

when("`pin.visibility` getter exists", () => {
  then("`pin.visibility` is `Visibility.VISIBLE`", () => {
    expect(pin.visibility).toBe(Visibility.VISIBLE);
  });
});

then("`pin.visibility` setter exists", () => {
  expect(hasSetter(pin, "visibility")).toBeTrue();
});

and("`pin.visibility` setter exists", () => {
  when("`pin.visibility` is set to `Visibility.HIDDEN`", () => {
    beforeEach(() => {
      pin.visibility = Visibility.HIDDEN;
    });
    afterEach(() => {
      pin.visibility = Visibility.VISIBLE;
    });

    then("`pin.visibility` is `Visibility.HIDDEN`", () => {
      expect(pin.visibility).toBe(Visibility.HIDDEN);
    });

    then("pin `visibility` attribute is `Visibility.HIDDEN`", () => {
      expect(pin.getAttribute(Attributes.VISIBILITY)).toBe(Visibility.HIDDEN);
    });
  });

  when("`pin.visibility` is set to `null`", () => {
    beforeEach(() => {
      pin.visibility = null;
    });
    afterEach(() => {
      pin.visibility = Visibility.VISIBLE;
    });

    then("`pin.visibility` is `Visibility.VISIBLE`", () => {
      expect(pin.visibility).toBe(Visibility.VISIBLE);
    });
  });

  when("`visibility` attribute is set to `Visibility.HIDDEN`", () => {
    beforeEach(() => {
      pin.setAttribute(Attributes.VISIBILITY, Visibility.HIDDEN);
    });
    afterEach(() => {
      pin.removeAttribute(Attributes.VISIBILITY);
    });

    then("`pin.visibility` is `Visibility.HIDDEN`", () => {
      expect(pin.visibility).toBe(Visibility.HIDDEN);
    });
  });

  when("`pin.visibility` is set to `invalid`", () => {
    let error: Error;
    beforeEach(() => {
      try {
        // @ts-expect-error
        pin.visibility = "invalid";
      } catch (err) {
        error = err as Error;
      }
    });
    afterEach(() => {
      pin.visibility = Visibility.VISIBLE;
    });

    then("an error is thrown", () => {
      expect(error).toBeDefined();
    });

    then("error message contains 'Invalid visibility value: invalid'", () => {
      expect(error.message).toBe("Invalid visibility value: invalid");
    });
  });
});
```

Example (compulsory attribute-backed — attribute default verified):

```typescript
then("`status` attribute exists", () => {
  expect(pin.getAttribute(Attributes.STATUS)).not.toBeNull();
});

and("`status` attribute exists", () => {
  then("`status` attribute is `Status.UNPINNED`", () => {
    expect(pin.getAttribute(Attributes.STATUS)).toBe(Status.UNPINNED);
  });

  when("`status` attribute is set to `Status.PINNED`", () => {
    beforeEach(() => {
      pin.setAttribute(Attributes.STATUS, Status.PINNED);
    });
    afterEach(() => {
      pin.setAttribute(Attributes.STATUS, Status.UNPINNED);
    });

    then("`pin.status` is `Status.PINNED`", () => {
      expect(pin.status).toBe(Status.PINNED);
    });
  });
});
```

# 10) Operation Tests Must Verify Existence and Behavioral Outcome

For every operation declared in the specification, the `<component>.test.ts` must verify the method exists and produces the state outcome declared in the specification.

Policy:

- the operation must be verified as defined on the component instance using `expect(pin.{operation}).toBeDefined()`
- calling the operation must produce the state outcome declared in the specification's `returns` contract
- the outcome is verified by reading the relevant state getter after calling the operation
- when an operation is only semantically meaningful from a specific prior state (e.g., `show` requires the component to already be `hidden`), that precondition must be established in `beforeEach` before the operation is called
- when an operation produces a bidirectional outcome (e.g., `toggle`), both directions must be verified — each direction in its own sibling `and(...)` block establishing the prior state, with the operation invoked in a nested `when("invoking ...")` block

Example (single-direction):

```typescript
then("`pin.hide` method exists", () => {
  expect(pin.hide).toBeDefined();
});

and("`pin.hide` method exists", () => {
  when("invoking `pin.hide`", () => {
    beforeEach(() => {
      pin.hide();
    });

    then("`pin.visibility` is `Visibility.HIDDEN`", () => {
      expect(pin.visibility).toBe(Visibility.HIDDEN);
    });
  });
});
```

Example (bidirectional toggle):

```typescript
then("`pin.toggle` method exists", () => {
  expect(pin.toggle).toBeDefined();
});

and("`pin.toggle` method exists", () => {
  and("`pin.status` is set to `Status.UNPINNED`", () => {
    beforeEach(() => {
      pin.status = Status.UNPINNED;
    });
    afterEach(() => {
      pin.status = Status.UNPINNED;
    });

    when("invoking `pin.toggle`", () => {
      beforeEach(() => {
        pin.toggle();
      });

      then("`pin.status` is `Status.PINNED`", () => {
        expect(pin.status).toBe(Status.PINNED);
      });
    });
  });

  and("`pin.status` is set to `Status.PINNED`", () => {
    beforeEach(() => {
      pin.status = Status.PINNED;
    });
    afterEach(() => {
      pin.status = Status.UNPINNED;
    });

    when("invoking `pin.toggle`", () => {
      beforeEach(() => {
        pin.toggle();
      });

      then("`pin.status` is `Status.UNPINNED`", () => {
        expect(pin.status).toBe(Status.UNPINNED);
      });
    });
  });
});
```

# 11) Event Tests Must Verify Listener Replacement Semantics and Payload

For every event declared in the specification, the `<component>.test.ts` must verify the subscription setter exists, that assigning a new listener deregisters the previous one, and that the dispatched event carries the correct detail payload.

Policy:

- the event setter must be verified using `hasSetter(pin, Event.ON_{NAME})`
- listener replacement must be verified: when a second listener replaces the first, only the second listener must be called when the event fires — the first must not be called
- the event payload must match the structure declared in the specification's `parameters`
- spies must be created with `jasmine.createSpy`
- the payload is asserted via `jasmine.objectContaining({ detail: { ... } })` passed to `toHaveBeenCalledWith`
- for events that fire on a state transition requiring a prior state, the prior state must be established in `beforeEach` before listeners are assigned, so that assigning the listener does not capture the unrelated transition that established the prior state

Example:

```typescript
events(Event.ON_HIDE, () => {
  and("Pin is defined in custom element registry", () => {
    beforeEach(() => {
      define(Pin.Tag, Pin);
    });

    and("HTML Template is added to DOM", () => {
      beforeEach(async () => {
        await Pin.Template.load("pin.template.html");
      });
      afterEach(() => {
        remove(Pin.Tag);
      });

      and("a new pin is added to DOM", () => {
        let pin: Pin;
        beforeEach(() => {
          pin = add<Pin>(Pin.Tag);
        });
        afterEach(() => {
          pin.remove();
        });

        then("`pin.onhide` setter exists", () => {
          expect(hasSetter(pin, Event.ON_HIDE)).toBeTrue();
        });

        and("`pin.onhide` setter exists", () => {
          and("`pin.onhide` is set to a listener", () => {
            let onhide: jasmine.Spy;
            beforeEach(() => {
              onhide = jasmine.createSpy("onhide");
              pin.onhide = onhide;
            });
            afterEach(() => {
              pin.onhide = null;
            });

            and("`pin.onhide` is set to a new listener", () => {
              let onhide2: jasmine.Spy;
              beforeEach(() => {
                onhide2 = jasmine.createSpy("onhide2");
                pin.onhide = onhide2;
              });
              afterEach(() => {
                pin.onhide = null;
              });

              when("`pin.visibility` is set to `Visibility.HIDDEN`", () => {
                beforeEach(() => {
                  pin.visibility = Visibility.HIDDEN;
                });
                afterEach(() => {
                  pin.visibility = Visibility.VISIBLE;
                });

                then("old `pin.onhide` is not called", () => {
                  expect(onhide).not.toHaveBeenCalled();
                });

                then("new `pin.onhide` is called", () => {
                  expect(onhide2).toHaveBeenCalled();
                });

                then(
                  "new `pin.onhide` is called with `{ detail: { visibility: Visibility.HIDDEN } }`",
                  () => {
                    expect(onhide2).toHaveBeenCalledWith(
                      jasmine.objectContaining({
                        detail: { visibility: Visibility.HIDDEN }
                      })
                    );
                  }
                );
              });
            });
          });
        });
      });
    });
  });
});
```

# 12) Gesture Tests Must Verify the End-to-End Interaction Chain

For every behavioral gesture declared in the specification, the `<component>.test.ts` must verify the full interaction chain: DOM event on the realized element → operation invocation → state change → event dispatch.

Policy:

- the DOM event is triggered directly on the realized element via `.click()` or the equivalent native method
- the element is located by selector (e.g., `pin.root.querySelector(".icon")`) — this verifies that the gesture wiring depends on the realized composition, not on a cached reference name
- the state outcome of the triggered operation must be verified via the getter
- the event dispatched as a consequence of the state change must be verified as having been called
- for gestures that trigger a bidirectional toggle, both directions must be verified in sequence: a second interaction block nested inside the first restores the prior state and confirms the reverse outcome
- visual gestures declared with `effects` are realized entirely in CSS — they do not require JavaScript assertions in the test suite

Example:

```typescript
gesture(Gesture.CLICK, () => {
  and("Pin is defined in custom element registry", () => {
    beforeEach(() => {
      define(Pin.Tag, Pin);
    });

    and("HTML Template is added to DOM", () => {
      beforeEach(async () => {
        await Pin.Template.load("pin.template.html");
      });
      afterEach(() => {
        remove(Pin.Tag);
      });

      and("a new pin is added to DOM", () => {
        let pin: Pin;
        beforeEach(() => {
          pin = add<Pin>(Pin.Tag);
        });
        afterEach(() => {
          pin.remove();
        });

        when("user `click` on `div` with class `icon`", () => {
          let onpin: jasmine.Spy;
          beforeEach(() => {
            onpin = jasmine.createSpy("onpin");
            pin.onpin = onpin;
            const icon = pin.root.querySelector(".icon") as HTMLElement;
            icon.click();
          });

          then("`pin.status` is `Status.PINNED`", () => {
            expect(pin.status).toEqual(Status.PINNED);
          });

          then("`onpin` is called", () => {
            expect(onpin).toHaveBeenCalled();
          });

          and("user `click` on `div` with class `icon`", () => {
            let onunpin: jasmine.Spy;
            beforeEach(() => {
              onunpin = jasmine.createSpy("onunpin");
              pin.onunpin = onunpin;
              const icon = pin.root.querySelector(".icon") as HTMLElement;
              icon.click();
            });

            then("`pin.status` is `Status.UNPINNED`", () => {
              expect(pin.status).toEqual(Status.UNPINNED);
            });

            then("`onunpin` is called", () => {
              expect(onunpin).toHaveBeenCalled();
            });
          });
        });
      });
    });
  });
});
```
