import { component } from "@scalable.software/component.template";

await component.Template.load("component.template.html");

customElements.define(component.Tag, component);
