/**
 * @module Component
 */

/**
 * @category Configuration
 */
export const Tag = "component-template" as const;

/**
 * @category Configuration
 */
export const CSS = "component.style.css" as const;

/**
 * HTML Attributes available to set
 * @category Metadata
 * @enum
 */
export const Attributes = {} as const;
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
