import { useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { useGetUser, getGetUserQueryKey, useGetSettings, getGetSettingsQueryKey } from "@workspace/api-client-react";
import { MobileLayout } from "@/components/layout/Layouts";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function subscribeToPush(userId: string): Promise<boolean> {
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
    if (!vapidKey) return false;

    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();

    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
    }

    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, subscription: sub.toJSON() }),
    });
    return true;
  } catch {
    return false;
  }
}

async function unsubscribeFromPush(userId: string): Promise<void> {
  try {
    if (!("serviceWorker" in navigator)) return;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) await sub.unsubscribe();
    await fetch("/api/push/subscribe", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
  } catch {
    // ignore
  }
}

export default function PunchCard() {
  const [location, setLocation] = useLocation();
  const userId = localStorage.getItem("punchCardUserId");
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    if (!userId && location !== "/onboarding" && location !== "/") {
      setLocation("/onboarding");
    }
  }, [userId, location, setLocation]);

  useEffect(() => {
    if ("Notification" in window) {
      const perm = Notification.permission;
      setNotifPermission(perm);
      if (perm === "granted") setSubscribed(true);
    }
  }, []);

  const { data: user, isLoading: isLoadingUser } = useGetUser(userId || "", {
    query: {
      enabled: !!userId,
      queryKey: getGetUserQueryKey(userId || ""),
    },
  });

  const { data: settings, isLoading: isLoadingSettings } = useGetSettings({
    query: {
      queryKey: getGetSettingsQueryKey(),
    }
  });

  const handleEnableNotifications = useCallback(async () => {
    if (!userId) return;
    setSubscribing(true);
    try {
      const permission = await Notification.requestPermission();
      setNotifPermission(permission);
      if (permission === "granted") {
        const ok = await subscribeToPush(userId);
        setSubscribed(ok);
      }
    } finally {
      setSubscribing(false);
    }
  }, [userId]);

  const handleDisableNotifications = useCallback(async () => {
    if (!userId) return;
    setSubscribing(true);
    try {
      await unsubscribeFromPush(userId);
      setSubscribed(false);
    } finally {
      setSubscribing(false);
    }
  }, [userId]);

  if (!userId) return null;

  if (isLoadingUser || isLoadingSettings) {
    return (
      <MobileLayout title="Loading...">
        <div className="space-y-6">
          <Skeleton className="h-[240px] w-full rounded-3xl" />
          <Skeleton className="h-[300px] w-full rounded-3xl" />
        </div>
      </MobileLayout>
    );
  }

  if (!user || !settings) return null;

  const totalSlots = 10;
  const stamps = Array.from({ length: totalSlots }).map((_, i) => i < user.punchCount);

  const getStampIcon = () => {
    switch (settings.stampType) {
      case "coffee": return "☕";
      case "boba": return "🧋";
      case "heart": return "❤️";
      case "star":
      default: return "⭐";
    }
  };

  const supportsNotifications =
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window;

  return (
    <MobileLayout title={settings.shopName || "Your Card"}>
      <div className="space-y-8 pt-4">
        {/* Greeting */}
        <div>
          <h2 className="text-2xl font-semibold">Hi, {user.name.split(' ')[0]}</h2>
          <p className="text-muted-foreground">{user.punchCount} out of {totalSlots} punches</p>
        </div>

        {/* The Card */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <Card className="rounded-[2rem] border-none shadow-xl overflow-hidden bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-8">
              <div className="grid grid-cols-5 gap-3 sm:gap-4">
                {stamps.map((isStamped, index) => (
                  <div
                    key={index}
                    data-testid={`stamp-slot-${index}`}
                    className="relative aspect-square rounded-full bg-background/60 shadow-sm border border-primary/10 flex items-center justify-center overflow-hidden"
                  >
                    <AnimatePresence>
                      {isStamped && (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", stiffness: 200, damping: 15 }}
                          className="absolute inset-0 flex items-center justify-center text-2xl bg-primary/5"
                        >
                          {getStampIcon()}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>

              <div className="mt-8 text-center text-sm font-medium text-primary/80">
                {user.punchCount >= totalSlots
                  ? "Free drink earned! Show to barista."
                  : `${totalSlots - user.punchCount} more to a free drink`}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* QR Code */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col items-center space-y-4 pt-4"
        >
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Scan to punch</p>
          <div className="p-4 bg-white rounded-2xl shadow-sm border">
            <QRCodeSVG value={user.id} size={180} level="M" />
          </div>
          <p className="text-xs text-muted-foreground">{user.id.substring(0, 8)}...</p>
        </motion.div>

        {/* Push Notification Toggle */}
        {supportsNotifications && notifPermission !== "denied" && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="rounded-2xl border shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {subscribed
                    ? <Bell className="w-5 h-5 text-primary" />
                    : <BellOff className="w-5 h-5 text-muted-foreground" />
                  }
                  <div>
                    <p className="text-sm font-medium">
                      {subscribed ? "Notifications on" : "Enable notifications"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {subscribed
                        ? "You will receive shop updates"
                        : "Get notified about offers and rewards"}
                    </p>
                  </div>
                </div>
                {subscribed ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDisableNotifications}
                    disabled={subscribing}
                    data-testid="button-disable-notifications"
                  >
                    Turn off
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleEnableNotifications}
                    disabled={subscribing}
                    data-testid="button-enable-notifications"
                  >
                    {subscribing ? "Enabling..." : "Enable"}
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </MobileLayout>
  );
}
