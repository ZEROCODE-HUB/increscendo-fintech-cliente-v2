import React from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Btn, Card, Empty, PageHeader, Skel } from "../components/ui";
import { CK, useNotifications, useRefresh } from "../hooks";
import { markNotificationsRead } from "../lib/api";
import { dateTime } from "../lib/format";

export default function Notifications() {
  const { data, isLoading } = useNotifications();
  const { userId } = useAuth();
  const refresh = useRefresh();
  const navigate = useNavigate();
  const unread = (data ?? []).filter((n) => !n.read).length;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Notificaciones"
        back
        action={
          unread > 0 && (
            <Btn
              size="sm"
              variant="soft"
              icon={<CheckCheck size={15} />}
              onClick={async () => {
                if (!userId) return;
                await markNotificationsRead(userId);
                await refresh(CK.notifications);
              }}
            >
              Marcar leídas
            </Btn>
          )
        }
      />
      {isLoading ? (
        <Skel className="h-60 rounded-2xl" />
      ) : (data ?? []).length ? (
        <Card className="divide-y divide-slate-100 overflow-hidden">
          {(data ?? []).map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={async () => {
                if (!n.read && userId) {
                  await markNotificationsRead(userId, [n.id]);
                  void refresh(CK.notifications);
                }
                if (n.url) navigate(n.url.replace(/^https?:\/\/[^/]+/, ""));
              }}
              className={cn("flex w-full gap-3 px-4 py-4 text-left transition-colors hover:bg-slate-50", !n.read && "bg-brand-soft/40")}
            >
              <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-brand")} />
              <div className="min-w-0 flex-1">
                <p className="text-[14.5px] font-bold text-slate-900">{n.title}</p>
                <p className="mt-0.5 text-[13.5px] leading-relaxed text-slate-600">{n.message}</p>
                <p className="mt-1 text-xs text-slate-400">{dateTime(n.createdAt)}</p>
              </div>
            </button>
          ))}
        </Card>
      ) : (
        <Card>
          <Empty icon={<Bell />} title="Todo al día" text="Aquí te avisaremos de pagos, verificaciones y novedades." />
        </Card>
      )}
    </div>
  );
}
