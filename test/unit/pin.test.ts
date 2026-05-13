import { Template } from "@scalable.software/component";

import {
  Pin,
  Tag,
  CSS,
  Attributes,
  State,
  Visibility,
  Status,
  Operation,
  Event,
  Gesture
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

          then("`div.icon` contains `svg.pinned`", () => {
            const svg = div.querySelector("svg.pinned");
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

state(State.STATUS, () => {
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

        then("`pin.status` getter exists", () => {
          expect(pin.status).toBeDefined();
        });

        when("`pin.status` getter exists", () => {
          then("`pin.status` is `Status.UNPINNED`", () => {
            expect(pin.status).toBe(Status.UNPINNED);
          });
        });

        then("`status` attribute exists", () => {
          expect(pin.getAttribute(Attributes.STATUS)).not.toBeNull();
        });

        and("`status` attribute exists", () => {
          then("`status` attribute is `Status.UNPINNED`", () => {
            expect(pin.getAttribute(Attributes.STATUS)).toBe(Status.UNPINNED);
          });
        });

        then("`pin.status` setter exists", () => {
          expect(hasSetter(pin, "status")).toBeTrue();
        });

        and("`pin.status` setter exists", () => {
          when("`pin.status` is set to `Status.PINNED`", () => {
            beforeEach(() => {
              pin.status = Status.PINNED;
            });
            afterEach(() => {
              pin.status = Status.UNPINNED;
            });

            then("`pin.status` is `Status.PINNED`", () => {
              expect(pin.status).toBe(Status.PINNED);
            });

            then("pin `status` attribute is `Status.PINNED`", () => {
              expect(pin.getAttribute(Attributes.STATUS)).toBe(Status.PINNED);
            });
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

          when("`pin.status` is set to `invalid`", () => {
            let error: Error;
            beforeEach(() => {
              try {
                // @ts-expect-error - intentional invalid input
                pin.status = "invalid";
              } catch (err) {
                error = err as Error;
              }
            });
            afterEach(() => {
              pin.status = Status.UNPINNED;
            });

            then("an error is thrown", () => {
              expect(error).toBeDefined();
            });

            then("error message contains 'Invalid status value: invalid'", () => {
              expect(error.message).toBe("Invalid status value: invalid");
            });
          });
        });
      });
    });
  });
});

// Operation — Toggle composite group
operation(Operation.TOGGLE, () => {
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
      });
    });
  });
});

// Operation — Pin/Unpin paired group
operation(Operation.PIN, () => {
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

        then("`pin.pin` method exists", () => {
          expect(pin.pin).toBeDefined();
        });

        and("`pin.pin` method exists", () => {
          when("invoking `pin.pin`", () => {
            beforeEach(() => {
              pin.pin();
            });
            afterEach(() => {
              pin.status = Status.UNPINNED;
            });

            then("`pin.status` is `Status.PINNED`", () => {
              expect(pin.status).toBe(Status.PINNED);
            });
          });
        });

        then("`pin.unpin` method exists", () => {
          expect(pin.unpin).toBeDefined();
        });

        and("`pin.unpin` method exists", () => {
          and("`pin.status` is `Status.PINNED`", () => {
            beforeEach(() => {
              pin.status = Status.PINNED;
            });
            afterEach(() => {
              pin.status = Status.UNPINNED;
            });

            when("invoking `pin.unpin`", () => {
              beforeEach(() => {
                pin.unpin();
              });

              then("`pin.status` is `Status.UNPINNED`", () => {
                expect(pin.status).toBe(Status.UNPINNED);
              });
            });
          });
        });
      });
    });
  });
});

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

        and("`pin.show` method exists", () => {
          and("`pin.visibility` is `Visibility.HIDDEN`", () => {
            beforeEach(() => {
              pin.visibility = Visibility.HIDDEN;
            });
            afterEach(() => {
              pin.visibility = Visibility.VISIBLE;
            });

            when("invoking `pin.show`", () => {
              beforeEach(() => {
                pin.show();
              });

              then("`pin.visibility` is `Visibility.VISIBLE`", () => {
                expect(pin.visibility).toBe(Visibility.VISIBLE);
              });
            });
          });
        });
      });
    });
  });
});

// Event
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

