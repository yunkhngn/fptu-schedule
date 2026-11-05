import React from "react";

export interface SkeletonRowsProps {
  rows?: number;
}

export function SkeletonRows({ rows = 4 }: SkeletonRowsProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-xl bg-surface-2" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-3/4 animate-pulse rounded-full bg-surface-2" />
            <div className="h-2.5 w-1/3 animate-pulse rounded-full bg-surface-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

