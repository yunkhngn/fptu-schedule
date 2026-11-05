import React from "react";
import { createRoot } from "react-dom/client";

export function boot(target?: HTMLElement): void {
  if (target) {
    const root = createRoot(target);
    root.render(React.createElement("div", { id: "fap-ui-root" }, "FAP UI"));
  }
}

if (typeof window !== "undefined") {
  (window as any).__fptuUi = true;
  boot();
}