events(Event.ON_SHOW, () => {
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

        then("`pin.onshow` setter exists", () => {
          expect(hasSetter(pin, Event.ON_SHOW)).toBeTrue();
        });

        and("`pin.onshow` setter exists", () => {
          and("`pin.visibility` is `Visibility.HIDDEN`", () => {
            beforeEach(() => {
              pin.visibility = Visibility.HIDDEN;
            });
            afterEach(() => {
              pin.visibility = Visibility.VISIBLE;
            });

            and("`pin.onshow` is set to a listener", () => {
              let onshow: jasmine.Spy;
              beforeEach(() => {
                onshow = jasmine.createSpy("onshow");
                pin.onshow = onshow;
              });
              afterEach(() => {
                pin.onshow = null;
              });

              and("`pin.onshow` is set to a new listener", () => {
                let onshow2: jasmine.Spy;
                beforeEach(() => {
                  onshow2 = jasmine.createSpy("onshow2");
                  pin.onshow = onshow2;
                });
                afterEach(() => {
                  pin.onshow = null;
                });

                when("`pin.visibility` is set to `Visibility.VISIBLE`", () => {
                  beforeEach(() => {
                    pin.visibility = Visibility.VISIBLE;
                  });

                  then("old `pin.onshow` is not called", () => {
                    expect(onshow).not.toHaveBeenCalled();
                  });

                  then("new `pin.onshow` is called", () => {
                    expect(onshow2).toHaveBeenCalled();
                  });

                  then(
                    "new `pin.onshow` is called with `{ detail: { visibility: Visibility.VISIBLE } }`",
                    () => {
                      expect(onshow2).toHaveBeenCalledWith(
                        jasmine.objectContaining({
                          detail: { visibility: Visibility.VISIBLE }
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
});

events(Event.ON_PIN, () => {
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

        then("`pin.onpin` setter exists", () => {
          expect(hasSetter(pin, Event.ON_PIN)).toBeTrue();
        });

        and("`pin.onpin` setter exists", () => {
          and("`pin.onpin` is set to a listener", () => {
            let onpin: jasmine.Spy;
            beforeEach(() => {
              onpin = jasmine.createSpy("onpin");
              pin.onpin = onpin;
            });
            afterEach(() => {
              pin.onpin = null;
            });

            and("`pin.onpin` is set to a new listener", () => {
              let onpin2: jasmine.Spy;
              beforeEach(() => {
                onpin2 = jasmine.createSpy("onpin2");
                pin.onpin = onpin2;
              });
              afterEach(() => {
                pin.onpin = null;
              });

              when("`pin.status` is set to `Status.PINNED`", () => {
                beforeEach(() => {
                  pin.status = Status.PINNED;
                });
                afterEach(() => {
                  pin.status = Status.UNPINNED;
                });

                then("old `pin.onpin` is not called", () => {
                  expect(onpin).not.toHaveBeenCalled();
                });

                then("new `pin.onpin` is called", () => {
                  expect(onpin2).toHaveBeenCalled();
                });

                then(
                  "new `pin.onpin` is called with `{ detail: { status: Status.PINNED } }`",
                  () => {
                    expect(onpin2).toHaveBeenCalledWith(
                      jasmine.objectContaining({
                        detail: { status: Status.PINNED }
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

events(Event.ON_UNPIN, () => {
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

        then("`pin.onunpin` setter exists", () => {
          expect(hasSetter(pin, Event.ON_UNPIN)).toBeTrue();
        });

        and("`pin.onunpin` setter exists", () => {
          and("`pin.status` is `Status.PINNED`", () => {
            beforeEach(() => {
              pin.status = Status.PINNED;
            });
            afterEach(() => {
              pin.status = Status.UNPINNED;
            });

            and("`pin.onunpin` is set to a listener", () => {
              let onunpin: jasmine.Spy;
              beforeEach(() => {
                onunpin = jasmine.createSpy("onunpin");
                pin.onunpin = onunpin;
              });
              afterEach(() => {
                pin.onunpin = null;
              });

              and("`pin.onunpin` is set to a new listener", () => {
                let onunpin2: jasmine.Spy;
                beforeEach(() => {
                  onunpin2 = jasmine.createSpy("onunpin2");
                  pin.onunpin = onunpin2;
                });
                afterEach(() => {
                  pin.onunpin = null;
                });

                when("`pin.status` is set to `Status.UNPINNED`", () => {
                  beforeEach(() => {
                    pin.status = Status.UNPINNED;
                  });

                  then("old `pin.onunpin` is not called", () => {
                    expect(onunpin).not.toHaveBeenCalled();
                  });

                  then("new `pin.onunpin` is called", () => {
                    expect(onunpin2).toHaveBeenCalled();
                  });

                  then(
                    "new `pin.onunpin` is called with `{ detail: { status: Status.UNPINNED } }`",
                    () => {
                      expect(onunpin2).toHaveBeenCalledWith(
                        jasmine.objectContaining({
                          detail: { status: Status.UNPINNED }
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
});

composition(Composition.ELEMENT, () => {
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

        then("`pin.elements.icon` is a cached reference to the `div` with class `icon`", () => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          expect((pin as any).elements.icon).toBe(
            pin.root.querySelector("div.icon")
          );
        });
      });
    });
  });
});

// Gesture
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
