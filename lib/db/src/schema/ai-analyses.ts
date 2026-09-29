import { timestamp, text, pgTable } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { changesTable } from "./changes";

export const aiAnalysesTable = pgTable("ai_analyses", {
  id: text("id").primaryKey(),
  changeId: text("change_id")
    .notNull()
    .references(() => changesTable.id),
  summary: text("summary").notNull(),
  whyItMatters: text("why_it_matters").notNull(),
  suggestedAction: text("suggested_action").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAIAnalysisSchema = createInsertSchema(aiAnalysesTable).omit({
  createdAt: true,
});
export type InsertAIAnalysis = z.infer<typeof insertAIAnalysisSchema>;
export type AIAnalysis = typeof aiAnalysesTable.$inferSelect;