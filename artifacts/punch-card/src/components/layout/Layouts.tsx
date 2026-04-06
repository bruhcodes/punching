import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Bell, Home, Settings, Users } from "lucide-react";
import { useListNotifications } from "@workspace/api-client-react";

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
    }
  );

  useEffect(() => {
    if (notifications) {
      setUnreadCount(notifications.filter((n: any) => !n.read).length);
    }
  }, [notifications]);

  return (
    <div className="min-h-[100dvh] w-full bg-background flex justify-center">
      <div className="w-full max-w-[430px] flex flex-col relative bg-background/50 shadow-2xl overflow-hidden">
        {/* Header */}
        <header className="h-16 px-6 flex items-center justify-between z-10 sticky top-0 bg-background/80 backdrop-blur-xl border-b border-border/50">
          <h1 className="text-xl font-semibold tracking-tight">{title || "Punch Card"}</h1>
          {userId && (
            <Link href="/notifications" className="relative p-2 -mr-2 rounded-full hover:bg-secondary/50 transition-colors">
              <Bell className="w-5 h-5 text-foreground/80" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-2 w-2 h-2 bg-destructive rounded-full" />
              )}
            </Link>
          )}
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 pb-24">
          {children}
        </main>
      </div>
    </div>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/admin", icon: Home, label: "Dashboard" },
    { href: "/admin/users", icon: Users, label: "Users" },
    { href: "/admin/notifications", icon: Bell, label: "Notifications" },
    { href: "/admin/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="min-h-[100dvh] w-full bg-muted/30 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-background border-r border-border hidden md:flex flex-col sticky top-0 h-screen">
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors cursor-pointer ${location === item.href ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
                <item.icon className="w-5 h-5" />
                {item.label}
              </div>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav for admin */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background border-t flex items-center justify-around z-50">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <div className={`p-2 rounded-full ${location === item.href ? "text-primary bg-primary/10" : "text-muted-foreground"}`}>
              <item.icon className="w-6 h-6" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
