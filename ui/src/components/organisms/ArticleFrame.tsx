import React from "react";
import { ArrowLeft, FileText, ExternalLink, Calendar, Tag, Info } from "lucide-react";
import type { Lang } from "@/i18n";

export interface ArticleFrameProps {
  title: string;
  meta: Array<{ label: string; value: string }>;
  attachments: Array<{ name: string; href: string }>;
  backHref?: string;
  backLabel?: string;
  lang?: Lang;
}

export function ArticleFrame({
  title,
  meta,
  attachments,
  backHref = "/News",
  backLabel = "Về danh sách",
}: ArticleFrameProps): React.JSX.Element {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top back navigation */}
      <div>
        <a
          href={backHref}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-1 px-2.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 border border-transparent hover:border-black/5 dark:hover:border-white/5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{backLabel}</span>
        </a>
      </div>

      {/* Header card with title & metadata */}
      <div className="surface-card p-6 sm:p-8 rounded-2xl space-y-4">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground leading-snug">
          {title}
        </h1>

        {meta.length > 0 && (
          <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-black/5 dark:border-white/5">
            {meta.map((item, idx) => (
              <div
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-black/5 dark:bg-white/5 text-muted-foreground"
              >
                {item.label.toLowerCase().includes("mục") ? (
                  <Tag className="w-3.5 h-3.5 text-primary-strong" />
                ) : item.label.toLowerCase().includes("ngày") || item.label.toLowerCase().includes("gian") ? (
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                ) : (
                  <Info className="w-3.5 h-3.5 text-muted-foreground" />
                )}
                <span>
                  <strong className="font-medium text-foreground">{item.label}:</strong> {item.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {attachments.length > 0 && (
          <div className="pt-4 border-t border-black/5 dark:border-white/5 space-y-2">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Tệp đính kèm ({attachments.length})
            </span>
            <div className="flex flex-wrap gap-2">
              {attachments.map((file, fIdx) => (
                <a
                  key={fIdx}
                  href={file.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-primary-soft text-primary-strong hover:bg-primary-muted/40 transition-colors border border-primary-strong/20"
                >
                  <FileText className="w-4 h-4" />
                  <span>{file.name}</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main article content slot */}
      <div className="surface-card p-6 sm:p-8 rounded-2xl overflow-x-auto min-h-[300px]">
        <slot name="fap-article-body" />
      </div>
    </div>
  );
}
