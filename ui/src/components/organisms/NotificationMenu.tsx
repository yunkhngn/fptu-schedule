import { useState, useEffect, useRef } from "react";
import { Bell, Loader2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/atoms/Button";
import { Popover } from "@/components/molecules/Popover";
import { useT } from "@/i18n";
import {
  openNotifications,
  readNotificationItems,
  watchNotificationList,
  markAllNotificationsRead,
  type NotificationItem,
} from "@/topbar/actions";

export interface NotificationMenuProps {
  unread?: number;
  doc?: Document;
  className?: string;
}

export function NotificationMenu({ unread = 0, doc, className }: NotificationMenuProps) {
  const t = useT();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(unread);
  const hasOpenedRef = useRef(false);

  useEffect(() => {
    setUnreadCount(unread);
  }, [unread]);

  const targetDoc = doc || (typeof document !== "undefined" ? document : null);

  const handleOpen = () => {
    if (!targetDoc) return;

    if (!hasOpenedRef.current) {
      hasOpenedRef.current = true;
      openNotifications(targetDoc);
    }

    const current = readNotificationItems(targetDoc);
    setItems(current.items);
    setLoading(current.loading);
    setFailed(current.failed);
  };

  const handleMarkAll = () => {
    if (!targetDoc) return;
    markAllNotificationsRead(targetDoc);
    setUnreadCount(0);
    setItems((prev) => prev.map((item) => ({ ...item, unread: false })));
  };

  const badgeText = unreadCount > 9 ? "9+" : unreadCount > 0 ? String(unreadCount) : null;

  return (
    <Popover
      label={t("topbar.notifications")}
      align="end"
      role="dialog"
      className={className}
      trigger={({ open, toggle, ref, props }) => (
        <Button
          ref={ref}
          variant="outline"
          size="icon"
          className="relative"
          aria-label={t("topbar.notifications")}
          {...props}
          onClick={() => {
            if (!open) {
              handleOpen();
            }
            toggle();
          }}
        >
          <Bell className="size-4" strokeWidth={1.75} />
          {badgeText && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white ring-2 ring-surface">
              {badgeText}
            </span>
          )}
        </Button>
      )}
    >
      {({ close }) => {
        // Watch for DOM mutations while popover is open
        return (
          <NotificationPanel
            doc={targetDoc}
            items={items}
            loading={loading}
            failed={failed}
            onUpdate={(res) => {
              setItems(res.items);
              setLoading(res.loading);
              setFailed(res.failed);
            }}
            onMarkAll={handleMarkAll}
            onClose={close}
            t={t}
          />
        );
      }}
    </Popover>
  );
}

interface NotificationPanelProps {
  doc: Document | null;
  items: NotificationItem[];
  loading: boolean;
  failed: boolean;
  onUpdate: (res: { items: NotificationItem[]; loading: boolean; failed: boolean }) => void;
  onMarkAll: () => void;
  onClose: () => void;
  t: (key: string) => string;
}

function NotificationPanel({
  doc,
  items,
  loading,
  failed,
  onUpdate,
  onMarkAll,
  onClose,
  t,
}: NotificationPanelProps) {
  useEffect(() => {
    if (!doc) return;
    const watcher = watchNotificationList(doc, () => {
      const res = readNotificationItems(doc);
      onUpdate(res);
    });
    return () => {
      watcher.stop();
    };
  }, [doc, onUpdate]);

  return (
    <div className="w-80 sm:w-96">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold tracking-tight">{t("topbar.notifications")}</h3>
        <button
          type="button"
          onClick={onMarkAll}
          className="text-xs font-medium text-primary-strong hover:underline cursor-pointer"
        >
          {t("topbar.mark_all_read")}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          <span>{t("topbar.loading_notifications")}</span>
        </div>
      ) : failed ? (
        <div className="p-6 text-center text-sm">
          <p className="mb-2 text-danger">{t("topbar.load_failed")}</p>
          <a
            href="/News/Notification"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary-strong hover:underline"
          >
            <span>{t("topbar.open_on_fap")}</span>
            <ExternalLink className="size-3" />
          </a>
        </div>
      ) : items.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          <p>{t("topbar.no_notifications")}</p>
        </div>
      ) : (
        <div className="scrollbar-thin max-h-80 overflow-y-auto divide-y divide-border">
          {items.map((item, i) => (
            <a
              key={i}
              href={item.href || "#"}
              onClick={() => onClose()}
              className={cn(
                "block px-4 py-3 text-xs transition-colors hover:bg-surface-2",
                item.unread && "bg-primary-soft/30"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className={cn("text-foreground", item.unread ? "font-semibold" : "font-normal")}>
                  {item.title}
                </p>
                {item.unread && (
                  <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                )}
              </div>
              {item.time && (
                <p className="mt-1 text-[11px] text-muted-foreground">{item.time}</p>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

