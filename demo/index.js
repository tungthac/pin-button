import { Pin } from "@tungthac/pin-button";

await Pin.Template.load("pin.template.html");

customElements.define(Pin.Tag, Pin);
