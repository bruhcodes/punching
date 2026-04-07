import { Router, type IRouter } from "express";
import {
  deletePushSubscriptionsByUser,
  upsertPushSubscriptionRecord,
} from "../lib/supabase";

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

export default router;
