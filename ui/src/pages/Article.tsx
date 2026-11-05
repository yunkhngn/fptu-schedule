import React, { useEffect, useRef } from "react";
import type { ArticleData, ShellData } from "@/data/types";
import type { Lang } from "@/i18n";
import { ArticleFrame } from "@/components/organisms/ArticleFrame";
import { adoptArticleBody } from "@/shadow/wrapped";

export interface ArticleProps {
  data: ArticleData;
  shell?: ShellData;
  lang?: Lang;
  doc?: Document;
  host?: HTMLElement;
}

export function Article({
  data,
  lang,
  doc,
  host: explicitHost,
}: ArticleProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const documentRef = doc || (typeof document !== "undefined" ? document : null);
    if (!documentRef) return;

    let hostElement = explicitHost;
    if (!hostElement && containerRef.current) {
      const rootNode = containerRef.current.getRootNode();
      if (rootNode && (rootNode as ShadowRoot).host) {
        hostElement = (rootNode as ShadowRoot).host as HTMLElement;
      } else {
        hostElement = documentRef.getElementById("fptu-ui-host") || undefined;
      }
    }

    if (!hostElement) return;

    const handle = adoptArticleBody(documentRef, hostElement, data.bodySelector);
    return () => {
      handle?.restore();
    };
  }, [data.bodySelector, doc, explicitHost]);

  return (
    <div ref={containerRef}>
      <ArticleFrame
        title={data.title}
        meta={data.meta}
        attachments={data.attachments}
        backHref={data.backHref}
        lang={lang}
      />
    </div>
  );
}
