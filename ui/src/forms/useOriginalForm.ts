import { useCallback, useEffect, useRef, useState } from "react";
import { setFieldValue, submitForm, resetSubmitGuard } from "./formActions";
import type { FormModel } from "./FormView";

/** How long to wait for the page to leave before concluding FAP's validation stopped the submission. */
const STAYED_PUT_MS = 3500;

type Reader = { readForm: (doc: Document, selector: string) => FormModel | null };

function reader(doc: Document): Reader | null {
  const win = (doc.defaultView || window) as unknown as {
    FapPageData?: { forms?: Reader };
    FapFormReader?: Reader;
  };
  return win.FapPageData?.forms || win.FapFormReader || null;
}

/**
 * Follows one form of the FAP page: its fields as the page currently has them (FAP's scripts change options and
 * validation messages), what the student has typed, and a guarded submit.
 */
export function useOriginalForm(doc: Document, selector: string) {
  const read = useCallback(() => reader(doc)?.readForm(doc, selector) ?? null, [doc, selector]);

  const [form, setForm] = useState<FormModel | null>(() => read());
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep up with the original form. The page's scripts may replace options or write messages at any time.
  useEffect(() => {
    const el = doc.querySelector(selector);
    if (!el || typeof MutationObserver === "undefined") return;
    const observer = new MutationObserver(() => {
      const next = read();
      setForm(next);
      // A choice the student made may no longer exist (e.g. a ward after the province changed).
      setValues((prev) => {
        if (!next) return prev;
        const kept: Record<string, string> = {};
        for (const [name, value] of Object.entries(prev)) {
          const field = next.fields.find((f) => f.name === name);
          if (!field) continue;
          if (field.type === "select" && !(field.options || []).some((o) => o.value === value)) continue;
          kept[name] = value;
        }
        return Object.keys(kept).length === Object.keys(prev).length ? prev : kept;
      });
    });
    observer.observe(el, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["value", "selected", "disabled", "readonly"] });
    return () => observer.disconnect();
  }, [doc, selector, read]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  const setValue = useCallback(
    (name: string, value: string) => {
      setValues((prev) => ({ ...prev, [name]: value }));
      setFieldValue(doc, selector, name, value);
    },
    [doc, selector]
  );

  const submit = useCallback(() => {
    if (!submitForm(doc, selector)) return;
    setSubmitting(true);
    if (timer.current) clearTimeout(timer.current);
    // If the page is still here, FAP's validation refused the form: let the student fix it and try again.
    timer.current = setTimeout(() => {
      resetSubmitGuard(doc, selector);
      setSubmitting(false);
      setForm(read());
    }, STAYED_PUT_MS);
  }, [doc, selector, read]);

  return { form, values, setValue, submit, submitting };
}
