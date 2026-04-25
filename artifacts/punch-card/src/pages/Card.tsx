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
import { Skeleton } from "@/components/ui/skeleton";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff, Crown, Gift } from "lucide-react";
import { toast } from "sonner";
import {
  hasActivePushSubscription,
  isIosDevice,
  isStandaloneDisplay,
  sendTestPush,
  subscribeToPush,
  supportsWebPush,
  unsubscribeFromPush,
} from "@/lib/push";

type PremiumSettings = {
  heroBadge?: string | null;
  rewardLabel?: string | null;
  dealLabel?: string | null;
  adBannerText?: string | null;
  cardStyle?: string | null;
  accentColor?: string | null;
  backgroundStyle?: string | null;
  backgroundImageUrl?: string | null;
  shopName?: string | null;
  stampType?: string | null;
  welcomeMessage?: string | null;
};

export default function PunchCard() {
  const [location, setLocation] = useLocation();
  const userId = localStorage.getItem("punchCardUserId");
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [sendingTestPush, setSendingTestPush] = useState(false);

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
      setIsStandalone(isStandaloneDisplay());
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

  const { data: rawSettings, isLoading: isLoadingSettings } = useGetSettings({
    query: {
      queryKey: getGetSettingsQueryKey(),
      refetchInterval: 800,
      refetchIntervalInBackground: true,
      refetchOnMount: "always",
    },
  });
  const settings = rawSettings as (typeof rawSettings & PremiumSettings) | undefined;

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
      const result = await subscribeToPush(userId);
      setSubscribed(result.ok);
      if (result.ok) {
        toast.success("Push notifications are on");
      } else {
        toast.error(result.error || "Push setup failed.");
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

  const handleSendTestPush = useCallback(async () => {
    if (!userId) return;
    setSendingTestPush(true);
    try {
      const result = await sendTestPush(userId);
      if (result.ok) {
        toast.success("Test push sent!");
      } else {
        toast.error(result.error || "Could not send test push.");
      }
    } finally {
      setSendingTestPush(false);
    }
  }, [userId]);

  useEffect(() => {
    // Automatically prompt for push notifications on load if not already requested
    if (userId && "Notification" in window && Notification.permission === "default" && !subscribing) {
      handleEnableNotifications();
    }
  }, [userId, subscribing, handleEnableNotifications]);

  if (!userId) return null;

  if (isLoadingUser || isLoadingSettings) {
    return (
      <div
        style={{
          minHeight: "100dvh",
          background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
          display: "flex",
          flexDirection: "column",
          padding: "24px 20px",
          gap: 16,
        }}
      >
        <Skeleton className="h-16 w-full rounded-2xl" style={{ background: "rgba(255,255,255,0.06)" }} />
        <Skeleton className="h-48 w-full rounded-3xl" style={{ background: "rgba(255,255,255,0.06)" }} />
        <Skeleton className="h-40 w-full rounded-3xl" style={{ background: "rgba(255,255,255,0.06)" }} />
        <Skeleton className="h-52 w-full rounded-3xl" style={{ background: "rgba(255,255,255,0.06)" }} />
      </div>
    );
  }

  if (!user || !settings) return null;

  const totalSlots = 10;
  const stamps = Array.from({ length: totalSlots }).map((_, i) => i < user.punchCount);
  const punchesLeft = Math.max(totalSlots - user.punchCount, 0);
  const dealProgress = Math.min((user.punchCount / totalSlots) * 100, 100);
  const unreadNotifications = notifications?.filter((item) => !item.read).length ?? 0;
  const rewardLabel = settings.rewardLabel || "Free drink";
  const dealLabel = settings.dealLabel || "Today's Offer";
  const adBannerText = settings.welcomeMessage ||
    (user.punchCount >= totalSlots
      ? "🎉 Reward unlocked! Show this screen to the barista."
      : punchesLeft <= 2
        ? `Almost there — only ${punchesLeft} more punch${punchesLeft === 1 ? "" : "es"} for your reward!`
        : "Ask about double-punch hours and surprise offers in store.");

  const memberTier =
    user.punchCount >= 8 ? "Gold member" : user.punchCount >= 4 ? "Silver member" : "Starter member";

  const getStampIcon = () => {
    switch (settings.stampType) {
      case "coffee": return "☕";
      case "boba": return "🧋";
      case "heart": return "❤️";
      case "icecream": return "🍦";
      case "bean": return "🫘";
      case "sparkle": return "✨";
      case "logo": return <img src="/logo.png" style={{ width: "70%", height: "70%", objectFit: "contain" }} alt="logo" />;
      case "star": default: return "⭐";
    }
  };

  const accentColor = settings.accentColor || "#06b6d4";
  const supportsNotifications = supportsWebPush();
  const needsInstallForIosPush = isIosDevice() && !isStandalone;

  // Background gradient from settings
  const pageBg = "#f8fafc";

  // Card gradient
  const cardBg = "linear-gradient(135deg, #38bdf8 0%, #a855f7 100%)";

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: settings.backgroundImageUrl
          ? `linear-gradient(180deg, rgba(248,250,252,0.92) 0%, rgba(248,250,252,0.85) 100%), url(${settings.backgroundImageUrl}) center/cover`
          : pageBg,
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
      }}
    >
      {/* Top Header */}
      <header
        style={{
          padding: "16px 20px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(0,0,0,0.05)",
          background: "rgba(255,255,255,0.7)",
          backdropFilter: "blur(20px)",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div>
          <p style={{ fontSize: 10, letterSpacing: "0.35em", textTransform: "uppercase", color: accentColor, margin: 0 }}>
            Loyalty Pass
          </p>
          <h1
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#0f172a",
              margin: 0,
              letterSpacing: "-0.02em",
              fontFamily: "var(--app-font-serif, serif)",
            }}
          >
            {settings.shopName || "Cool Spot"}
          </h1>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {unreadNotifications > 0 && (
            <div
              style={{
                padding: "4px 10px",
                borderRadius: 20,
                background: `${accentColor}22`,
                border: `1px solid ${accentColor}44`,
                fontSize: 12,
                fontWeight: 600,
                color: accentColor,
              }}
            >
              {unreadNotifications} new
            </div>
          )}
          <button
            onClick={() => setLocation("/notifications")}
            style={{
              background: "rgba(0,0,0,0.04)",
              border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: 12,
              padding: "8px",
              cursor: "pointer",
              color: "#64748b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <Bell style={{ width: 18, height: 18 }} />
            {unreadNotifications > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: 6,
                  right: 6,
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#ef4444",
                  border: "2px solid #ffffff",
                }}
              />
            )}
          </button>
        </div>
      </header>

      <div style={{ flex: 1, padding: "20px", display: "flex", flexDirection: "column", gap: 0 }}>

        {/* Hero greeting */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 20 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                background: `linear-gradient(135deg, ${accentColor}15, ${accentColor}05)`,
                border: `1px solid ${accentColor}22`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
              }}
            >
              {getStampIcon()}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>
                Hi, {user.name.split(" ")[0]}!
              </p>
              <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
                {user.punchCount} of {totalSlots} punches · <span style={{ color: accentColor }}>{memberTier}</span>
              </p>
            </div>
            <div style={{ marginLeft: "auto" }}>
              <div
                style={{
                  padding: "5px 12px",
                  borderRadius: 20,
                  background: `${accentColor}10`,
                  border: `1px solid ${accentColor}22`,
                  fontSize: 11,
                  fontWeight: 600,
                  color: accentColor,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                {punchesLeft === 0 ? "🎉 Reward!" : `${punchesLeft} left`}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Punch Card + QR — unified section */}
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 280, damping: 24, delay: 0.05 }}
          style={{
            borderRadius: 28,
            overflow: "hidden",
            boxShadow: `0 32px 80px -24px rgba(168,85,247,0.3), 0 8px 32px -8px rgba(0,0,0,0.1)`,
            marginBottom: 16,
          }}
        >
          {/* Card top — punch stamps */}
          <div
            style={{
              background: cardBg,
              padding: "24px 24px 20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <div>
                <p style={{ margin: 0, fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)" }}>
                  Signature pass
                </p>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: 20,
                    fontWeight: 700,
                    color: "#ffffff",
                    fontFamily: "var(--app-font-serif, serif)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {rewardLabel}
                </p>
              </div>
              <Crown style={{ width: 22, height: 22, color: "rgba(255,255,255,0.4)" }} />
            </div>

            {/* Stamp grid or Reward Unlocked */}
            {punchesLeft === 0 ? (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                style={{ textAlign: "center", padding: "30px 10px", background: "rgba(255,255,255,0.1)", borderRadius: 24, border: "1px solid rgba(255,255,255,0.2)" }}
              >
                <div style={{ fontSize: 56, marginBottom: 12 }}>🎉</div>
                <h2 style={{ color: "white", fontSize: 24, fontWeight: 800, margin: 0, fontFamily: "var(--app-font-serif, serif)" }}>
                  Collect your free drink!
                </h2>
                <p style={{ color: "rgba(255,255,255,0.8)", marginTop: 8, fontSize: 13, lineHeight: 1.4 }}>
                  Show this screen and scan your QR code below to claim your reward.
                </p>
              </motion.div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
                {stamps.map((isStamped, index) => (
                  <div
                    key={index}
                    data-testid={`stamp-slot-${index}`}
                    style={{
                      aspectRatio: "1",
                      borderRadius: "50%",
                      background: isStamped ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.07)",
                      border: `1px solid ${isStamped ? "rgba(255,255,255,0.32)" : "rgba(255,255,255,0.12)"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                      transition: "all 0.3s",
                      boxShadow: isStamped ? `0 4px 16px -4px ${accentColor}80` : "none",
                    }}
                  >
                    <AnimatePresence>
                      {isStamped && (
                        <motion.span
                          initial={{ scale: 0, rotate: -20 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0 }}
                          transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        >
                          {getStampIcon()}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            )}

            {/* Progress bar */}
            <div style={{ marginTop: 18 }}>
              <div
                style={{
                  height: 4,
                  borderRadius: 4,
                  background: "rgba(255,255,255,0.2)",
                  overflow: "hidden",
                }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(dealProgress, 4)}%` }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                  style={{
                    height: "100%",
                    borderRadius: 4,
                    background: "linear-gradient(90deg, rgba(255,255,255,0.6), rgba(255,255,255,0.9))",
                  }}
                />
              </div>
              <p style={{ margin: "8px 0 0", fontSize: 12, color: "rgba(255,255,255,0.5)", textAlign: "center" }}>
                {punchesLeft === 0
                  ? `${rewardLabel} unlocked — show to the barista ✓`
                  : `${punchesLeft} more to unlock ${rewardLabel.toLowerCase()}`}
              </p>
            </div>
          </div>

          {/* Divider with scan label */}
          <div
            style={{
              background: "#ffffff",
              borderTop: "1px solid #f1f5f9",
              borderBottom: "1px solid #f1f5f9",
              padding: "10px 24px",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div style={{ flex: 1, height: 1, background: "#f1f5f9" }} />
            <p
              style={{
                margin: 0,
                fontSize: 10,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: accentColor,
                fontWeight: 600,
              }}
            >
              Scan to Punch
            </p>
            <div style={{ flex: 1, height: 1, background: "#f1f5f9" }} />
          </div>

          {/* QR Code section */}
          <div
            style={{
              background: "#ffffff",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                padding: 16,
                borderRadius: 20,
                background: "#ffffff",
                boxShadow: `0 8px 40px -8px ${accentColor}44`,
              }}
            >
              <QRCodeSVG value={user.id} size={160} level="M" />
            </div>
            <p style={{ margin: 0, fontSize: 11, color: "#475569", letterSpacing: "0.05em" }}>
              {user.id.substring(0, 8).toUpperCase()}···
            </p>
          </div>
        </motion.div>

        {/* Ad Banner — editable from admin */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          style={{
            borderRadius: 20,
            overflow: "hidden",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            boxShadow: "0 12px 32px -12px rgba(0,0,0,0.05)",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div style={{ flex: 1 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 10,
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  color: accentColor,
                  fontWeight: 700,
                  marginBottom: 6,
                }}
              >
                {dealLabel}
              </p>
              <p style={{ margin: 0, fontSize: 14, color: "#334155", fontWeight: 500, lineHeight: 1.5 }}>
                {adBannerText}
              </p>
            </div>
            <div
              style={{
                minWidth: 56,
                textAlign: "center",
                padding: "8px",
                borderRadius: 14,
                background: `${accentColor}15`,
                border: `1px solid ${accentColor}30`,
              }}
            >
              <p style={{ margin: 0, fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em" }}>Progress</p>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: accentColor }}>
                {Math.round(dealProgress)}%
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ height: 3, background: "#f1f5f9" }}>
            <div
              style={{
                height: "100%",
                width: `${Math.max(dealProgress, 3)}%`,
                background: `linear-gradient(90deg, ${accentColor}, ${accentColor}aa)`,
                transition: "width 0.8s ease",
              }}
            />
          </div>
        </motion.div>



        {/* Sign out */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{ textAlign: "center", paddingBottom: 32 }}
        >
          <button
            onClick={() => {
              localStorage.removeItem("punchCardUserId");
              setLocation("/onboarding");
            }}
            style={{
              background: "none",
              border: "none",
              color: "#334155",
              fontSize: 13,
              cursor: "pointer",
              padding: "8px 16px",
            }}
          >
            Sign out
          </button>
        </motion.div>
      </div>
    </div>
  );
}
