import { useGetSettings, useGetStats, getGetStatsQueryKey } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/Layouts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Link } from "wouter";
import { BellRing, Crown, Trophy, Users2, Zap } from "lucide-react";

export default function AdminDashboard() {
  const { data: settings } = useGetSettings();
  const accentColor = settings?.accentColor || "#06b6d4";
  const { data: stats, isLoading } = useGetStats({
    query: { queryKey: getGetStatsQueryKey() },
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-44 rounded-[2rem]" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 rounded-[2rem]" />)}
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!stats) return null;

  const cards = [
    { label: "Total users", value: stats.totalUsers, icon: Users2 },
    { label: "Punches earned", value: stats.totalPunches, icon: Zap },
    { label: "Rewards unlocked", value: stats.completedCards, icon: Trophy },
    { label: "Active today", value: stats.activeToday, icon: BellRing },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-[2.4rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.1),transparent_52%)]" />
          <p className="relative text-xs font-bold uppercase tracking-[0.35em]" style={{ color: accentColor }}>Dashboard</p>
          <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="relative max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs uppercase tracking-[0.28em] text-sky-700">
                <Crown className="h-3.5 w-3.5" />
                High-touch program overview
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl" data-display="serif">A luxury view of your loyalty program</h1>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Track customer growth, member momentum, and reward unlocks with a cleaner executive view that feels closer to a premium retail dashboard.
              </p>
            </div>
            <div className="flex gap-3 relative z-10">
              <Link href="/admin/scan">
                <div className="rounded-full bg-gradient-to-r from-sky-400 to-purple-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition hover:shadow-sky-500/40 hover:-translate-y-0.5">
                  Scan QR
                </div>
              </Link>
              <Link href="/admin/notifications">
                <div className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                  Send campaign
                </div>
              </Link>
              <Link href="/admin/settings">
                <div className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                  Edit branding
                </div>
              </Link>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <Card key={card.label} className="rounded-[2rem] border-white/80 bg-white/90 shadow-xl shadow-slate-900/5">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
                <card.icon className="h-5 w-5" style={{ color: accentColor }} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="rounded-[2rem] border-white/70 bg-white/88 shadow-xl shadow-slate-900/5">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent signups</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">The newest customers added to the loyalty app.</p>
              </div>
              <Link href="/admin/users" className="text-sm font-medium hover:underline" style={{ color: accentColor }}>
                View all
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.recentUsers.length > 0 ? (
                stats.recentUsers.map((user) => (
                  <Link key={user.id} href={`/admin/users/${user.id}`}>
                    <div className="flex cursor-pointer items-center justify-between rounded-[1.5rem] border border-slate-100 bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] px-4 py-4 transition hover:border-cyan-200 hover:bg-cyan-50/60">
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.phone}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{user.punchCount} punches</div>
                        <div className="text-sm text-muted-foreground">{format(new Date(user.createdAt), "MMM d")}</div>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="rounded-[1.5rem] border border-dashed p-8 text-center text-muted-foreground">No users yet.</div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-white/70 bg-white/88 shadow-xl shadow-slate-900/5">
            <CardHeader>
              <CardTitle>Quick notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="rounded-[1.5rem] border border-slate-100 bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] p-4">
                Live refresh is on, so admin and customer screens should update without manual reloads.
              </div>
              <div className="rounded-[1.5rem] border border-slate-100 bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] p-4">
                Notifications always save in-app first. Push alerts only reach users who enabled browser notifications.
              </div>
              <div className="rounded-[1.5rem] border border-slate-100 bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] p-4">
                Use the Branding tab to add background images, welcome text, and accent colors.
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </AdminLayout>
  );
}
