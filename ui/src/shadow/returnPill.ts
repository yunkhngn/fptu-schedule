const PILL_ID = "fptu-ui-return";

const PILL_CSS = `
  :host { all: initial; }
  button {
    position: fixed;
    right: 20px;
    bottom: 20px;
    z-index: 2147483000;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    border: 0;
    border-radius: 999px;
    background: #6d5fd6;
    color: #ffffff;
    font: 600 13px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    box-shadow: 0 10px 30px -10px rgba(40, 30, 120, 0.55);
    cursor: pointer;
  }
  button:hover { background: #5a4cc2; }
  button:focus-visible { outline: 3px solid #c9c3ff; outline-offset: 2px; }
`;

/**
 * Small floating button on a page the student chose to see in its original form.
 * Without it the choice is a dead end, because the original page has no control for returning.
 */
export function mountReturnPill(doc: Document, onClick: () => void): () => void {
  let host = doc.getElementById(PILL_ID);
  if (host) host.remove();

  host = doc.createElement("div");
  host.id = PILL_ID;
  const root = host.attachShadow({ mode: "open" });

  const style = doc.createElement("style");
  style.textContent = PILL_CSS;
  const button = doc.createElement("button");
  button.type = "button";
  button.textContent = "Dùng giao diện mới";
  button.addEventListener("click", onClick);

  root.appendChild(style);
  root.appendChild(button);
  (doc.body || doc.documentElement).appendChild(host);

  return () => {
    host?.remove();
  };
}

export function removeReturnPill(doc: Document): void {
  const host = doc.getElementById(PILL_ID);
  if (host) host.remove();
}
