/**
 * wrapped.tsx — Adopt and restore native FAP content inside Shadow DOM slot
 */

export interface AdoptResult {
  restore(): void;
}

/**
 * Finds `.content-page` in the document, moves it to be a direct child of host
 * with slot="fap-content" so native CSS and scripts continue to apply.
 * Returns a handle with restore() to move it back to its original parent and position.
 */
export function adoptContent(doc: Document, host: HTMLElement): AdoptResult | null {
  const content = doc.querySelector(".content-page");
  if (!content) return null;
  const parent = content.parentNode;
  if (!parent) return null;
  const nextSibling = content.nextSibling;

  content.setAttribute("slot", "fap-content");
  host.appendChild(content);

  let restored = false;
  return {
    restore() {
      if (restored) return;
      restored = true;
      content.removeAttribute("slot");
      if (nextSibling && parent.contains(nextSibling)) {
        parent.insertBefore(content, nextSibling);
      } else {
        parent.appendChild(content);
      }
    },
  };
}

/**
 * Resolves page title from .fap-page-title__crumb-current or document.title
 * without the " - FAP - FPT Education" suffix.
 */
export function resolveWrappedTitle(doc: Document): string {
  const crumb = doc.querySelector(".fap-page-title__crumb-current");
  if (crumb && crumb.textContent) {
    const text = crumb.textContent.trim();
    if (text) return text;
  }
  const title = doc.title || "";
  return title.replace(/\s*-\s*FAP\s*-\s*FPT Education$/i, "").trim();
}

/**
 * Adopts an article body element into host with slot="fap-article-body".
 * Returns a handle with restore() to move it back to original parent.
 */
export function adoptArticleBody(
  doc: Document,
  host: HTMLElement,
  selector: string
): AdoptResult | null {
  const content = doc.querySelector(selector);
  if (!content) return null;
  const parent = content.parentNode;
  if (!parent) return null;
  const nextSibling = content.nextSibling;

  content.setAttribute("slot", "fap-article-body");
  host.appendChild(content);

  let restored = false;
  return {
    restore() {
      if (restored) return;
      restored = true;
      content.removeAttribute("slot");
      if (nextSibling && parent.contains(nextSibling)) {
        parent.insertBefore(content, nextSibling);
      } else {
        parent.appendChild(content);
      }
    },
  };
}

