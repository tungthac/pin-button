/**
 * @module Pin
 */

import { Visibility, Status } from "./pin.meta.js";

/**
 * Runtime input enforcement for Pin state value domains.
 * Validators source their allowed values from `<pin>.meta.ts`.
 * @category Validation
 */
export class Validate {
  /**
   * Validates a visibility value.
   * @category Validation
   */
  public static visibility = (value: string) => {
    const valid = Object.values(Visibility).includes(value as Visibility);
    if (!valid) {
      throw new Error(`Invalid visibility value: ${value}`);
    }
    return value as Visibility;
  };

  /**
   * Validates a status value (minimum stub — throw logic added in subsequent commit).
   * @category Validation
   */
  public static status = (value: string) => value as Status;
}
