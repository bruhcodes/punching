import { useEffect, useMemo, useState } from "react";
import { useGetSettings, getGetSettingsQueryKey, useUpdateSettings } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/Layouts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { Megaphone, WandSparkles } from "lucide-react";
import { toast } from "sonner";

type PremiumSettings = {
  cardStyle?: string | null;
  heroBadge?: string | null;
  rewardLabel?: string | null;
  dealLabel?: string | null;
  backgroundImageUrl?: string | null;
  accentColor?: string | null;
  welcomeMessage?: string | null;
  shopName?: string | null;
  stampType?: string | null;
  backgroundStyle?: string | null;
};

const stampOptions = [
  { value: "star", label: "⭐ Star" },
  { value: "coffee", label: "☕ Coffee" },
  { value: "boba", label: "🧋 Boba" },
  { value: "heart", label: "❤️ Heart" },
  { value: "icecream", label: "🍦 Ice Cream" },
  { value: "bean", label: "🫘 Coffee Bean" },
  { value: "sparkle", label: "✨ Sparkles" },
  { value: "logo", label: "🖼️ Shop Logo" },
];

const backgroundOptions = [
  { value: "white", label: "Clean white" },
  { value: "sunset", label: "Sunset glow" },
  { value: "ocean", label: "Ocean glass" },
  { value: "midnight", label: "Midnight dark" },
];

