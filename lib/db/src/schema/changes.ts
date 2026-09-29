import { timestamp, text, pgTable } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { monitorsTable } from "./monitors";

export const changesTable = pgTable("changes", {
  id: text("id").primaryKey(),
  monitorId: text("monitor_id")
    .notNull()
    .references(() => monitorsTable.id),
  changeType: text("change_type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  oldValue: text("old_value").notNull(),
  newValue: text("new_value").notNull(),
  severity: text("severity").notNull(),
  sourceUrl: text("source_url").notNull(),
  detectedAt: timestamp("detected_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertChangeSchema = createInsertSchema(changesTable).omit({
  detectedAt: true,
});
export type InsertChange = z.infer<typeof insertChangeSchema>;
export type Change = typeof changesTable.$inferSelect;