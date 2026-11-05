export interface AdoptedLogin {
  restore(): void;
}

/**
 * Moves FAP's whole sign-in block (the tabs, the Google and FeID links and the parent form with its inputs) into
 * the new frame as ONE node. Nothing inside is touched, so the browser's password manager, FAP's validation and
 * the reCAPTCHA keep working exactly as on the old page. The block sits in the normal DOM (not in the shadow
 * tree) and shows through a slot.
 */
export function adoptLoginCard(doc: Document, host: HTMLElement): AdoptedLogin | null {
  const block = doc.querySelector("#login-step-credentials");
  if (!block) return null;
  const parent = block.parentNode;
  if (!parent) return null;
  const nextSibling = block.nextSibling;

  block.setAttribute("slot", "fap-login");
  host.appendChild(block);

  let restored = false;
  return {
    restore() {
      if (restored) return;
      restored = true;
      block.removeAttribute("slot");
      if (nextSibling && parent.contains(nextSibling)) parent.insertBefore(block, nextSibling);
      else parent.appendChild(block);
    },
  };
}