const cardStyleOptions = [
  { value: "luxe", label: "Luxe glass" },
  { value: "velvet", label: "Velvet dusk" },
  { value: "aurora", label: "Aurora glow" },
  { value: "midnight", label: "Midnight chrome" },
];

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const { data: rawSettings, isLoading } = useGetSettings({
    query: { queryKey: getGetSettingsQueryKey() },
  });
  const settings = rawSettings as (typeof rawSettings & PremiumSettings) | undefined;

  const updateSettings = useUpdateSettings();

  const [shopName, setShopName] = useState("");
  const [stampType, setStampType] = useState("");
  const [backgroundStyle, setBackgroundStyle] = useState("white");
  const [backgroundImageUrl, setBackgroundImageUrl] = useState("");
  const [accentColor, setAccentColor] = useState("#111827");
  const [adBannerText, setAdBannerText] = useState("");

  useEffect(() => {
    if (!settings) return;
    setShopName(settings.shopName);
    setStampType(settings.stampType);
    setBackgroundStyle(settings.backgroundStyle);
    setBackgroundImageUrl(settings.backgroundImageUrl || "");
    setAccentColor(settings.accentColor || "#111827");
    setAdBannerText(settings.welcomeMessage || "");
  }, [settings]);

  const pristine = useMemo(
    () =>
      shopName === (settings?.shopName || "") &&
      stampType === (settings?.stampType || "") &&
      backgroundStyle === (settings?.backgroundStyle || "white") &&
      backgroundImageUrl === (settings?.backgroundImageUrl || "") &&
      accentColor === (settings?.accentColor || "#111827") &&
      adBannerText === (settings?.welcomeMessage || ""),
    [settings, shopName, stampType, backgroundStyle, backgroundImageUrl, accentColor, adBannerText],
  );

  const previewBackground =
    backgroundStyle === "sunset"
      ? `linear-gradient(135deg, #3f1d2e 0%, ${accentColor} 42%, #111827 100%)`
      : backgroundStyle === "ocean"
        ? "linear-gradient(135deg, #020617 0%, #0f172a 55%, #334155 100%)"
        : `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}cc 50%, #0f172a 100%)`;

  const handleSave = () => {
    updateSettings.mutate(
      {
        data: {
          shopName,
          stampType,
          backgroundStyle,
          backgroundImageUrl,
          accentColor,
          welcomeMessage: adBannerText,
        } as never,
      },
      {
        onSuccess: (data) => {
          queryClient.setQueryData(getGetSettingsQueryKey(), data);
          queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
          toast.success("Settings saved successfully");
        },
        onError: () => toast.error("Couldn't save settings."),
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
        <div className="rounded-[2.4rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50">
          <p className="text-xs uppercase tracking-[0.32em] text-sky-600 font-bold">Brand Studio</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900" data-display="serif">
            Appearance &amp; Messaging
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
            Change the card background, add a welcome message, tune the accent color, and edit the ad banner that shows in the customer app.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-6">

            {/* Identity */}
            <Card className="rounded-[2rem] border-white/80 bg-white/90 shadow-xl shadow-slate-900/5">
              <CardHeader>
                <CardTitle>Identity</CardTitle>
                <CardDescription>The main brand signals users see first.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="shopName">Shop name</Label>
                  <Input id="shopName" value={shopName} onChange={(e) => setShopName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Stamp icon</Label>
                  <Select value={stampType} onValueChange={setStampType}>
                    <SelectTrigger><SelectValue placeholder="Select stamp type" /></SelectTrigger>
                    <SelectContent>
                      {stampOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>



            {/* Copy & labels section removed since they don't persist in DB */}

            {/* ✨ Ad Banner Section */}
            <Card className="rounded-[2rem] border-cyan-200/60 bg-gradient-to-br from-cyan-50 to-white shadow-xl shadow-slate-900/5 ring-2 ring-cyan-200/40">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-cyan-100 p-2 text-cyan-600">
                    <Megaphone className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>Ad Banner</CardTitle>
                    <CardDescription>This text appears in the banner strip shown at the bottom of every customer's card.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Label htmlFor="adBannerText">Banner message</Label>
                  <Textarea
                    id="adBannerText"
                    className="min-h-[100px] resize-none text-base"
                    value={adBannerText}
                    onChange={(e) => setAdBannerText(e.target.value)}
                    placeholder="e.g. ☕ Double-punch Thursdays! Come in between 2–5pm for 2x points on any drink."
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to show automatic progress messages based on the customer's punch count.
                  </p>

                  {/* Live preview of the banner */}
                  {adBannerText && (
                    <div
                      style={{
                        borderRadius: 14,
                        overflow: "hidden",
                        border: "1px solid rgba(6,182,212,0.2)",
                        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                        marginTop: 8,
                      }}
                    >
                      <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: accentColor, fontWeight: 700, marginBottom: 5 }}>
                            Today's Offer
                          </p>
                          <p style={{ margin: 0, fontSize: 13, color: "#e2e8f0", lineHeight: 1.5 }}>
                            {adBannerText}
                          </p>
                        </div>
                        <div style={{ padding: "6px 10px", borderRadius: 10, background: `${accentColor}20`, border: `1px solid ${accentColor}30`, textAlign: "center" }}>
                          <p style={{ margin: 0, fontSize: 9, color: "#64748b", textTransform: "uppercase" }}>Preview</p>
                          <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: accentColor }}>Live</p>
                        </div>
                      </div>
                      <div style={{ height: 3, background: `linear-gradient(90deg, ${accentColor}, ${accentColor}44)` }} />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Button className="h-12 w-full rounded-2xl text-base" onClick={handleSave} disabled={updateSettings.isPending || pristine}>
              {updateSettings.isPending ? "Saving..." : "Save settings"}
            </Button>

            {/* Admin Debug Info */}
            <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">System Connection Debug</p>
              <div className="mt-2 space-y-1 text-xs text-slate-500">
                <p><strong>API Server:</strong> {import.meta.env.VITE_API_BASE_URL || "Local (Proxy)"}</p>
                <p><strong>Push Notifications:</strong> {import.meta.env.VITE_VAPID_PUBLIC_KEY ? "✅ Configured" : "❌ Public Key Missing"}</p>
              </div>
            </div>
          </div>

          {/* Live preview sidebar */}
          <div className="space-y-6">
            <Card className="overflow-hidden rounded-[2rem] border-white/80 bg-white/90 shadow-xl shadow-slate-900/5">
              <CardHeader>
                <CardTitle>Live preview</CardTitle>
                <CardDescription>How the card will look for customers.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className="overflow-hidden rounded-[2rem] border border-slate-200 p-5 text-white shadow-lg"
                  style={{
                    background: "linear-gradient(135deg, #38bdf8 0%, #a855f7 100%)",
                  }}
                >
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-white/90">
                    <WandSparkles className="h-3.5 w-3.5" />
                    Member status
                  </div>
                  <h2 className="mt-4 text-3xl font-semibold" data-display="serif">{shopName || "Cool Spot"}</h2>
                  <div className="mt-6 grid grid-cols-5 gap-2">
                    {Array.from({ length: 10 }).map((_, index) => (
                      <div key={index} className="aspect-square rounded-full border border-white/20 bg-white/12" />
                    ))}
                  </div>
                  <div className="mt-6 rounded-[1.5rem] bg-white/12 p-4 backdrop-blur-xl">
                    <p className="text-[11px] uppercase tracking-[0.32em] text-white/70">Today's Offer</p>
                    <p className="mt-2 text-sm font-medium">Free drink unlocks after your next milestone.</p>
                  </div>
                </div>

                {/* Ad banner preview in sidebar */}
                <div
                  style={{
                    borderRadius: 14,
                    padding: "12px 16px",
                    background: "#0f172a",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <p style={{ margin: 0, fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: accentColor, fontWeight: 700, marginBottom: 4 }}>
                    Today's Offer
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>
                    {adBannerText || "Ad banner will appear here — fill in the field on the left."}
                  </p>
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 text-sm text-muted-foreground">
                  Use the ad banner to promote daily specials, double-punch hours, or seasonal offers. Changes appear instantly in the customer app.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
