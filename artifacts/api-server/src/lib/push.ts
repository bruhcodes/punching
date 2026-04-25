import webpush from "web-push";
import { 
  getOrCreateSettings, 
  listPushSubscriptionsByUserIds, 
  deletePushSubscriptionById 
} from "./supabase";
import { logger } from "./logger";

// Configure VAPID once at startup
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
    logger.warn({ err: e }, "VAPID setup failed — web push disabled");
  }
}

export async function sendWebPush(userIds: string[], message: string) {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return;
  }

  try {
    const settings = await getOrCreateSettings();
    const subscriptions = await listPushSubscriptionsByUserIds(userIds);

    const payload = JSON.stringify({
      title: settings.shopName || "Punch Card",
      body: message,
      url: "/notifications",
      tag: `msg-${Date.now()}`,
    });

    const sendPromises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        );
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 410 || status === 404) {
          await deletePushSubscriptionById(sub.id);
        }
      }
    });

    await Promise.all(sendPromises);
  } catch (err) {
    logger.error({ err }, "Error in sendWebPush");
  }
}
