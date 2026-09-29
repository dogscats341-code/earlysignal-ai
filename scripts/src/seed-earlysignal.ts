import { db, pool, aiAnalysesTable, changesTable, monitorsTable } from "@workspace/db";
import {
  DEMO_AI_ANALYSES,
  DEMO_CHANGES,
  DEMO_MONITORS,
} from "@workspace/earlysignal-demo";

async function seed() {
  await db
    .insert(monitorsTable)
    .values(
      DEMO_MONITORS.map((monitor) => ({
        ...monitor,
        createdAt: new Date(monitor.createdAt),
        lastChecked: new Date(monitor.lastChecked),
      })),
    )
    .onConflictDoNothing();

  await db
    .insert(changesTable)
    .values(
      DEMO_CHANGES.map((change) => ({
        ...change,
        detectedAt: new Date(change.detectedAt),
      })),
    )
    .onConflictDoNothing();

  await db
    .insert(aiAnalysesTable)
    .values(
      DEMO_AI_ANALYSES.map((analysis) => ({
        ...analysis,
        createdAt: new Date(analysis.createdAt),
      })),
    )
    .onConflictDoNothing();

  console.info("EarlySignal demo data is ready.");
}

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });