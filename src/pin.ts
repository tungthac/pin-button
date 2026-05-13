/**
 * @module Pin
 */

// Base Component
import { Component, Template } from "@scalable.software/component";
import { type Configuration } from "@scalable.software/component";

// Component Metadata
import { Tag, CSS, Attributes, Visibility, Status, Event } from "./pin.meta.js";
import { Validate } from "./pin.validation.js";

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
   * Canonical pin status state.
   * @category State
   * @hidden
   */
  private _status: Status = Status.UNPINNED;

  /**
   * Returns the current pin status.
   * @category State
   */
  public get status(): Status {
    return this._status;
  }

  /**
   * Sets the pin status.
   * @category State
   */
  public set status(status: Status) {
    status = Validate.status(status);
    this._status = status;
    this.setAttribute(Attributes.STATUS, status);

    const event = { detail: { status } };
    status === Status.PINNED && this._dispatchEvent(Event.ON_PIN, event);
  }

  /**
   * Returns the current visibility state.
   * @category State
   */
  public get visibility(): Visibility {
    return this._visibility;
  }

  /**
   * Sets visibility to HIDDEN.
   * @category Operation
   */
  public hide = () => (this.visibility = Visibility.HIDDEN);

  /**
   * Sets visibility to VISIBLE.
   * @category Operation
   */
  public show = () => (this.visibility = Visibility.VISIBLE);

  /**
   * Sets pin status to PINNED.
   * @category Operation
   */
  public pin = () => (this.status = Status.PINNED);

  /**
   * Sets pin status to UNPINNED.
   * @category Operation
   */
  public unpin = () => (this.status = Status.UNPINNED);

  /**
   * Toggles pin status between PINNED and UNPINNED.
   * @category Operation
   */
  public toggle = () =>
    (this.status =
      this.status === Status.PINNED ? Status.UNPINNED : Status.PINNED);

  /**
   * onhide subscription handler slot.
   * @category Event
   * @hidden
   */
  private _onhide: EventListener | null = null;

  /**
   * Subscribes a listener to the onhide event.
   * @category Event
   */
  public set onhide(handler: EventListener | null) {
    this._onhide && this.removeEventListener(Event.ON_HIDE, this._onhide);
    this._onhide = handler;
    this._onhide && this.addEventListener(Event.ON_HIDE, this._onhide);
  }

  /**
   * onshow subscription handler slot.
   * @category Event
   * @hidden
   */
  private _onshow: EventListener | null = null;

  /**
   * Subscribes a listener to the onshow event.
   * @category Event
   */
  public set onshow(handler: EventListener | null) {
    this._onshow && this.removeEventListener(Event.ON_SHOW, this._onshow);
    this._onshow = handler;
    this._onshow && this.addEventListener(Event.ON_SHOW, this._onshow);
  }

  /**
   * onpin subscription handler slot.
   * @category Event
   * @hidden
   */
  private _onpin: EventListener | null = null;

  /**
   * Subscribes a listener to the onpin event.
   * @category Event
   */
  public set onpin(handler: EventListener | null) {
    this._onpin && this.removeEventListener(Event.ON_PIN, this._onpin);
    this._onpin = handler;
    this._onpin && this.addEventListener(Event.ON_PIN, this._onpin);
  }

  /**
   * Sets the visibility state.
   * @category State
   */
  public set visibility(visibility: Visibility) {
    visibility = visibility ?? Visibility.VISIBLE;
    visibility = Validate.visibility(visibility);
    this._visibility = visibility;
    visibility === Visibility.VISIBLE && this.removeAttribute(Attributes.VISIBILITY);
    visibility === Visibility.HIDDEN && this.setAttribute(Attributes.VISIBILITY, visibility);

    const event = { detail: { visibility } };
    visibility === Visibility.HIDDEN && this._dispatchEvent(Event.ON_HIDE, event);
    visibility === Visibility.VISIBLE && this._dispatchEvent(Event.ON_SHOW, event);
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
  protected _attributeHandlers = {
    [Attributes.VISIBILITY]: (value: Visibility) => (this.visibility = value),
    [Attributes.STATUS]: (value: Status) => (this.status = value)
  };

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
  protected _initialize = () => {
    !this.hasAttribute(Attributes.STATUS) &&
      this.setAttribute(Attributes.STATUS, this._status);
  };

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
