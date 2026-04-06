import { useEffect } from "react";
import { useLocation } from "wouter";
import { useListNotifications, useMarkNotificationRead, getListNotificationsQueryKey } from "@workspace/api-client-react";
import { MobileLayout } from "@/components/layout/Layouts";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

export default function Notifications() {
  const [location, setLocation] = useLocation();
  const userId = localStorage.getItem("punchCardUserId");
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) {
      setLocation("/onboarding");
    }
  }, [userId, setLocation]);

  const { data: notifications, isLoading } = useListNotifications(
    { userId: userId || "" },
    {
      query: {
        enabled: !!userId,
        queryKey: getListNotificationsQueryKey({ userId: userId || "" }),
      },
    }
  );

  const markRead = useMarkNotificationRead();

  useEffect(() => {
    if (notifications) {
      const unread = notifications.filter(n => !n.read);
      unread.forEach(n => {
        markRead.mutate({ id: n.id }, {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey({ userId: userId || "" }) });
          }
        });
      });
    }
  }, [notifications, markRead, queryClient, userId]);

  if (!userId) return null;

  return (
    <MobileLayout title="Notifications">
      <div className="space-y-4 pt-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-4 rounded-2xl bg-secondary/50 animate-pulse h-24" />
            ))}
          </div>
        ) : notifications && notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notif, index) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                key={notif.id}
                className={`p-4 rounded-2xl border ${notif.read ? 'bg-background border-border/50' : 'bg-primary/5 border-primary/20'}`}
              >
                <p className="text-foreground leading-relaxed">{notif.message}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {format(new Date(notif.createdAt), 'MMM d, h:mm a')}
                </p>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
            </div>
            <h3 className="text-lg font-medium">No notifications</h3>
            <p className="text-muted-foreground mt-1">You're all caught up!</p>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
