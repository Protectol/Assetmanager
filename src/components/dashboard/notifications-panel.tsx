import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Clock, AlertCircle, CheckCircle, Shield } from "lucide-react";
import type { Notification } from "@/types";
import { EmptyState } from "@/components/ui/loading";

const iconMap = {
  pending_response: Clock,
  expired_link: AlertCircle,
  completed_form: CheckCircle,
  warranty_expiry: Shield,
};

interface NotificationsPanelProps {
  notifications: Notification[];
}

export function NotificationsPanel({ notifications }: NotificationsPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Notifications
        </CardTitle>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <EmptyState title="All caught up" description="No new notifications" />
        ) : (
          <div className="space-y-3">
            {notifications.slice(0, 5).map((notification) => {
              const Icon = iconMap[notification.type];
              return (
                <div key={notification.id} className="flex gap-3 rounded-lg border p-3">
                  <div className="mt-0.5">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{notification.title}</p>
                    <p className="text-xs text-muted-foreground">{notification.message}</p>
                    {notification.link && (
                      <Link href={notification.link} className="text-xs text-primary hover:underline">
                        View details
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
