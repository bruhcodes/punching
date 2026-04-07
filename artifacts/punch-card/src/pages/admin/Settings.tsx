import { useEffect, useState } from "react";
import { useGetSettings, getGetSettingsQueryKey, useUpdateSettings } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/Layouts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useGetSettings({
    query: { queryKey: getGetSettingsQueryKey() },
  });

  const updateSettings = useUpdateSettings();

  const [shopName, setShopName] = useState("");
  const [stampType, setStampType] = useState("");
  const [backgroundStyle, setBackgroundStyle] = useState("white");
  const [backgroundImageUrl, setBackgroundImageUrl] = useState("");
  const [accentColor, setAccentColor] = useState("#111827");
  const [welcomeMessage, setWelcomeMessage] = useState("");

  useEffect(() => {
    if (settings) {
      setShopName(settings.shopName);
      setStampType(settings.stampType);
      setBackgroundStyle(settings.backgroundStyle);
      setBackgroundImageUrl(settings.backgroundImageUrl || "");
      setAccentColor(settings.accentColor || "#111827");
      setWelcomeMessage(settings.welcomeMessage || "");
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings.mutate(
      {
        data: {
          shopName,
          stampType,
          backgroundStyle,
          backgroundImageUrl,
          accentColor,
          welcomeMessage,
        },
      },
      {
        onSuccess: (data) => {
          queryClient.setQueryData(getGetSettingsQueryKey(), data);
          queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
          toast.success("Brand settings updated");
        },
        onError: () => toast.error("Couldn't save the new branding settings."),
      },
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
      <div className="space-y-8">
        <div className="rounded-[2rem] border border-slate-200/80 bg-white/80 p-6 shadow-xl shadow-slate-900/5">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-700">Brand studio</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Appearance & messaging</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Change the card background, add a welcome message, tune the accent color, and make the experience look more like your shop.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
          <Card className="rounded-[2rem] border-white/70 bg-white/85 shadow-xl shadow-slate-900/5">
            <CardHeader>
              <CardTitle>App customization</CardTitle>
              <CardDescription>These changes refresh automatically in the customer app.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="shopName">Shop name</Label>
                <Input id="shopName" value={shopName} onChange={(e) => setShopName(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Stamp icon</Label>
                <Select value={stampType} onValueChange={setStampType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select stamp type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="star">⭐ Star</SelectItem>
                    <SelectItem value="coffee">☕ Coffee</SelectItem>
                    <SelectItem value="boba">🧋 Boba</SelectItem>
                    <SelectItem value="heart">❤️ Heart</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Background style</Label>
                <Select value={backgroundStyle} onValueChange={setBackgroundStyle}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select background style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="white">Clean white</SelectItem>
                    <SelectItem value="sunset">Sunset glow</SelectItem>
                    <SelectItem value="ocean">Ocean glass</SelectItem>
                    <SelectItem value="midnight">Midnight dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="backgroundImageUrl">Background image URL</Label>
                <Input
                  id="backgroundImageUrl"
                  placeholder="https://images.unsplash.com/..."
                  value={backgroundImageUrl}
                  onChange={(e) => setBackgroundImageUrl(e.target.value)}
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="accentColor">Accent color</Label>
                  <div className="flex items-center gap-3">
                    <Input id="accentColor" type="color" className="h-11 w-16 p-1" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} />
                    <Input value={accentColor} onChange={(e) => setAccentColor(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Background style</Label>
                  <Input value={backgroundStyle} disabled />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="welcomeMessage">Welcome message</Label>
                <Textarea
                  id="welcomeMessage"
                  className="min-h-[120px]"
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  placeholder="Tap your QR code in-store to collect punches."
                />
              </div>

              <Button
                className="w-full rounded-2xl"
                onClick={handleSave}
                disabled={
                  updateSettings.isPending ||
                  (
                    shopName === settings?.shopName &&
                    stampType === settings?.stampType &&
                    backgroundStyle === settings?.backgroundStyle &&
                    backgroundImageUrl === (settings?.backgroundImageUrl || "") &&
                    accentColor === (settings?.accentColor || "#111827") &&
                    welcomeMessage === (settings?.welcomeMessage || "")
                  )
                }
              >
                {updateSettings.isPending ? "Saving..." : "Save branding"}
              </Button>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[2rem] border-white/70 bg-white/85 shadow-xl shadow-slate-900/5">
            <CardHeader>
              <CardTitle>Live preview</CardTitle>
              <CardDescription>How the customer app will feel after you save.</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="rounded-[2rem] border border-slate-200 p-5 text-white shadow-lg"
                style={{
                  backgroundColor:
                    backgroundStyle === "midnight"
                      ? "#0f172a"
                      : backgroundStyle === "ocean"
                        ? "#0f766e"
                        : backgroundStyle === "sunset"
                          ? "#c2410c"
                          : accentColor || "#111827",
                  backgroundImage: backgroundImageUrl
                    ? `linear-gradient(135deg, rgba(15,23,42,0.55), rgba(15,23,42,0.15)), url(${backgroundImageUrl})`
                    : backgroundStyle === "sunset"
                      ? "linear-gradient(135deg, #f97316 0%, #fb7185 100%)"
                      : backgroundStyle === "ocean"
                        ? "linear-gradient(135deg, #0f766e 0%, #38bdf8 100%)"
                        : backgroundStyle === "midnight"
                          ? "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)"
                    : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <p className="text-xs uppercase tracking-[0.3em] text-white/80">Preview</p>
                <h2 className="mt-3 text-2xl font-semibold">{shopName || "Punch Card"}</h2>
                <p className="mt-2 text-sm text-white/80">
                  {welcomeMessage || "Tap your QR code in-store to collect punches."}
                </p>
                <div className="mt-6 grid grid-cols-5 gap-2">
                  {Array.from({ length: 10 }).map((_, index) => (
                    <div key={index} className="aspect-square rounded-full bg-white/15" />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
