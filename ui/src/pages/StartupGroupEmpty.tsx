import type { JSX } from "react";
import { PageHeader } from "@/components/templates/PageHeader";
import { useLang, useT, type Lang } from "@/i18n";
import type { ListOrEmptyData, ShellData } from "@/data/types";

export interface StartupGroupEmptyProps {
  data: ListOrEmptyData;
  shell: ShellData;
  lang?: Lang;
}

export function StartupGroupEmpty({
  data,
  shell: _shell,
  lang: propLang,
}: StartupGroupEmptyProps): JSX.Element {
  const contextLang = useLang();
  const lang = propLang || contextLang;
  const t = useT();

  return (
    <div className="space-y-6 pt-2">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          eyebrow={lang === "en" ? "Entrepreneurship · Applications" : "Khởi nghiệp · Đơn từ"}
          title={t("nav.startup_application")}
          description={t("nav.startup_application_desc")}
        />
        {data.createHref && (
          <a
            href={data.createHref}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            {lang === "en" ? "Submit New Application" : "Gửi đơn mới"}
          </a>
        )}
      </div>

      <div className="surface-card p-12 text-center text-sm text-muted-foreground">
        <p className="text-base font-semibold text-foreground">
          {lang === "en" ? "No startup group applications found" : "Chưa có đơn khởi nghiệp nào"}
        </p>
        <p className="mt-1">
          {lang === "en"
            ? "You currently have no registered startup groups or pending requests."
            : "Hiện tại bạn chưa đăng ký nhóm khởi nghiệp nào."}
        </p>
      </div>
    </div>
  );
}
