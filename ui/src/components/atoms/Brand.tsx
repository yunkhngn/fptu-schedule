import { useState } from "react";
import { cn } from "@/lib/utils";
import { FROG_SVG, LOGO_SRC } from "@/assets";

export function Mascot({ className }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Linh vật FPTU"
      className={cn("inline-block shrink-0 [&>svg]:size-full", className)}
      // FROG_SVG is our own artwork bundled at build time, never text taken from the FAP page.
      dangerouslySetInnerHTML={{ __html: FROG_SVG }}
    />
  );
}

export function BrandLogo({ className, onFail }: { className?: string; onFail?: () => void }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <img
      src={LOGO_SRC}
      alt="FPT Education, FPT University"
      draggable={false}
      className={cn("block w-auto select-none", className)}
      onError={() => {
        setFailed(true);
        onFail?.();
      }}
    />
  );
}
