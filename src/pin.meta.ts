/**
 * @module Component
 */

/**
 * @category Configuration
 */
export const Tag = "pin-button" as const;

/**
 * @category Configuration
 */
export const CSS = "pin.style.css" as const;

/**
 * HTML Attributes available to set
 * @category Metadata
 * @enum
 */
export const Attributes = {
  VISIBILITY: "visibility"
} as const;
/**
 * HTML Attributes available to set
 * @category Metadata
 */
export type Attributes = typeof Attributes;

/**
 * HTML Attributes available to set
 * @category Metadata
 * @enum
 */
export const State = {
  ...Attributes
} as const;

/**
 * Visibility value domain
 * @category Metadata
 * @enum
 */
export const Visibility = {} as const;

/**
 * Visibility value domain
 * @category Metadata
 */
export type Visibility = (typeof Visibility)[keyof typeof Visibility];

/**
 * HTML Attributes available to set
 * @category Metadata
 */
export type State = (typeof State)[keyof typeof State];

/**
 * @category Metadata
 * @enum
 */
export const Operation = {} as const;

/**
 * @category Metadata
 */
export type Operation = (typeof Operation)[keyof typeof Operation];

/**
 * @category Metadata
 * @enum
 */
export const Event = {} as const;
/**
 * @category Metadata
 */
export type Event = (typeof Event)[keyof typeof Event];

/**
 * @category Metadata
 * @enum
 */
export const Gesture = {} as const;
/**
 * @category Metadata
 */
export type Gesture = (typeof Gesture)[keyof typeof Gesture];
