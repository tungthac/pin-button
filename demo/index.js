import { Pin } from "@tungthac/pin-button";

await Pin.Template.load("pin.template.html");

customElements.define(Pin.Tag, Pin);

// Wait one tick so the elements are upgraded.
await customElements.whenDefined(Pin.Tag);

const log = document.getElementById("log");
const status = document.getElementById("status");
const primary = document.getElementById("primary");
const visibleTarget = document.getElementById("visible-target");

const pushLog = (tag, message) => {
  const row = document.createElement("div");
  row.className = "row";
  const time = new Date().toLocaleTimeString();
  row.innerHTML = `<span class="time">${time}</span><span class="tag ${tag}">${tag}</span><span>${message}</span>`;
  log.prepend(row);
  while (log.children.length > 20) log.lastChild.remove();
};

primary.onpin = (e) => {
  status.textContent = e.detail.status;
  pushLog("onpin", "primary");
};
primary.onunpin = (e) => {
  status.textContent = e.detail.status;
  pushLog("onunpin", "primary");
};

visibleTarget.onshow = (e) => pushLog("onshow", `visibility = ${e.detail.visibility}`);
visibleTarget.onhide = (e) => pushLog("onhide", `visibility = ${e.detail.visibility}`);

document.getElementById("force-pin").onclick = () => primary.pin();
document.getElementById("force-unpin").onclick = () => primary.unpin();
document.getElementById("hide").onclick = () => visibleTarget.hide();
document.getElementById("show").onclick = () => visibleTarget.show();
