import type { JSX } from "react";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/templates/PageHeader";
import { useLang, useT, type Lang } from "@/i18n";
import type { CertificatesData, ShellData } from "@/data/types";

export interface CertificatesProps {
  data: CertificatesData;
  shell: ShellData;
  lang?: Lang;
}

export function Certificates({
  data,
  shell: _shell,
  lang: propLang,
}: CertificatesProps): JSX.Element {
  const contextLang = useLang();
  const lang = propLang || contextLang;
  const t = useT();

  const items = data.items || [];

  return (
    <div className="space-y-6 pt-2">
      <PageHeader
        eyebrow={lang === "en" ? "Academics · Certificates" : "Học tập · Chứng chỉ"}
        title={t("nav.certificates")}
        description={t("nav.certificates_desc")}
      />

      {items.length === 0 ? (
        <div className="surface-card p-12 text-center text-sm text-muted-foreground">
          {lang === "en" ? "No certificates submitted yet" : "Chưa có chứng chỉ nào được nộp"}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="surface-card flex flex-col justify-between p-5 transition-shadow hover:shadow-md"
            >
              <div>
                <span className="inline-block rounded-md bg-success-soft px-2.5 py-0.5 text-xs font-medium text-success-strong border border-success-strong/20">
                  {item.status || (lang === "en" ? "Valid" : "Hợp lệ")}
                </span>
                <h3 className="mt-2 text-base font-semibold text-foreground tracking-tight">
                  {item.name}
                </h3>
                {item.issuer && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {lang === "en" ? "Ref:" : "Số hiệu:"} {item.issuer}
                  </p>
                )}
                {item.date && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {lang === "en" ? "Issued date:" : "Ngày cấp:"} {item.date}
                  </p>
                )}
              </div>

              {item.href && (
                <div className="mt-5 border-t border-border pt-4">
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-strong hover:text-primary transition-colors hover:underline"
                  >
                    <Download className="w-3.5 h-3.5 shrink-0" />
                    <span>{lang === "en" ? "Download certificate" : "Tải xuống chứng chỉ"}</span>
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
