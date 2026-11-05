export interface FlashMessage {
  tone: "success" | "danger" | "warning" | "info";
  text: string;
}

/** The success and error banners FAP puts on a page (e.g. after saving), outside the form itself. */
export function readFlashMessages(doc: Document, formSelector?: string): FlashMessage[] {
  if (!doc) return [];
  const form = formSelector ? doc.querySelector(formSelector) : null;
  const out: FlashMessage[] = [];
  doc.querySelectorAll(".alert").forEach((el) => {
    if (form && form.contains(el)) return;
    if (el.classList.contains("d-none") || el.hasAttribute("hidden")) return;
    const text = (el.textContent || "").replace(/\s+/g, " ").trim();
    if (!text) return;
    const tone = el.classList.contains("alert-success")
      ? "success"
      : el.classList.contains("alert-danger")
      ? "danger"
      : el.classList.contains("alert-warning")
      ? "warning"
      : "info";
    out.push({ tone, text });
  });
  return out;
}
