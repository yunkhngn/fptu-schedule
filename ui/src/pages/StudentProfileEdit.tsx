import React from "react";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/templates/PageHeader";
import { Section } from "@/components/molecules/Section";
import { FormView, type FormModel } from "@/forms/FormView";
import { useOriginalForm } from "@/forms/useOriginalForm";
import { readFlashMessages } from "@/forms/flash";
import { useT } from "@/i18n";

export interface StudentProfileEditData {
  form: FormModel;
  selector: string;
}

export interface StudentProfileEditProps {
  data: StudentProfileEditData;
  shell?: unknown;
  lang?: unknown;
}

const tones: Record<string, string> = {
  success: "border-success/30 bg-success-soft text-success-strong",
  danger: "border-danger/30 bg-danger-soft text-danger-strong",
  warning: "border-warning/30 bg-warning-soft text-warning-strong",
  info: "border-primary/30 bg-primary-soft text-primary-strong",
};

export function StudentProfileEdit({ data }: StudentProfileEditProps): React.JSX.Element {
  const t = useT();
  const { form, values, setValue, submit, submitting } = useOriginalForm(document, data.selector);
  const messages = readFlashMessages(document, data.selector);
  const model = form || data.form;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader title={t("profile.edit_title")} description={t("profile.edit_description")} />
        <a
          href="/Account"
          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-surface-2"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span>{t("profile.back")}</span>
        </a>
      </div>

      {messages.map((m, i) => (
        <div key={i} role={m.tone === "danger" ? "alert" : "status"} className={cn("rounded-2xl border px-4 py-3 text-sm", tones[m.tone])}>
          {m.text}
        </div>
      ))}

      <Section title={t("profile.edit_title")}>
        <FormView form={model} values={values} onChange={setValue} onSubmit={submit} submitting={submitting} />
      </Section>
    </div>
  );
}
