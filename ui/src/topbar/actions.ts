export function submitLanguage(doc: Document, culture: string): boolean {
  if (!doc) return false;

  const flagKey = "__fptuSubmittingLanguage";
  if ((doc as any)[flagKey]) return false;

  const form = doc.querySelector('form[action*="/Language/SetLanguage"]');
  if (!form) return false;

  const btn = form.querySelector(`button[name="culture"][value="${culture}"]`) as HTMLButtonElement | null;
  if (!btn) return false;

  (doc as any)[flagKey] = true;
  btn.click();
  return true;
}
