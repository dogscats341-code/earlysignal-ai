import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, changesTable, monitorsTable } from "@workspace/db";
import type { Severity } from "@workspace/earlysignal-demo";
import { scrapeWebsite } from "./scraper";

type MonitorRecord = typeof monitorsTable.$inferSelect;
type ChangeRecord = typeof changesTable.$inferSelect;

export type MonitorCheckOutcome = {
  success: boolean;
  message: string;
  changeDetected: boolean;
  value: string | null;
  monitor: MonitorRecord;
  change: ChangeRecord | null;
};

export class MonitorNotFoundError extends Error {
  constructor() {
    super("Monitor not found");
    this.name = "MonitorNotFoundError";
  }
}

function parsePrice(value: string): number | null {
  const numberText = value.replace(/[^\d.,-]/g, "");
  if (!numberText) return null;

  const lastComma = numberText.lastIndexOf(",");
  const lastDot = numberText.lastIndexOf(".");
  let normalized = numberText;
  if (lastComma > lastDot) {
    normalized = numberText.replace(/\./g, "").replace(",", ".");
  } else {
    normalized = numberText.replace(/,/g, "");
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function getSeverity(previousValue: string, newValue: string): Severity {
  const previous = parsePrice(previousValue);
  const current = parsePrice(newValue);
  if (previous === null || current === null || previous === 0) return "Medium";

  const percentChange = (Math.abs(current - previous) / Math.abs(previous)) * 100;
  if (percentChange >= 10) return "High";
  if (percentChange >= 3) return "Medium";
  return "Low";
}

export async function checkMonitor(monitorId: string): Promise<MonitorCheckOutcome> {
  const [initialMonitor] = await db
    .select()
    .from(monitorsTable)
    .where(eq(monitorsTable.id, monitorId))
    .limit(1);
  if (!initialMonitor) throw new MonitorNotFoundError();

  const scrape = await scrapeWebsite(initialMonitor.websiteUrl, initialMonitor.monitorType);
  const checkedAt = new Date();

  const transactionResult = await db.transaction(async (tx) => {
    const [currentMonitor] = await tx
      .select()
      .from(monitorsTable)
      .where(eq(monitorsTable.id, monitorId))
      .for("update");
    if (!currentMonitor) throw new MonitorNotFoundError();

    let change: ChangeRecord | null = null;
    let lastValue = currentMonitor.lastValue;
    if (scrape.success && scrape.value !== null) {
      if (currentMonitor.lastValue !== null && currentMonitor.lastValue !== scrape.value) {
        const [createdChange] = await tx
          .insert(changesTable)
          .values({
            id: `c-${randomUUID()}`,
            monitorId: currentMonitor.id,
            changeType: "Product price",
            title: "Product price changed",
            description: `The detected price changed from ${currentMonitor.lastValue} to ${scrape.value}.`,
            oldValue: currentMonitor.lastValue,
            newValue: scrape.value,
            severity: getSeverity(currentMonitor.lastValue, scrape.value),
            sourceUrl: currentMonitor.websiteUrl,
            dataSource: "live",
            detectedAt: checkedAt,
          })
          .returning();
        change = createdChange;
      }
      lastValue = scrape.value;
    }

    const [updatedMonitor] = await tx
      .update(monitorsTable)
      .set({
        lastChecked: checkedAt,
        ...(scrape.success ? { checkSource: "live" } : {}),
        ...(scrape.success && scrape.value !== null ? { lastValue } : {}),
      })
      .where(eq(monitorsTable.id, currentMonitor.id))
      .returning();

    return { monitor: updatedMonitor, change };
  });

  const message = !scrape.success
    ? scrape.error ?? "The website could not be checked."
    : scrape.value === null
      ? "The page was fetched, but no product price was found. Last checked was updated."
      : transactionResult.change
        ? "A price change was detected and saved."
        : initialMonitor.lastValue === null
          ? "Live check completed. This price is now the comparison baseline."
          : "Live check completed. No price change was found.";

  return {
    success: scrape.success,
    message,
    changeDetected: transactionResult.change !== null,
    value: scrape.value,
    monitor: transactionResult.monitor,
    change: transactionResult.change,
  };
}