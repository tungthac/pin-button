import { State, Visibility, Validate } from "@tungthac/pin-button";

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

      and("`value` is `Visibility.HIDDEN`", () => {
        let value: any;
        beforeEach(() => {
          value = Visibility.HIDDEN;
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

          then("result is `Visibility.HIDDEN`", () => {
            expect(result).toBe(Visibility.HIDDEN);
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
