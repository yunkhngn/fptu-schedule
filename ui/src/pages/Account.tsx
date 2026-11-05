import React from "react";
import { Edit2 } from "lucide-react";
import type { AccountData, ShellData } from "@/data/types";
import type { Lang } from "@/i18n";
import { PageHeader } from "@/components/templates/PageHeader";
import { Section } from "@/components/molecules/Section";
import { KeyValueList } from "@/components/molecules/KeyValueList";

export interface AccountProps {
  data: AccountData;
  shell?: ShellData;
  lang?: Lang;
}

export function Account({ data }: AccountProps): React.JSX.Element {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader title="Thông tin cá nhân" />

        {data.editHref && (
          <div className="shrink-0">
            <a
              href={data.editHref}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-accent text-white hover:bg-accent/90 transition-colors shadow-sm"
            >
              <Edit2 className="w-4 h-4" />
              <span>Cập nhật hồ sơ</span>
            </a>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data.sections.map((section, idx) => (
          <Section key={idx} title={section.title} className="h-full">
            <KeyValueList items={section.items} />
          </Section>
        ))}
      </div>
    </div>
  );
}
