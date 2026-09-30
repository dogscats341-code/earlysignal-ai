import { timestamp, text, pgTable } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const monitorsTable = pgTable("monitors", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  websiteUrl: text("website_url").notNull(),
  monitorType: text("monitor_type").notNull(),
  status: text("status").notNull().default("active"),
  checkSource: text("check_source").notNull().default("demo"),
  lastValue: text("last_value"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastChecked: timestamp("last_checked", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMonitorSchema = createInsertSchema(monitorsTable).omit({
  createdAt: true,
  lastChecked: true,
});
export type InsertMonitor = z.infer<typeof insertMonitorSchema>;
export type Monitor = typeof monitorsTable.$inferSelect;