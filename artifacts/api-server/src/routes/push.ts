import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, pushSubscriptionsTable } from "@workspace/db";
import { randomUUID } from "crypto";

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

  // Upsert: if this endpoint already exists, update the userId
  const existing = await db
    .select()
    .from(pushSubscriptionsTable)
    .where(eq(pushSubscriptionsTable.endpoint, subscription.endpoint))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(pushSubscriptionsTable)
      .set({ userId })
      .where(eq(pushSubscriptionsTable.endpoint, subscription.endpoint));
    res.json({ ok: true });
    return;
  }

  await db.insert(pushSubscriptionsTable).values({
    id: randomUUID(),
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
  await db.delete(pushSubscriptionsTable).where(eq(pushSubscriptionsTable.userId, userId));
  res.json({ ok: true });
});

export default router;
