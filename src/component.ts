/**
 * @module Component
 */

// Base Component
import { Component, Template } from "@scalable.software/component";
import { type Configuration } from "@scalable.software/component";

// Component Metadata
import { Tag, CSS, Attributes } from "./component.meta.js";

/**
 * Optional Configuration: required for components with custom layout and style
 * @category Configuration
 */
export const configuration: Configuration = {
  url: import.meta.url,
  template: {
    id: Tag
  },
  css: {
    name: CSS
  }
} as const;

/**
 * @category Component
 */
export class component extends Component {
  /**
   * The tag name of the component
   * @category Configuration
   */
  public static get Tag() {
    return Tag;
  }

  /**
   * Only attributes defined the Attributes object will be observed in DOM
   * @category State
   */
  public static get Attributes(): Attributes {
    return Attributes;
  }

  /**
   * Helper function to load the component template into DOM
   * @category Utility
   */
  public static Template = new Template(import.meta.url);

  /**
   * Cache element references to improve performance
   * @category State
   * @hidden
   */
  protected elements: {} = {};

  /**
   * @hidden
   */
  constructor() {
    super(configuration);
  }

  /**
   * List operations to perform for selected attributes being observed in the DOM.
   * @category Configuration
   * @hidden
   */
  protected _attributeHandlers = {};

  /**
   * Cache element references to improve performance
   * @category Configuration
   * @hidden
   */
  protected _cache = () => {};

  /**
   * Initialize component attributes with default values
   * @category Configuration
   * @hidden
   */
  protected _initialize = () => {};

  /**
   * Called by the connectedCallback prototypical method
   * @category Configuration
   * @hidden
   */
  protected _addEventListeners = () => {};

  /**
   * Called by the disconnectedCallback prototypical method
   * @category Configuration
   * @hidden
   */
  protected _removeEventListeners = () => {};
}
