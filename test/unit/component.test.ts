import { Template } from "@scalable.software/component";

import {
  component as Component,
  Tag,
  CSS,
  Attributes
} from "@scalable.software/component.template";

// Configuration
configuration(Configuration.TAG, () => {
  and("Component imported", () => {
    then("Component is defined", () => {
      expect(Component).toBeDefined();
    });

    and("Component is defined", () => {
      then("Component.Tag static getter is defined", () => {
        expect(Component.Tag).toBeDefined();
      });

      and("Component.Tag static getter is defined", () => {
        then("Component.Tag is Tag", () => {
          expect(Component.Tag).toBe(Tag);
        });
      });
    });
  });
});

configuration(Configuration.ATTRIBUTES, () => {
  and("Component imported", () => {
    then("Component is defined", () => {
      expect(Component).toBeDefined();
    });

    and("Component is defined", () => {
      then("Component.Attributes static getter is defined", () => {
        expect(Component.Attributes).toBeDefined();
      });

      and("Component.Attributes static getter is defined", () => {
        then("Component.Attributes is Attributes", () => {
          expect(Component.Attributes).toBe(Attributes);
        });
      });
    });
  });
});

// Utilities
utility(Utilities.TEMPLATE, () => {
  then("Component.Template static property is defined", () => {
    expect(Component.Template).toBeDefined();
  });

  and("Component.Template static property is defined", () => {
    then("Component.Template is a Template", () => {
      expect(Component.Template).toBeInstanceOf(Template);
    });
  });
});

// Compositions
composition(Composition.TEMPLATE, () => {
  given("Component is defined in custom element registry", () => {
    beforeEach(() => {
      define(Component.Tag, Component);
    });

    and("HTML Template is added to DOM", () => {
      let template: HTMLTemplateElement;
      beforeEach(async () => {
        template = (await Component.Template.load(
          "component.template.html"
        )) as HTMLTemplateElement;
      });
      afterEach(() => {
        remove(Component.Tag);
      });

      then("template is defined", () => {
        expect(template).toBeDefined();
      });

      and("a new component is added to DOM", () => {
        let component: Component;
        beforeEach(() => {
          component = add<Component>(Component.Tag);
        });
        afterEach(() => {
          component.remove();
        });

        then("component.root contents contains template contents", () => {
          expect(component.root.innerHTML).toContain(template.innerHTML);
        });
      });
    });
  });
});

composition(Composition.CSS, () => {
  given("Component is defined in custom element registry", () => {
    beforeEach(() => {
      define(Component.Tag, Component);
    });
    and("HTML Template is added to DOM", () => {
      beforeEach(async () => {
        await Component.Template.load("component.template.html");
      });
      afterEach(() => {
        remove(Component.Tag);
      });

      and("a new component is added to DOM", () => {
        let component: Component;
        beforeEach(() => {
          component = add<Component>(Component.Tag);
        });
        afterEach(() => {
          component.remove();
        });

        then("component.root contents contains a link to stylesheet", () => {
          expect(component.root.innerHTML).toContain("stylesheet");
        });

        and("component.root contents contains a link to stylesheet", () => {
          then("the stylesheet file's name is correct", () => {
            expect(component.root.innerHTML).toContain(CSS);
          });
        });
      });
    });
  });
});

// State

// Operation

// Event

// Gesture
