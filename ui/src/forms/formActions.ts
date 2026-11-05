/**
 * Writes to, and presses, the ORIGINAL controls of a FAP form. The new interface never builds its own request:
 * FAP validates, adds its anti-forgery token and sends the form exactly as if the student had used the old page.
 */

const BLOCKED_TYPES = new Set(["password", "hidden", "file", "submit", "button", "reset", "image"]);
const submitted = new WeakSet<Element>();

function formOf(doc: Document, selector: string): HTMLFormElement | null {
  if (!doc) return null;
  return doc.querySelector(selector) as HTMLFormElement | null;
}

function fire(el: Element, type: string) {
  el.dispatchEvent(new Event(type, { bubbles: true, cancelable: true }));
}

export function setFieldValue(doc: Document, formSelector: string, name: string, value: string): boolean {
  const form = formOf(doc, formSelector);
  if (!form || !name) return false;

  const controls = Array.from(
    form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
      `[name="${name.replace(/"/g, '\\"')}"]`
    )
  );
  if (controls.length === 0) return false;

  const first = controls[0];
  const type = first instanceof HTMLInputElement ? first.type.toLowerCase() : first.tagName.toLowerCase();
  if (BLOCKED_TYPES.has(type)) return false;
  if (first.hasAttribute("readonly") || first.hasAttribute("disabled")) return false;

  if (type === "radio") {
    const target = controls.find((c) => (c as HTMLInputElement).value === value) as HTMLInputElement | undefined;
    if (!target) return false;
    target.checked = true;
    fire(target, "input");
    fire(target, "change");
    return true;
  }

  if (type === "checkbox") {
    (first as HTMLInputElement).checked = value === "true";
    fire(first, "input");
    fire(first, "change");
    return true;
  }

  first.value = value;
  fire(first, "input");
  fire(first, "change");
  return true;
}

export function submitForm(doc: Document, formSelector: string): boolean {
  const form = formOf(doc, formSelector);
  if (!form) return false;
  if (submitted.has(form)) return false;

  const button = form.querySelector<HTMLElement>('button[type="submit"], input[type="submit"]');
  if (!button) return false;

  submitted.add(form);
  button.click(); // not form.submit(): that would skip FAP's validation and tokens
  return true;
}

/** Lets the form be submitted again, e.g. after FAP's own validation refused it and the page stayed put. */
export function resetSubmitGuard(doc: Document, formSelector: string): void {
  const form = formOf(doc, formSelector);
  if (form) submitted.delete(form);
}
