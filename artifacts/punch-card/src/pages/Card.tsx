import { useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import {
  useGetUser,
  getGetUserQueryKey,
  useGetSettings,
  getGetSettingsQueryKey,
  useListNotifications,
  getListNotificationsQueryKey,
} from "@workspace/api-client-react";
import { MobileLayout } from "@/components/layout/Layouts";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff, Gift, Sparkles, TicketPercent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
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
    // Ignore unsubscribe errors so the UI can still recover.
  }
}

async function hasActivePushSubscription(): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  return !!sub;
}

export default function PunchCard() {
  const [location, setLocation] = useLocation();
  const userId = localStorage.getItem("punchCardUserId");
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (!userId && location !== "/onboarding" && location !== "/") {
      setLocation("/onboarding");
    }
  }, [userId, location, setLocation]);

  useEffect(() => {
    const syncNotificationState = async () => {
      if ("Notification" in window) {
        setNotifPermission(Notification.permission);
      }

      setIsStandalone(
        window.matchMedia("(display-mode: standalone)").matches ||
          (window.navigator as Navigator & { standalone?: boolean }).standalone === true,
      );

      try {
        setSubscribed(await hasActivePushSubscription());
      } catch {
        setSubscribed(false);
      }
    };

    void syncNotificationState();
  }, []);

  const { data: user, isLoading: isLoadingUser } = useGetUser(userId || "", {
    query: {
      enabled: !!userId,
      queryKey: getGetUserQueryKey(userId || ""),
      refetchInterval: 800,
      refetchIntervalInBackground: true,
      refetchOnMount: "always",
    },
  });

  const { data: settings, isLoading: isLoadingSettings } = useGetSettings({
    query: {
      queryKey: getGetSettingsQueryKey(),
      refetchInterval: 800,
      refetchIntervalInBackground: true,
      refetchOnMount: "always",
    },
  });

  const { data: notifications } = useListNotifications(
    { userId: userId || "" },
    {
      query: {
        enabled: !!userId,
        queryKey: getListNotificationsQueryKey({ userId: userId || "" }),
      },
    },
  );

  const handleEnableNotifications = useCallback(async () => {
    if (!userId) return;

    setSubscribing(true);
    try {
      const permission = await Notification.requestPermission();
      setNotifPermission(permission);
      if (permission !== "granted") {
        toast.error("Notification permission was not granted");
        return;
      }

      const ok = await subscribeToPush(userId);
      setSubscribed(ok);

      if (ok) {
        toast.success("Push notifications are on");
      } else {
        toast.error("Push setup failed. Check VAPID keys and service worker setup.");
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
      toast.success("Push notifications are off");
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
  const punchesLeft = Math.max(totalSlots - user.punchCount, 0);
  const dealProgress = Math.min((user.punchCount / totalSlots) * 100, 100);
  const unreadNotifications = notifications?.filter((item) => !item.read).length ?? 0;
  const latestMessages = notifications?.slice(0, 2) ?? [];
  const featuredDeal =
    user.punchCount >= totalSlots
      ? "Reward unlocked: show this screen and claim your free drink."
      : punchesLeft <= 2
        ? `Almost there: only ${punchesLeft} more punch${punchesLeft === 1 ? "" : "es"} for your reward.`
        : "Today's deal: ask in-store about double-punch hours and surprise offers.";
  const memberTier =
    user.punchCount >= 8 ? "Gold member" : user.punchCount >= 4 ? "Silver member" : "Starter member";

  const getStampIcon = () => {
    switch (settings.stampType) {
      case "coffee":
        return "☕";
      case "boba":
        return "🧋";
      case "heart":
        return "❤️";
      case "star":
      default:
        return "⭐";
    }
  };

  const supportsNotifications =
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window;
  const accentColor = settings.accentColor || "#111827";
  const accentSoft = `${accentColor}22`;
  const accentBorder = `${accentColor}55`;
  const backgroundSurface =
    settings.backgroundStyle === "sunset"
      ? "linear-gradient(180deg, rgba(255,237,213,0.95) 0%, rgba(255,228,230,0.95) 100%)"
      : settings.backgroundStyle === "ocean"
        ? "linear-gradient(180deg, rgba(236,254,255,0.95) 0%, rgba(224,242,254,0.98) 100%)"
        : settings.backgroundStyle === "midnight"
          ? "linear-gradient(180deg, rgba(15,23,42,0.98) 0%, rgba(30,41,59,0.98) 100%)"
          : "rgba(255,255,255,0.72)";
  const backgroundTextColor = settings.backgroundStyle === "midnight" ? "#f8fafc" : undefined;
  const heroStyle = settings.backgroundImageUrl
    ? {
        backgroundImage: `linear-gradient(135deg, rgba(15,23,42,0.62), rgba(15,23,42,0.2)), url(${settings.backgroundImageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : settings.backgroundStyle === "sunset"
      ? { backgroundImage: "linear-gradient(135deg, #fdba74 0%, #fb7185 100%)" }
      : settings.backgroundStyle === "ocean"
        ? { backgroundImage: "linear-gradient(135deg, #67e8f9 0%, #0ea5e9 100%)" }
        : settings.backgroundStyle === "midnight"
          ? { backgroundImage: "linear-gradient(135deg, #0f172a 0%, #334155 100%)" }
          : undefined;

  return (
    <MobileLayout title={settings.shopName || "Your Card"}>
      <div className="space-y-8 rounded-[2.25rem] p-3 pt-4" style={{ background: backgroundSurface, color: backgroundTextColor }}>
        <div className="space-y-3 rounded-[2rem] border border-primary/10 bg-white/70 p-5 shadow-sm" style={{ ...heroStyle, color: backgroundTextColor }}>
          <div>
            <h2 className="text-2xl font-semibold">Hi, {user.name.split(" ")[0]}</h2>
            <p className="text-muted-foreground">{user.punchCount} out of {totalSlots} punches</p>
            {settings.welcomeMessage ? (
              <p className="mt-2 text-sm text-muted-foreground">{settings.welcomeMessage}</p>
            ) : null}
          </div>
          <div className="flex items-center justify-between rounded-3xl border border-primary/10 bg-primary/5 px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em]" style={{ color: accentColor }}>Member status</p>
              <p className="text-sm font-semibold">{memberTier}</p>
            </div>
            <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold shadow-sm" style={{ color: accentColor }}>
              {unreadNotifications} new alerts
            </div>
          </div>
        </div>

        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <Card
            className="overflow-hidden rounded-[2rem] border-none shadow-xl"
            style={{
              background: settings.backgroundImageUrl
                ? `linear-gradient(135deg, rgba(15,23,42,0.78) 0%, rgba(15,23,42,0.35) 100%), linear-gradient(135deg, ${accentColor}cc 0%, ${accentColor}55 100%)`
                : `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}bb 58%, ${accentColor}77 100%)`,
            }}
          >
            <CardContent className="p-8">
              <div className="grid grid-cols-5 gap-3 sm:gap-4">
                {stamps.map((isStamped, index) => (
                  <div
                    key={index}
                    data-testid={`stamp-slot-${index}`}
                    className="relative flex aspect-square items-center justify-center overflow-hidden rounded-full shadow-sm"
                    style={{
                      background: isStamped ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.1)",
                      border: `1px solid ${isStamped ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.16)"}`,
                    }}
                  >
                    <AnimatePresence>
                      {isStamped && (
                        <motion.div
                          initial={{ scale: 0.92, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1, rotate: 0 }}
                          transition={{ duration: 0.08, ease: "easeOut" }}
                          className="absolute inset-0 flex items-center justify-center text-2xl"
                          style={{ backgroundColor: "rgba(255,255,255,0.22)" }}
                        >
                          {getStampIcon()}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>

              <div className="mt-8 text-center text-sm font-medium text-white">
                {user.punchCount >= totalSlots
                  ? "Free drink earned! Show to barista."
                  : `${totalSlots - user.punchCount} more to a free drink`}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col items-center space-y-4 pt-4"
        >
          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Scan to punch</p>
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <QRCodeSVG value={user.id} size={180} level="M" />
          </div>
          <p className="text-xs text-muted-foreground">{user.id.substring(0, 8)}...</p>
          <div className="w-full rounded-[1.75rem] border border-amber-300/40 bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-700">Deal bar</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{featuredDeal}</p>
              </div>
              <div className="rounded-2xl bg-white/80 px-3 py-2 text-right shadow-sm">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Reward pace</p>
                <p className="text-lg font-bold text-slate-900">{Math.round(dealProgress)}%</p>
              </div>
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/80">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.max(dealProgress, 8)}%`,
                  background: `linear-gradient(90deg, ${accentColor} 0%, ${accentColor}cc 100%)`,
                }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
              <span>{user.punchCount} punches collected</span>
              <span>{punchesLeft === 0 ? "Ready to redeem" : `${punchesLeft} left to go`}</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="grid gap-4 sm:grid-cols-3"
        >
          <Card className="rounded-3xl border-none bg-slate-900 text-white shadow-lg">
            <CardContent className="flex items-center gap-3 p-5">
              <Gift className="h-5 w-5 text-amber-300" />
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-300">Next reward</p>
                <p className="text-sm font-semibold">{punchesLeft === 0 ? "Free drink ready" : `${punchesLeft} punches left`}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-3xl border border-primary/10 bg-white/80 shadow-sm">
            <CardContent className="flex items-center gap-3 p-5">
              <Sparkles className="h-5 w-5" style={{ color: accentColor }} />
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Surprise perk</p>
                <p className="text-sm font-semibold">Scan in store for flash promos</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-3xl border border-primary/10 bg-white/80 shadow-sm">
            <CardContent className="flex items-center gap-3 p-5">
              <TicketPercent className="h-5 w-5 text-rose-500" />
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Install bonus</p>
                <p className="text-sm font-semibold">{isStandalone ? "Home screen ready" : "Add to home screen for alerts"}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {supportsNotifications && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="rounded-2xl border shadow-sm">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {subscribed ? (
                      <Bell className="h-5 w-5" style={{ color: accentColor }} />
                    ) : (
                      <BellOff className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        {subscribed ? "Notifications on" : "Enable notifications"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {subscribed
                          ? "You can receive reward alerts, even while the app is closed."
                          : "Turn on push to get rewards, flash deals, and admin messages."}
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
                      disabled={subscribing || notifPermission === "denied"}
                      data-testid="button-enable-notifications"
                    >
                      {subscribing ? "Enabling..." : "Enable"}
                    </Button>
                  )}
                </div>
                <div className="rounded-2xl bg-muted/50 px-4 py-3 text-xs text-muted-foreground">
                  {notifPermission === "denied"
                    ? "Notifications are blocked in this browser. Re-enable them in device settings."
                    : isStandalone
                      ? "Installed app detected. Background web push can arrive when the phone is locked if the browser and OS allow it."
                      : "For the best background notification support, install this app to your home screen first."}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="rounded-3xl border shadow-sm">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Latest shop messages</p>
                  <p className="text-xs text-muted-foreground">Your newest updates stay here.</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setLocation("/notifications")}>
                  View all
                </Button>
              </div>
              {latestMessages.length > 0 ? (
                <div className="space-y-3">
                  {latestMessages.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-border/60 bg-background px-4 py-3">
                      <p className="text-sm font-medium text-foreground">{item.message}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.read ? "Read" : "Unread"}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                  No messages yet.
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </MobileLayout>
  );
}
