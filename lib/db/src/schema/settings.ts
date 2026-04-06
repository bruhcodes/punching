import { pgTable, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const settingsTable = pgTable("settings", {
  id: text("id").primaryKey().default("default"),
  stampType: text("stamp_type").notNull().default("star"),
  backgroundStyle: text("background_style").notNull().default("white"),
  progressStyle: text("progress_style").notNull().default("stamps"),
  shopName: text("shop_name").notNull().default("Punch Card"),
});

export const insertSettingsSchema = createInsertSchema(settingsTable);
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settingsTable.$inferSelect;
