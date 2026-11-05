import type { JSX } from "react";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/atoms/Brand";

export interface LoginInfo {
  title: string;
  subtitle: string;
  tabs: Array<{ id: "staff" | "parent"; label: string }>;
  hasStaffLogin: boolean;
  hasParentForm: boolean;
  messages: Array<{ tone: "success" | "danger" | "warning" | "info"; text: string }>;
}

const tones: Record<string, string> = {
  success: "border-success/30 bg-success-soft text-success-strong",
  danger: "border-danger/30 bg-danger-soft text-danger-strong",
  warning: "border-warning/30 bg-warning-soft text-warning-strong",
  info: "border-primary/30 bg-primary-soft text-primary-strong",
};

/**
 * The sign-in page: brand, heading and FAP's messages in the new design. The sign-in block itself (tabs, Google
 * and FeID, the parent form) is FAP's own markup shown through the slot, so no credential ever passes through
 * this component.
 */
export function LoginPage({ info }: { info: LoginInfo }): JSX.Element {
  return (
    <div className="bg-lavender flex min-h-screen w-full items-center justify-center p-4 text-foreground sm:p-6">
      <main className="w-full max-w-[440px] space-y-6">
        <div className="flex justify-center">
          <BrandLogo className="h-16" />
        </div>

        <div className="surface-card space-y-5 p-6 shadow-float sm:p-8">
          <header className="space-y-1 text-center">
            {info.title && <h1 className="text-xl font-semibold tracking-tight">{info.title}</h1>}
            {info.subtitle && <p className="text-sm text-muted-foreground">{info.subtitle}</p>}
          </header>

          {info.messages.map((m, i) => (
            <div
              key={i}
              role={m.tone === "danger" ? "alert" : "status"}
              className={cn("rounded-2xl border px-4 py-3 text-sm", tones[m.tone])}
            >
              {m.text}
            </div>
          ))}

          <slot name="fap-login" />
        </div>
      </main>
    </div>
  );
}
