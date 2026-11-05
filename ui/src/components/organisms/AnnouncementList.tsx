import { Newspaper } from "lucide-react";
import { NewsItem } from "@/components/molecules/NewsItem";
import { EmptyState } from "@/components/molecules/EmptyState";
import type { NewsItemData } from "@/data/types";
import { cn } from "@/lib/utils";

export interface AnnouncementListProps {
  items: NewsItemData[];
  readIds?: string[];
  onToggleRead?: (id: string) => void;
  className?: string;
}

export function AnnouncementList({
  items,
  readIds = [],
  onToggleRead,
  className,
}: AnnouncementListProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={Newspaper}
        title="Chưa có tin tức"
        description="Hiện chưa có tin nào trong mục này. Hãy quay lại sau nhé."
      />
    );
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      {items.map((item) => (
        <NewsItem
          key={item.id}
          item={item}
          read={readIds.includes(item.id)}
          onToggle={() => onToggleRead?.(item.id)}
        />
      ))}
    </div>
  );
}
