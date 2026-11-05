import { useId } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { useT } from "@/i18n";

export interface FormField {
  name: string;
  label: string;
  type: "text" | "textarea" | "select" | "checkbox" | "radio" | "date" | "number" | "email" | "tel" | "url" | "search";
  value: string;
  readOnly: boolean;
  required: boolean;
  options?: Array<{ value: string; label: string }>;
  maxLength?: number;
  placeholder?: string;
  group?: string;
  error?: string;
}

export interface FormModel {
  fields: FormField[];
  action: string;
  method: string;
  submitLabel: string;
  unsupported: boolean;
  unsupportedReasons: string[];
}

export interface FormViewProps {
  form: FormModel;
  /** Values the student has typed, by field name; they win over what was read from the page. */
  values: Record<string, string>;
  onChange: (name: string, value: string) => void;
  onSubmit: () => void;
  submitting?: boolean;
  className?: string;
}

const control =
  "w-full rounded-xl border border-input bg-surface px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring aria-[invalid=true]:border-danger";

function shown(field: FormField, values: Record<string, string>): string {
  return field.name && field.name in values ? values[field.name] : field.value;
}

function isEmpty(field: FormField, value: string): boolean {
  if (field.type === "checkbox") return value !== "true";
  return value.trim() === "";
}

export function FormView({ form, values, onChange, onSubmit, submitting = false, className }: FormViewProps) {
  const t = useT();
  const uid = useId();

  // Fields in the order FAP has them, kept together under their section headings.
  const sections: Array<{ title?: string; fields: Array<{ field: FormField; index: number }> }> = [];
  form.fields.forEach((field, index) => {
    const last = sections[sections.length - 1];
    if (last && last.title === field.group) last.fields.push({ field, index });
    else sections.push({ title: field.group, fields: [{ field, index }] });
  });

  const missing = form.fields.some((f) => f.required && !f.readOnly && isEmpty(f, shown(f, values)));
  const blocked = submitting || missing;

  return (
    <form
      className={cn("space-y-8", className)}
      onSubmit={(event) => {
        event.preventDefault();
        if (!blocked) onSubmit();
      }}
    >
      {sections.map((section, s) => (
        <section key={s} className="space-y-4">
          {section.title && <h3 className="border-b border-border pb-2 text-sm font-semibold tracking-tight">{section.title}</h3>}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {section.fields.map(({ field, index }) => {
              const id = `${uid}-${index}`;
              const value = shown(field, values);
              const errorId = field.error ? `${id}-error` : undefined;
              const wide = field.type === "textarea" || field.type === "radio";

              return (
                <div key={id} className={cn("space-y-1.5", wide && "md:col-span-2")}>
                  {field.type === "checkbox" && !field.readOnly ? (
                    <label htmlFor={id} className="flex items-center gap-2 text-sm font-medium">
                      <input
                        id={id}
                        type="checkbox"
                        checked={value === "true"}
                        onChange={(e) => onChange(field.name, e.target.checked ? "true" : "false")}
                        aria-invalid={field.error ? true : undefined}
                        aria-describedby={errorId}
                      />
                      <span>{field.label}</span>
                    </label>
                  ) : (
                    <>
                      <label htmlFor={field.readOnly || field.type === "radio" ? undefined : id} className="block text-xs font-medium text-muted-foreground">
                        {field.label}
                        {field.required && !field.readOnly && (
                          <span aria-hidden="true" className="ml-0.5 text-danger">*</span>
                        )}
                        {field.required && !field.readOnly && <span className="sr-only"> {t("forms.required")}</span>}
                      </label>

                      {field.readOnly ? (
                        <p
                          aria-label={field.label}
                          className="min-h-9 rounded-xl bg-surface-2 px-3 py-2 text-sm text-foreground"
                        >
                          {field.type === "select"
                            ? field.options?.find((o) => o.value === value)?.label || value || "—"
                            : value || "—"}
                        </p>
                      ) : field.type === "select" ? (
                        <select
                          id={id}
                          className={cn(control, "h-10")}
                          value={value}
                          onChange={(e) => onChange(field.name, e.target.value)}
                          aria-invalid={field.error ? true : undefined}
                          aria-describedby={errorId}
                        >
                          {(field.options || []).map((o) => (
                            <option key={o.value + o.label} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      ) : field.type === "textarea" ? (
                        <textarea
                          id={id}
                          rows={4}
                          className={cn(control, "py-2")}
                          value={value}
                          maxLength={field.maxLength}
                          placeholder={field.placeholder}
                          onChange={(e) => onChange(field.name, e.target.value)}
                          aria-invalid={field.error ? true : undefined}
                          aria-describedby={errorId}
                        />
                      ) : field.type === "radio" ? (
                        <div role="radiogroup" aria-label={field.label} className="flex flex-wrap gap-4">
                          {(field.options || []).map((o) => (
                            <label key={o.value} className="flex items-center gap-2 text-sm">
                              <input
                                type="radio"
                                name={`${id}-radio`}
                                checked={value === o.value}
                                onChange={() => onChange(field.name, o.value)}
                              />
                              <span>{o.label}</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <Input
                          id={id}
                          type={field.type}
                          className={cn(control, "h-10")}
                          value={value}
                          maxLength={field.maxLength}
                          placeholder={field.placeholder}
                          onChange={(e) => onChange(field.name, e.target.value)}
                          aria-invalid={field.error ? true : undefined}
                          aria-describedby={errorId}
                        />
                      )}
                    </>
                  )}

                  {field.error && (
                    <p id={errorId} role="alert" className="text-xs text-danger">
                      {field.error}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
        {missing && !submitting && <p className="text-xs text-muted-foreground">{t("forms.fill_required")}</p>}
        <Button type="submit" disabled={blocked}>
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              <span>{t("forms.submitting")}</span>
            </>
          ) : (
            form.submitLabel
          )}
        </Button>
      </div>
    </form>
  );
}
