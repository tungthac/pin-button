import { Template } from "@scalable.software/component";

import {
  Pin,
  Tag,
  CSS,
  Attributes,
  State,
  Visibility,
  Operation
} from "@tungthac/pin-button";

// Configuration
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

configuration(Configuration.ATTRIBUTES, () => {
  and("Pin imported", () => {
    then("Pin is defined", () => {
      expect(Pin).toBeDefined();
    });

    and("Pin is defined", () => {
      then("Pin.Attributes static getter is defined", () => {
        expect(Pin.Attributes).toBeDefined();
      });

      and("Pin.Attributes static getter is defined", () => {
        then("Pin.Attributes is Attributes", () => {
          expect(Pin.Attributes).toBe(Attributes);
        });
      });
    });
  });
});

// Utilities
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

// Compositions
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

      then("template is defined", () => {
        expect(template).toBeDefined();
      });

      and("a new pin is added to DOM", () => {
        let pin: Pin;
        beforeEach(() => {
          pin = add<Pin>(Pin.Tag);
        });
        afterEach(() => {
          pin.remove();
        });

        then("pin.root contents contains template contents", () => {
          expect(pin.root.innerHTML).toContain(template.innerHTML);
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
        });
      });
    });
  });
});

composition(Composition.CSS, () => {
  given("Pin is defined in custom element registry", () => {
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

        then("pin.root contents contains a link to stylesheet", () => {
          expect(pin.root.innerHTML).toContain("stylesheet");
        });

        and("pin.root contents contains a link to stylesheet", () => {
          then("the stylesheet file's name is correct", () => {
            expect(pin.root.innerHTML).toContain(CSS);
          });
        });
      });
    });
  });
});

// State
state(State.VISIBILITY, () => {
  given("Pin is defined in custom element registry", () => {
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
              pin.visibility = null as unknown as Visibility;
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
                // @ts-expect-error - intentional invalid input
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
      });
    });
  });
});

// Operation
operation(Operation.HIDE, () => {
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

        then("`pin.hide` method exists", () => {
          expect(pin.hide).toBeDefined();
        });

        and("`pin.hide` method exists", () => {
          when("invoking `pin.hide`", () => {
            beforeEach(() => {
              pin.hide();
            });
            afterEach(() => {
              pin.visibility = Visibility.VISIBLE;
            });

            then("`pin.visibility` is `Visibility.HIDDEN`", () => {
              expect(pin.visibility).toBe(Visibility.HIDDEN);
            });
          });
        });

        then("`pin.show` method exists", () => {
          expect(pin.show).toBeDefined();
        });
      });
    });
  });
});

// Event

// Gesture
