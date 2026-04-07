import { useRoute } from "wouter";
import { useGetUser, getGetUserQueryKey, useAddPunch, useRemovePunch, useResetPunches, useGetSettings, getGetSettingsQueryKey, getGetStatsQueryKey, getListUsersQueryKey } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/Layouts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, Plus, Minus, RotateCcw } from "lucide-react";
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

  const { data: settings } = useGetSettings({
    query: { queryKey: getGetSettingsQueryKey() }
  });

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
            <h1 className="text-2xl font-bold tracking-tight">{user.name}</h1>
            <p className="text-muted-foreground">{user.phone}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Punch Card</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center py-8">
                <div className="text-6xl font-bold text-primary mb-2">
                  {user.punchCount} <span className="text-3xl text-muted-foreground">/ 10</span>
                </div>
                <p className="text-muted-foreground mb-8">Current Punches</p>
                
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
                    disabled={user.punchCount >= 10 || addPunch.isPending}
                  >
                    <Plus className="w-6 h-6 mr-2" /> Add Punch
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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

            <Card className="border-destructive/20 bg-destructive/5">
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
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
