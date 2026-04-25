import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Bell, Home, Settings, Sparkles, Users, ChevronLeft } from "lucide-react";
import { useGetSettings, useListNotifications } from "@workspace/api-client-react";

type PremiumSettings = {
  heroBadge?: string | null;
  shopName?: string | null;
  welcomeMessage?: string | null;
  accentColor?: string | null;
  backgroundImageUrl?: string | null;
};

export function MobileLayout({ children, title, showBack, backHref = "/card" }: { children: React.ReactNode; title?: string; showBack?: boolean; backHref?: string }) {
  const userId = localStorage.getItem("punchCardUserId");
  const [unreadCount, setUnreadCount] = useState(0);

  const { data: notifications } = useListNotifications(
    { userId: userId || "" },
    {
      query: {
        enabled: !!userId,
        queryKey: ["notifications", userId],
      },
    },
  );

  useEffect(() => {
    if (notifications) {
      setUnreadCount(notifications.filter((n) => !n.read).length);
    }
  }, [notifications]);

  return (
    <div className="flex min-h-[100dvh] w-full justify-center bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.12),transparent_28%),linear-gradient(180deg,#f8fafc_0%,#e0f2fe_38%,#eef2ff_100%)] px-2 py-3">
      <div className="relative flex w-full max-w-[430px] flex-col overflow-hidden rounded-[2rem] border border-white/60 bg-white/55 shadow-[0_30px_80px_-28px_rgba(15,23,42,0.35)] backdrop-blur-2xl">
        <header className="sticky top-0 z-10 flex h-18 items-center justify-between border-b border-white/50 bg-white/70 px-6 py-4 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            {showBack && (
              <Link href={backHref} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200/70 bg-white/80 shadow-sm transition-colors hover:bg-slate-100">
                <ChevronLeft className="h-5 w-5 text-slate-700" />
              </Link>
            )}
            <div>
              <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500">Loyalty pass</p>
              <h1 className="text-xl font-semibold tracking-tight" data-display="serif">{title || "Punch Card"}</h1>
            </div>
          </div>
          {userId && (
            <Link href="/notifications" className="relative -mr-2 rounded-full border border-slate-200/70 bg-white/80 p-2.5 shadow-sm transition-colors hover:bg-secondary/50">
              <Bell className="h-5 w-5 text-foreground/80" />
              {unreadCount > 0 && (
                <span className="absolute right-2 top-1.5 h-2 w-2 rounded-full bg-destructive" />
              )}
            </Link>
          )}
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 pb-24">{children}</main>
      </div>
    </div>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: rawSettings } = useGetSettings();
  const settings = rawSettings as (typeof rawSettings & PremiumSettings) | undefined;
  const accentColor = settings?.accentColor || "#06b6d4";
  const adminHeroStyle = settings?.backgroundImageUrl
    ? {
        backgroundImage: `linear-gradient(135deg, rgba(15,23,42,0.88), rgba(15,23,42,0.62)), url(${settings.backgroundImageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : undefined;

  const navItems = [
    { href: "/admin", icon: Home, label: "Dashboard" },
    { href: "/admin/users", icon: Users, label: "Users" },
    { href: "/admin/notifications", icon: Bell, label: "Notifications" },
    { href: "/admin/settings", icon: Settings, label: "Branding" },
  ];

  return (
    <div className="min-h-[100dvh] bg-[radial-gradient(circle_at_top,_rgba(6,182,212,0.12),transparent_25%),linear-gradient(180deg,#f8fafc_0%,#e2e8f0_100%)] text-slate-900">
      <div className="mx-auto flex min-h-[100dvh] max-w-[1400px]">
        <aside className="hidden w-80 shrink-0 border-r border-slate-200/80 bg-slate-950/98 px-6 py-8 text-white md:flex md:flex-col">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-cyan-950/20" style={adminHeroStyle}>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white p-1 shadow-sm">
                <img src="/logo.png" alt="Cool Spot Logo" className="h-full w-full object-contain" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.35em]" style={{ color: accentColor }}>Admin panel</p>
                <h1 className="text-2xl font-semibold tracking-tight" data-display="serif">{settings?.shopName || "Digital Pun Master"}</h1>
              </div>
            </div>
            <p className="mt-5 text-sm leading-6 text-slate-300">
              Control the look of the card, manage customer accounts, and send offers without leaving the dashboard.
            </p>
          </div>

          <div className="mt-6 rounded-[1.75rem] border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
            <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Creative direction</p>
            <p className="mt-3 font-medium text-white">{settings?.heroBadge || "Member status"}</p>
            <p className="mt-2 leading-6">
              {settings?.welcomeMessage || "Shape the customer experience with richer card styling, stronger messages, and tighter campaign design."}
            </p>
          </div>

          <nav className="mt-8 space-y-2">
            {navItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={`flex cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 transition-all ${
                      isActive
                        ? "text-slate-950 shadow-lg"
                        : "text-slate-300 hover:bg-white/8 hover:text-white"
                    }`}
                    style={isActive ? { backgroundColor: accentColor, boxShadow: `0 18px 40px -18px ${accentColor}` } : undefined}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto px-4 py-4 md:px-8 md:py-8">
          <div className="mb-6 rounded-[2rem] border border-white/70 bg-white/70 px-5 py-4 shadow-lg shadow-slate-900/5 backdrop-blur md:hidden">
            <p className="text-xs uppercase tracking-[0.35em]" style={{ color: accentColor }}>Admin panel</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight" data-display="serif">{settings?.shopName || "Digital Pun Master"}</h1>
          </div>

          <div className="mx-auto max-w-6xl pb-24 md:pb-8">{children}</div>
        </main>

        <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto flex max-w-md items-center justify-around rounded-full border border-slate-200 bg-white/95 p-2 shadow-2xl backdrop-blur md:hidden">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex min-w-16 flex-col items-center gap-1 rounded-full px-3 py-2 text-[11px] font-medium ${
                    isActive ? "bg-slate-950 text-white" : "text-slate-500"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
