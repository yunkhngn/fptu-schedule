import type { JSX } from "react";
import { PageHeader } from "@/components/templates/PageHeader";
import { useLang, useT, type Lang } from "@/i18n";
import type { ListOrEmptyData, ShellData } from "@/data/types";

export interface CrossClassChangeEmptyProps {
  data: ListOrEmptyData;
  shell: ShellData;
  lang?: Lang;
}

export function CrossClassChangeEmpty({
  data,
  shell: _shell,
  lang: propLang,
}: CrossClassChangeEmptyProps): JSX.Element {
  const contextLang = useLang();
  const lang = propLang || contextLang;
  const t = useT();

  return (
    <div className="space-y-6 pt-2">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          eyebrow={lang === "en" ? "Academics · Class Change" : "Học tập · Đổi lớp"}
          title={t("nav.cross_class_change")}
          description={t("nav.cross_class_change_desc")}
        />
        {data.createHref && (
          <a
            href={data.createHref}
            className="inline-flex h-9 items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-white shadow-xs transition-colors hover:bg-accent/90"
          >
            {lang === "en" ? "Create Request" : "Tạo yêu cầu"}
          </a>
        )}
      </div>

      <div className="surface-card p-12 text-center text-sm text-muted-foreground">
        <p className="text-base font-semibold text-foreground">
          {lang === "en" ? "No cross-class change requests" : "Chưa có yêu cầu đổi lớp nào"}
        </p>
        <p className="mt-1">
          {lang === "en"
            ? "You have not submitted or received any cross-class change requests for this term."
            : "Hiện tại bạn chưa gửi hoặc nhận được yêu cầu đổi lớp chéo nào trong kỳ."}
        </p>
      </div>
    </div>
  );
}
