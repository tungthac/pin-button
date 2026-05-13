/**
 * @module Pin
 */

// Base Component
import { Component, Template } from "@scalable.software/component";
import { type Configuration } from "@scalable.software/component";

// Component Metadata
import { Tag, CSS, Attributes, Visibility } from "./pin.meta.js";

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
export class Pin extends Component {
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
   * Canonical visibility state.
   * @category State
   * @hidden
   */
  private _visibility: Visibility = Visibility.VISIBLE;

  /**
   * Returns the current visibility state.
   * @category State
   */
  public get visibility(): Visibility {
    return this._visibility;
  }

  /**
   * Sets the visibility state.
   * @category State
   */
  public set visibility(visibility: Visibility) {
    visibility = visibility ?? Visibility.VISIBLE;
    this._visibility = visibility;
    visibility === Visibility.VISIBLE && this.removeAttribute(Attributes.VISIBILITY);
    visibility === Visibility.HIDDEN && this.setAttribute(Attributes.VISIBILITY, visibility);
  }

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
