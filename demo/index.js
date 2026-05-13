import { component } from "@tungthac/pin-button";

await component.Template.load("pin.template.html");

customElements.define(component.Tag, component);
