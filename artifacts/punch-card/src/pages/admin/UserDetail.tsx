import { useRoute } from "wouter";
import { useGetUser, getGetUserQueryKey, useAddPunch, useRemovePunch, useResetPunches, useGetSettings, getGetSettingsQueryKey, getGetStatsQueryKey, getListUsersQueryKey, useListNotifications } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/Layouts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { ArrowLeft, Crown, Minus, Plus, RotateCcw, Clock } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function AdminUserDetail() {
  const [, params] = useRoute("/admin/users/:id");
  const userId = params?.id || "";
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useGetUser(userId, {
    query: {
      enabled: !!userId,
      queryKey: getGetUserQueryKey(userId)
    }
  });

  const { data: notifications } = useListNotifications(
    { userId },
    {
      query: {
        enabled: !!userId,
        queryKey: ["notifications", userId]
      }
    }
  );

  const { data: rawSettings } = useGetSettings({
    query: { queryKey: getGetSettingsQueryKey() }
  });
  const settings = rawSettings as (typeof rawSettings & { heroBadge?: string | null; accentColor?: string | null }) | undefined;

  const addPunch = useAddPunch();
  const removePunch = useRemovePunch();
  const resetPunches = useResetPunches();

  const refreshUserData = (data: unknown) => {
    queryClient.setQueryData(getGetUserQueryKey(userId), data);
    queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
  };

  const handleAddPunch = () => {
    addPunch.mutate({ id: userId }, {
      onSuccess: (data) => {
        refreshUserData(data);
        toast.success("Punch added successfully");
      },
      onError: () => toast.error("Failed to add punch")
    });
  };

  const handleRemovePunch = () => {
    removePunch.mutate({ id: userId }, {
      onSuccess: (data) => {
        refreshUserData(data);
        toast.success("Punch removed");
      },
      onError: () => toast.error("Failed to remove punch")
    });
  };

  const handleResetPunches = () => {
    if (!confirm("Are you sure you want to reset this user's punches to zero?")) return;
    
    resetPunches.mutate({ id: userId }, {
      onSuccess: (data) => {
        refreshUserData(data);
        toast.success("Punches reset to 0");
      },
      onError: () => toast.error("Failed to reset punches")
    });
  };

  const handleUpdateTotalPunches = async (newTotal: string) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalPunches: Number(newTotal) })
      });
      if (!res.ok) throw new Error("Failed to update");
      const data = await res.json();
      refreshUserData(data);
      toast.success(`Reward threshold updated to ${newTotal}`);
    } catch {
      toast.error("Failed to update reward threshold");
    }
  };

  if (isLoading || !user) {
    return (
      <AdminLayout>
        <div className="p-8 text-center text-muted-foreground">Loading user...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/users">
            <Button variant="outline" size="icon" className="rounded-full">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight" data-display="serif">{user.name}</h1>
            <p className="text-muted-foreground">{user.phone}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="overflow-hidden rounded-[2rem] border-white/80 bg-white/92 shadow-xl shadow-slate-900/5 md:col-span-2">
            <CardHeader>
              <CardTitle>Punch Card</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-[2rem] bg-[linear-gradient(145deg,#020617_0%,#0f172a_50%,#164e63_100%)] px-6 py-8 text-white">
                <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-slate-200">
                  <Crown className="h-3.5 w-3.5" style={{ color: settings?.accentColor || "#67e8f9" }} />
                  {settings?.heroBadge || "Member status"}
                </div>
                <div className="text-6xl font-bold text-white mb-2">
                  {user.punchCount} <span className="text-3xl text-muted-foreground">/ {user.totalPunches}</span>
                </div>
                <p className="mb-8 text-slate-300">Current punches</p>
                
                <div className="flex gap-4">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="h-16 w-16 rounded-2xl"
                    onClick={handleRemovePunch}
                    disabled={user.punchCount === 0 || removePunch.isPending}
                  >
                    <Minus className="w-6 h-6" />
                  </Button>
                  <Button 
                    size="lg" 
                    className="h-16 px-12 rounded-2xl text-lg font-semibold"
                    onClick={handleAddPunch}
                    disabled={user.punchCount >= user.totalPunches || addPunch.isPending}
                  >
                    <Plus className="w-6 h-6 mr-2" /> Add Punch
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="rounded-[2rem] border-white/80 bg-white/92 shadow-xl shadow-slate-900/5">
              <CardHeader>
                <CardTitle className="text-lg">Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Punches Needed for Reward</div>
                  <Select value={user.totalPunches.toString()} onValueChange={handleUpdateTotalPunches}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select total punches" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 Punches (5 for 1)</SelectItem>
                      <SelectItem value="8">8 Punches (8 for 1)</SelectItem>
                      <SelectItem value="10">10 Punches (10 for 1)</SelectItem>
                      <SelectItem value="12">12 Punches (12 for 1)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total Lifetime Punches</div>
                  <div className="text-2xl font-semibold">{user.totalPunches}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Joined</div>
                  <div className="text-lg font-medium">{format(new Date(user.createdAt), 'MMM d, yyyy')}</div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-destructive/20 bg-destructive/5 shadow-xl shadow-slate-900/5">
              <CardHeader>
                <CardTitle className="text-lg text-destructive">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={handleResetPunches}
                  disabled={user.punchCount === 0 || resetPunches.isPending}
                >
                  <RotateCcw className="w-4 h-4 mr-2" /> Reset Punches to 0
                </Button>
              </CardContent>
            </Card>
            <Card className="rounded-[2rem] border-white/80 bg-white/92 shadow-xl shadow-slate-900/5">
              <CardHeader>
                <CardTitle className="text-lg">Recent Punch History</CardTitle>
              </CardHeader>
              <CardContent>
                {notifications && notifications.length > 0 ? (
                  <div className="space-y-4 max-h-[300px] overflow-y-auto">
                    {notifications.map((n) => (
                      <div key={n.id} className="flex items-start gap-3 text-sm">
                        <Clock className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div>
                          <p>{n.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No recent punches recorded.</p>
                )}
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
