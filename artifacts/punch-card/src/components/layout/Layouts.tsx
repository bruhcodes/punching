import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Bell, Home, Settings, Sparkles, Users } from "lucide-react";
import { useGetSettings, useListNotifications } from "@workspace/api-client-react";

export function MobileLayout({ children, title }: { children: React.ReactNode; title?: string }) {
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
    <div className="flex min-h-[100dvh] w-full justify-center bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.08),transparent_30%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)]">
      <div className="relative flex w-full max-w-[430px] flex-col overflow-hidden bg-background/70 shadow-2xl backdrop-blur">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border/50 bg-background/80 px-6 backdrop-blur-xl">
          <h1 className="text-xl font-semibold tracking-tight">{title || "Punch Card"}</h1>
          {userId && (
            <Link href="/notifications" className="relative -mr-2 rounded-full p-2 transition-colors hover:bg-secondary/50">
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
  const { data: settings } = useGetSettings();
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
    <div className="min-h-[100dvh] bg-[linear-gradient(180deg,#f8fafc_0%,#e2e8f0_100%)] text-slate-900">
      <div className="mx-auto flex min-h-[100dvh] max-w-[1400px]">
        <aside className="hidden w-80 shrink-0 border-r border-slate-200/80 bg-slate-950 px-6 py-8 text-white md:flex md:flex-col">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl" style={adminHeroStyle}>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl p-3" style={{ backgroundColor: `${accentColor}26`, color: accentColor }}>
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.35em]" style={{ color: accentColor }}>Admin panel</p>
                <h1 className="text-2xl font-semibold tracking-tight">Digital Pun Master</h1>
              </div>
            </div>
            <p className="mt-5 text-sm leading-6 text-slate-300">
              Control the look of the card, manage customer accounts, and send offers without leaving the dashboard.
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
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Digital Pun Master</h1>
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
