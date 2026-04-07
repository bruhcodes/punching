import { Router, type IRouter } from "express";
import {
  SendNotificationBody,
  ListNotificationsQueryParams,
  ListNotificationsResponse,
  MarkNotificationReadParams,
  MarkNotificationReadResponse,
} from "@workspace/api-zod";
import webpush from "web-push";
import {
  createNotifications,
  deletePushSubscriptionById,
  listNotificationsByUser,
  listPushSubscriptionsByUserIds,
  markNotificationReadById,
} from "../lib/supabase";

// Configure VAPID once at startup — strip any "=" padding that web-push rejects
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  const pubKey = process.env.VAPID_PUBLIC_KEY.replace(/=+$/, "").trim();
  const privKey = process.env.VAPID_PRIVATE_KEY.replace(/=+$/, "").trim();
  try {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || "mailto:admin@punchcard.app",
      pubKey,
      privKey,
    );
  } catch (e) {
    // Log but don't crash — push will simply not be sent
    import("../lib/logger").then(({ logger }) =>
      logger.warn({ err: e }, "VAPID setup failed — web push disabled"),
    );
  }
}

const router: IRouter = Router();

router.get("/notifications", async (req, res): Promise<void> => {
  const parsed = ListNotificationsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const notifications = await listNotificationsByUser(parsed.data.userId);

  res.json(ListNotificationsResponse.parse(notifications));
});

router.post("/notifications", async (req, res): Promise<void> => {
  const parsed = SendNotificationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { userIds, message } = parsed.data;

  if (!userIds || userIds.length === 0) {
    res.status(400).json({ error: "userIds must be a non-empty array" });
    return;
  }

  // Save notification records
  const inserted = await createNotifications(userIds, message);

  // Send Web Push to each subscribed user (fire-and-forget, don't block response)
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    const subscriptions = await listPushSubscriptionsByUserIds(userIds);

    const payload = JSON.stringify({
      title: "New message from your shop",
      body: message,
      url: "/notifications",
    });

    const sendPromises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        );
      } catch (err: unknown) {
        // If subscription is expired/invalid, remove it
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 410 || status === 404) {
          await deletePushSubscriptionById(sub.id);
        }
      }
    });

    // Send in background, respond immediately
    Promise.all(sendPromises).catch(() => {});
  }

  res.status(201).json(inserted);
});

router.post("/notifications/:id/read", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = MarkNotificationReadParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const notification = await markNotificationReadById(params.data.id);

  if (!notification) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }

  res.json(MarkNotificationReadResponse.parse(notification));
});

export default router;
