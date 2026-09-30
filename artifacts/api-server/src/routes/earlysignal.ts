import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import {
  CreateEarlySignalMonitorBody,
  CreateEarlySignalMonitorResponse,
  CheckEarlySignalMonitorParams,
  CheckEarlySignalMonitorResponse,
  GetEarlySignalWorkspaceResponse,
  UpdateEarlySignalMonitorStatusBody,
  UpdateEarlySignalMonitorStatusParams,
  UpdateEarlySignalMonitorStatusResponse,
} from "@workspace/api-zod";
import { db, monitorsTable, changesTable, aiAnalysesTable } from "@workspace/db";
import {
  DEMO_AI_ANALYSES,
  DEMO_CHANGES,
  DEMO_MONITORS,
} from "@workspace/earlysignal-demo";
import { checkMonitor, MonitorNotFoundError } from "../lib/checker";

const router: IRouter = Router();
const forceDemoMode = process.env.DEMO_MODE === "true";

function toISOString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function serializeMonitor(monitor: typeof monitorsTable.$inferSelect) {
  return {
    ...monitor,
    createdAt: toISOString(monitor.createdAt),
    lastChecked: toISOString(monitor.lastChecked),
  };
}

function serializeChange(change: typeof changesTable.$inferSelect) {
  return {
    ...change,
    detectedAt: toISOString(change.detectedAt),
  };
}

function serializeAnalysis(analysis: typeof aiAnalysesTable.$inferSelect) {
  return {
    ...analysis,
    createdAt: toISOString(analysis.createdAt),
  };
}

function demoWorkspace() {
  return {
    mode: "demo" as const,
    monitors: DEMO_MONITORS,
    changes: DEMO_CHANGES,
    analyses: DEMO_AI_ANALYSES,
  };
}

router.get("/earlysignal/workspace", async (req, res): Promise<void> => {
  const monitors = await db.select().from(monitorsTable);

  if (forceDemoMode || monitors.length === 0) {
    req.log.info({ mode: "demo", reason: forceDemoMode ? "DEMO_MODE" : "empty_database" }, "Serving EarlySignal demo workspace");
    res.json(GetEarlySignalWorkspaceResponse.parse(demoWorkspace()));
    return;
  }

  const [changes, analyses] = await Promise.all([
    db.select().from(changesTable),
    db.select().from(aiAnalysesTable),
  ]);
  const workspace = {
    mode: "database" as const,
    monitors: monitors.map(serializeMonitor),
    changes: changes.map(serializeChange),
    analyses: analyses.map(serializeAnalysis),
  };
  req.log.info({ mode: "database", monitorCount: monitors.length }, "Serving EarlySignal database workspace");
  res.json(GetEarlySignalWorkspaceResponse.parse(workspace));
});

router.post("/earlysignal/monitors", async (req, res): Promise<void> => {
  const parsed = CreateEarlySignalMonitorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  let websiteUrl: URL;
  try {
    websiteUrl = new URL(parsed.data.websiteUrl);
  } catch {
    res.status(400).json({ error: "Enter a complete website URL, including https://" });
    return;
  }

  if (!["http:", "https:"].includes(websiteUrl.protocol)) {
    res.status(400).json({ error: "Only http and https website URLs are supported." });
    return;
  }

  const now = new Date();
  const [monitor] = await db
    .insert(monitorsTable)
    .values({
      id: `m-${randomUUID()}`,
      name: parsed.data.name.trim(),
      websiteUrl: websiteUrl.toString(),
      monitorType: "Product Price",
      status: "active",
      checkSource: "demo",
      lastValue: null,
      createdAt: now,
      lastChecked: now,
    })
    .returning();

  res.status(201).json(CreateEarlySignalMonitorResponse.parse(serializeMonitor(monitor)));
});

router.patch("/earlysignal/monitors/:id/status", async (req, res): Promise<void> => {
  const params = UpdateEarlySignalMonitorStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateEarlySignalMonitorStatusBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [monitor] = await db
    .update(monitorsTable)
    .set({ status: body.data.status })
    .where(eq(monitorsTable.id, params.data.id))
    .returning();

  if (!monitor) {
    res.status(404).json({ error: "Monitor not found" });
    return;
  }

  res.json(UpdateEarlySignalMonitorStatusResponse.parse(serializeMonitor(monitor)));
});

router.post("/check/:id", async (req, res): Promise<void> => {
  const params = CheckEarlySignalMonitorParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  try {
    const result = await checkMonitor(params.data.id);
    res.json(
      CheckEarlySignalMonitorResponse.parse({
        success: result.success,
        message: result.message,
        changeDetected: result.changeDetected,
        value: result.value,
        monitor: serializeMonitor(result.monitor),
      }),
    );
  } catch (error) {
    if (error instanceof MonitorNotFoundError) {
      res.status(404).json({ error: "Monitor not found" });
      return;
    }
    throw error;
  }
});

export default router;