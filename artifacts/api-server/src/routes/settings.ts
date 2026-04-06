import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, settingsTable } from "@workspace/db";
import {
  UpdateSettingsBody,
  GetSettingsResponse,
  UpdateSettingsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function ensureSettings() {
  const [existing] = await db
    .select()
    .from(settingsTable)
    .where(eq(settingsTable.id, "default"))
    .limit(1);
  if (!existing) {
    const [created] = await db
      .insert(settingsTable)
      .values({
        id: "default",
        stampType: "star",
        backgroundStyle: "white",
        progressStyle: "stamps",
        shopName: "Punch Card",
      })
      .returning();
    return created;
  }
  return existing;
}

router.get("/settings", async (req, res): Promise<void> => {
  const settings = await ensureSettings();
  res.json(GetSettingsResponse.parse(settings));
});

router.patch("/settings", async (req, res): Promise<void> => {
  const parsed = UpdateSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  await ensureSettings();

  const [updated] = await db
    .update(settingsTable)
    .set(parsed.data)
    .where(eq(settingsTable.id, "default"))
    .returning();

  res.json(UpdateSettingsResponse.parse(updated));
});

export default router;
