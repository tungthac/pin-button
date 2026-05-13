import {
  Tag,
  Attributes,
  State,
  Visibility,
  Operation,
  Event,
  Gesture
} from "@tungthac/pin-button";

// Tag
metadata(Metadata.TAG, () => {
  when("Tag imported", () => {
    then("Tag is defined", () => {
      expect(Tag).toBeDefined();
    });
  });
});

// Attributes
metadata(Metadata.ATTRIBUTES, () => {
  and("Attribute imported", () => {
    then("Attributes is defined", () => {
      expect(Attributes).toBeDefined();
    });

    when("Attributes is defined", () => {
      then("Attributes is an object", () => {
        expect(typeof Attributes).toBe("object");
      });

      then("`Attributes.VISIBILITY` exists", () => {
        expect(Attributes.VISIBILITY).toBeDefined();
      });

      then("`Attributes.STATUS` exists", () => {
        expect(Attributes.STATUS).toBeDefined();
      });
    });
  });
});

// State
metadata(Metadata.STATE, () => {
  and("State imported", () => {
    then("State is defined", () => {
      expect(State).toBeDefined();
    });

    when("State is defined", () => {
      then("State is an object", () => {
        expect(typeof State).toBe("object");
      });

      then("`State.VISIBILITY` exists", () => {
        expect(State.VISIBILITY).toBeDefined();
      });

      then("`State.STATUS` exists", () => {
        expect(State.STATUS).toBeDefined();
      });
    });
  });
});

// Visibility
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

// Operation
metadata(Metadata.OPERATION, () => {
  and("Operation imported", () => {
    then("Operation is defined", () => {
      expect(Operation).toBeDefined();
    });

    when("Operation is defined", () => {
      then("Operation is an object", () => {
        expect(typeof Operation).toBe("object");
      });

      then("`Operation.HIDE` exists", () => {
        expect(Operation.HIDE).toBeDefined();
      });

      then("`Operation.SHOW` exists", () => {
        expect(Operation.SHOW).toBeDefined();
      });
    });
  });
});

// Event
metadata(Metadata.EVENT, () => {
  and("Event imported", () => {
    then("Event is defined", () => {
      expect(Event).toBeDefined();
    });

    when("Event is defined", () => {
      then("Event is an object", () => {
        expect(typeof Event).toBe("object");
      });

      then("`Event.ON_HIDE` exists", () => {
        expect(Event.ON_HIDE).toBeDefined();
      });

      then("`Event.ON_SHOW` exists", () => {
        expect(Event.ON_SHOW).toBeDefined();
      });
    });
  });
});

// Gesture
metadata(Metadata.GESTURE, () => {
  and("Gesture imported", () => {
    then("Gesture is defined", () => {
      expect(Gesture).toBeDefined();
    });

    when("Gesture is defined", () => {
      then("Gesture is an object", () => {
        expect(typeof Gesture).toBe("object");
      });
    });
  });
});
