// assertion library for testing
declare function given(description: string, fn: () => void): void;
declare function and(description: string, fn: () => void): void;
declare function when(description: string, fn: () => void): void;
declare function then(description: string, fn: () => void): void;

declare function configuration(configuration: string, fn: () => void): void;
declare function utility(utility: string, fn: () => void): void;
declare function composition(composition: string, fn: () => void): void;
declare function element(element: string, fn: () => void): void;
declare function state(state: string, fn: () => void): void;
declare function operation(operation: string, fn: () => void): void;
declare function events(event: string, fn: () => void): void;
declare function gesture(gesture: string, fn: () => void): void;
declare function metadata(metadata: string, fn: () => void): void;
declare function validation(state: string, fn: () => void): void;

declare const Metadata: {
  TAG: string;
  CSS: string;
  ATTRIBUTES: string;
  STATE: string;
  OPERATION: string;
  EVENT: string;
  GESTURE: string;
};

declare const Configuration: {
  TAG: string;
  ATTRIBUTES: string;
};

declare const Utilities: {
  GET: string;
  TEMPLATE: string;
};

declare const Composition: {
  TEMPLATE: string;
  CSS: string;
  ELEMENT: string;
};

// utility functions for testing web components
declare function define(tag: string, component: any): void;
declare function add<T extends Element>(
  tag: string,
  attributes?: any,
  innerHTML?: string
): T;
declare function remove(id: string): void;
declare function hasSetter(obj: any, propName: string): boolean;
