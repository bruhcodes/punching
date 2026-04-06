import { useEffect, useState } from "react";
import { useGetSettings, getGetSettingsQueryKey, useUpdateSettings } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/Layouts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useGetSettings({
    query: { queryKey: getGetSettingsQueryKey() }
  });

  const updateSettings = useUpdateSettings();

  const [shopName, setShopName] = useState("");
  const [stampType, setStampType] = useState("");

  useEffect(() => {
    if (settings) {
      setShopName(settings.shopName);
      setStampType(settings.stampType);
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings.mutate(
      { data: { shopName, stampType } },
      {
        onSuccess: (data) => {
          queryClient.setQueryData(getGetSettingsQueryKey(), data);
          toast.success("Settings updated");
        },
        onError: () => toast.error("Failed to update settings")
      }
    );
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-8 text-center">Loading settings...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">Customize your shop's punch card experience.</p>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>App Customization</CardTitle>
            <CardDescription>
              Changes here reflect immediately on all customer devices.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="shopName">Shop Name</Label>
              <Input 
                id="shopName" 
                value={shopName} 
                onChange={(e) => setShopName(e.target.value)} 
              />
            </div>

            <div className="space-y-2">
              <Label>Stamp Icon</Label>
              <Select value={stampType} onValueChange={setStampType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select stamp type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="star">⭐ Star (Default)</SelectItem>
                  <SelectItem value="coffee">☕ Coffee</SelectItem>
                  <SelectItem value="boba">🧋 Boba</SelectItem>
                  <SelectItem value="heart">❤️ Heart</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              className="w-full" 
              onClick={handleSave}
              disabled={updateSettings.isPending || (shopName === settings?.shopName && stampType === settings?.stampType)}
            >
              {updateSettings.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
