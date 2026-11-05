import type { JSX } from "react";
import { PageHeader } from "@/components/templates/PageHeader";

export interface WrappedPageProps {
  title: string;
}

/**
 * Fallback page component rendering a PageHeader and a slot for native FAP content.
 */
export function WrappedPage({ title }: WrappedPageProps): JSX.Element {
  return (
    <div className="space-y-6">
      <PageHeader title={title} />
      <div className="surface-card p-5 sm:p-6 overflow-x-auto">
        <slot name="fap-content" />
      </div>
    </div>
  );
}
