import { Router, type IRouter } from "express";
import {
  getOrCreateSettings,
  listPushSubscriptionsByUserIds,
  deletePushSubscriptionsByUser,
  upsertPushSubscriptionRecord,
} from "../lib/supabase";
import webpush from "web-push";

const router: IRouter = Router();

router.post("/push/subscribe", async (req, res): Promise<void> => {
  const { userId, subscription } = req.body as {
    userId: string;
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } };
  };

  if (!userId || !subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  await upsertPushSubscriptionRecord({
    userId,
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
  });

  res.status(201).json({ ok: true });
});

router.delete("/push/subscribe", async (req, res): Promise<void> => {
  const { userId } = req.body as { userId: string };
  if (!userId) {
    res.status(400).json({ error: "Missing userId" });
    return;
  }
  await deletePushSubscriptionsByUser(userId);
  res.json({ ok: true });
});

router.post("/push/test", async (req, res): Promise<void> => {
  const { userId } = req.body as { userId: string };
  if (!userId) {
    res.status(400).json({ error: "Missing userId" });
    return;
  }

  const subscriptions = await listPushSubscriptionsByUserIds([userId]);
  if (subscriptions.length === 0) {
    res.status(404).json({ error: "No push subscription found for this user yet." });
    return;
  }

  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    res.status(500).json({ error: "VAPID keys are missing on the server." });
    return;
  }

  const settings = await getOrCreateSettings();
  const payload = JSON.stringify({
    title: settings.shopName || "Punch Card",
    body: "This is a test notification.",
    url: "/notifications",
    tag: "punch-card-test",
  });

  await Promise.all(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
      ),
    ),
  );

  res.json({ ok: true, sent: subscriptions.length });
});

export default router;
