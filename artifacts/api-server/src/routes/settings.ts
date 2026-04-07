import { Router, type IRouter } from "express";
import {
  UpdateSettingsBody,
  GetSettingsResponse,
  UpdateSettingsResponse,
} from "@workspace/api-zod";
import { getOrCreateSettings, updateSettingsRecord } from "../lib/supabase";

const router: IRouter = Router();

router.get("/settings", async (req, res): Promise<void> => {
  const settings = await getOrCreateSettings();
  res.json(GetSettingsResponse.parse(settings));
});

router.patch("/settings", async (req, res): Promise<void> => {
  const parsed = UpdateSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updated = await updateSettingsRecord(parsed.data);

  res.json(UpdateSettingsResponse.parse(updated));
});

export default router;
