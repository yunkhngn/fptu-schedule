import { useState, useMemo } from "react";
import { CheckCheck } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { PageHeader } from "@/components/templates/PageHeader";
import { CategoryFilter } from "@/components/molecules/CategoryFilter";
import { SearchField } from "@/components/molecules/SearchField";
import { AnnouncementList } from "@/components/organisms/AnnouncementList";
import { useReadNews } from "@/hooks/useReadNews";
import type { NewsItemData } from "@/data/types";

export interface NewsPageProps {
  news: NewsItemData[];
  categories: string[];
  chromeApi?: typeof chrome;
}

export function NewsPage({ news, categories, chromeApi }: NewsPageProps) {
  const [category, setCategory] = useState("Tất cả");
  const [query, setQuery] = useState("");
  const { isRead, markAllRead, markRead } = useReadNews(chromeApi);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return news.filter((item) => {
      const matchCategory = category === "Tất cả" || item.category === category;
      const matchQuery = q === "" || item.title.toLowerCase().includes(q);
      return matchCategory && matchQuery;
    });
  }, [news, category, query]);

  const allIds = useMemo(() => news.map((n) => n.id), [news]);
  const unreadCount = useMemo(
    () => news.filter((n) => !isRead(n.id)).length,
    [news, isRead]
  );

  return (
    <div className="space-y-6 pt-2">
      <PageHeader
        eyebrow="Học tập · Tin tức & tài liệu"
        title="Tin tức"
        description="Thông báo từ phòng Đào tạo, Khảo thí, Tài chính và các đơn vị trong trường."
        actions={
          <Button
            variant="outline"
            size="sm"
            disabled={unreadCount === 0}
            onClick={() => markAllRead(allIds)}
          >
            <CheckCheck className="size-4" />
            <span>Đánh dấu đã đọc tất cả</span>
          </Button>
        }
      />

      <section className="surface-card p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 lg:flex-1">
            <CategoryFilter
              categories={categories}
              value={category}
              onChange={setCategory}
            />
          </div>
          <div className="lg:w-72">
            <SearchField
              value={query}
              onChange={setQuery}
              placeholder="Tìm theo tiêu đề…"
            />
          </div>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">{items.length} tin</p>

        <div className="mt-2">
          <AnnouncementList
            items={items}
            isRead={isRead}
            onSelect={(item) => markRead(item.id)}
          />
        </div>
      </section>
    </div>
  );
}
