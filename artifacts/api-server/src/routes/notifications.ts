import { Router, type IRouter } from "express";
import {
  SendNotificationBody,
  ListNotificationsQueryParams,
  ListNotificationsResponse,
  MarkNotificationReadParams,
  MarkNotificationReadResponse,
} from "@workspace/api-zod";
import {
  createNotifications,
  listNotificationsByUser,
  markNotificationReadById,
} from "../lib/supabase";
import { sendWebPush } from "../lib/push";

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

  // Send Web Push in background
  sendWebPush(userIds, message).catch(() => {});

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
