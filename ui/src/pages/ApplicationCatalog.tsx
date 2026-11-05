import type { JSX } from "react";
import { PageHeader } from "@/components/templates/PageHeader";
import { useLang, useT, type Lang } from "@/i18n";
import type { ApplicationCatalogData, ShellData } from "@/data/types";

export interface ApplicationCatalogProps {
  data: ApplicationCatalogData;
  shell: ShellData;
  lang?: Lang;
}

export function ApplicationCatalog({
  data,
  shell: _shell,
  lang: propLang,
}: ApplicationCatalogProps): JSX.Element {
  const contextLang = useLang();
  const lang = propLang || contextLang;
  const t = useT();

  const items = data.items || [];

  return (
    <div className="space-y-6 pt-2">
      <PageHeader
        eyebrow={lang === "en" ? "Student Affairs · Applications" : "Công tác sinh viên · Đơn từ"}
        title={t("nav.submit_application")}
        description={
          lang === "en"
            ? "Select an application form to submit your request to academic services."
            : "Chọn loại đơn phù hợp để gửi yêu cầu tới các phòng ban chức năng."
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="surface-card flex flex-col justify-between p-5 transition-shadow hover:shadow-md"
          >
            <div>
              <h3 className="text-base font-semibold text-foreground tracking-tight">
                {item.title}
              </h3>
              {item.description && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.description}
                </p>
              )}
            </div>

            <div className="mt-5 border-t border-border pt-4">
              <a
                href={item.href}
                className="inline-flex h-8 items-center justify-center rounded-md bg-accent px-3 text-xs font-medium text-white shadow-xs transition-colors hover:bg-accent/90"
              >
                {lang === "en" ? "Submit Application" : "Làm đơn này"}
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
