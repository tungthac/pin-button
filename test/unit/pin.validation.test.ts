import { State, Validate } from "@tungthac/pin-button";

// Visibility
validation(State.VISIBILITY, () => {
  given("Validate imported", () => {
    then("Validate is defined", () => {
      expect(Validate).toBeDefined();
    });

    and("Validate is defined", () => {
      then("`Validate.visibility` static method is defined", () => {
        expect(Validate.visibility).toBeDefined();
      });
    });
  });
});
