import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/* =========================================================
   EarlySignal AI — Demo Data Layer
   Frontend-only MVP data layer.

   IMPORTANT:
   - Demo data is intentionally fictional.
   - No real scraping or AI analysis is claimed here.
   - Real monitoring will be connected later through a secure backend.
========================================================= */

export const DEMO_DATA_LABEL = "Demo Data";

export type MonitorStatus = "active" | "paused";

export type MonitorType =
  | "Product Price"
  | "Product Availability"
  | "Product Catalog"
  | "Website Content";

export type Severity = "High" | "Medium" | "Low";

export type CheckStatus =
  | "not_checked"
  | "checking"
  | "completed"
  | "blocked"
  | "failed";

export type ChangeType =
  | "price"
  | "availability"
  | "catalog"
  | "content"
  | "unknown";

/* =========================================================
   Core Types
========================================================= */

export interface Monitor {
  id: string;
  name: string;
  websiteUrl: string;
  monitorType: MonitorType;

  status: MonitorStatus;

  lastChecked: string | null;
  lastValue?: string;

  checkSource: string;

  createdAt: string;

  checkStatus: CheckStatus;
  lastCheckMessage?: string;

  isDemo: boolean;
}

export interface Change {
  id: string;
  monitorId: string;

  title: string;
  description: string;

  oldValue: string;
  newValue: string;

  severity: Severity;
  changeType: ChangeType;

  dataSource: string;
  detectedAt: string;

  isDemo: boolean;
}

export interface AddMonitorInput {
  name: string;
  websiteUrl: string;
  monitorType: MonitorType;
}

export interface CheckMonitorResult {
  success: boolean;
  status: CheckStatus;
  message: string;

  monitorId: string;

  value?: string;
  source?: string;

  changeDetected?: boolean;
}

/* =========================================================
   Storage
========================================================= */

const STORAGE_KEYS = {
  monitors: "earlysignal_monitors_v2",
  changes: "earlysignal_changes_v2",
} as const;

/* =========================================================
   Demo Helpers
========================================================= */

function safeReadStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const stored = window.localStorage.getItem(key);

    if (!stored) {
      return fallback;
    }

    return JSON.parse(stored) as T;
  } catch {
    return fallback;
  }
}

function safeWriteStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be unavailable in private/restricted browser contexts.
  }
}

function getHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "website";
  }
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

/* =========================================================
   Initial Demo Data
========================================================= */

const INITIAL_MONITORS: Monitor[] = [
  {
    id: "mon-1",
    name: "Jumia Morocco — iPhone 15",
    websiteUrl: "https://www.jumia.ma",
    monitorType: "Product Price",
    status: "active",
    lastChecked: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    lastValue: "11,499 DH",
    checkSource: "Demo source",
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    checkStatus: "completed",
    lastCheckMessage:
      "Demo check completed using sample monitoring data.",
    isDemo: true,
  },
  {
    id: "mon-2",
    name: "Iris.ma — Gaming Laptop",
    websiteUrl: "https://www.iris.ma",
    monitorType: "Product Price",
    status: "active",
    lastChecked: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    lastValue: "8,990 DH",
    checkSource: "Demo source",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    checkStatus: "completed",
    lastCheckMessage:
      "Demo check completed using sample monitoring data.",
    isDemo: true,
  },
  {
    id: "mon-3",
    name: "Example Fashion Store — Product Catalog",
    websiteUrl: "https://example.com",
    monitorType: "Product Catalog",
    status: "active",
    lastChecked: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    lastValue: "42 products",
    checkSource: "Demo source",
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    checkStatus: "completed",
    lastCheckMessage:
      "Demo catalog snapshot available.",
    isDemo: true,
  },
  {
    id: "mon-4",
    name: "Example SaaS — Website Content",
    websiteUrl: "https://example.com",
    monitorType: "Website Content",
    status: "paused",
    lastChecked: new Date(Date.now() - 86400000).toISOString(),
    lastValue: "Homepage snapshot",
    checkSource: "Demo source",
    createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
    checkStatus: "completed",
    lastCheckMessage:
      "Monitoring is currently paused.",
    isDemo: true,
  },
];

const INITIAL_CHANGES: Change[] = [
  {
    id: "chg-1",
    monitorId: "mon-1",
    title: "Price decreased by 5%",
    description:
      "Demo change: the sample product price moved from 12,099 DH to 11,499 DH.",
    oldValue: "12,099 DH",
    newValue: "11,499 DH",
    severity: "High",
    changeType: "price",
    dataSource: "Demo source",
    detectedAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    isDemo: true,
  },
  {
    id: "chg-2",
    monitorId: "mon-2",
    title: "Price changed",
    description:
      "Demo change: the sample gaming laptop price changed from 9,490 DH to 8,990 DH.",
    oldValue: "9,490 DH",
    newValue: "8,990 DH",
    severity: "Medium",
    changeType: "price",
    dataSource: "Demo source",
    detectedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    isDemo: true,
  },
];

/* =========================================================
   Demo Data Provider
========================================================= */

function useProvideDemoData() {
  const [monitors, setMonitors] = useState<Monitor[]>(() =>
    safeReadStorage(STORAGE_KEYS.monitors, INITIAL_MONITORS)
  );

  const [changes, setChanges] = useState<Change[]>(() =>
    safeReadStorage(STORAGE_KEYS.changes, INITIAL_CHANGES)
  );

  /* -------------------------------------------------------
     Persist monitors
  ------------------------------------------------------- */

  useEffect(() => {
    safeWriteStorage(STORAGE_KEYS.monitors, monitors);
  }, [monitors]);

  /* -------------------------------------------------------
     Persist changes
  ------------------------------------------------------- */

  useEffect(() => {
    safeWriteStorage(STORAGE_KEYS.changes, changes);
  }, [changes]);

  /* -------------------------------------------------------
     Add monitor
  ------------------------------------------------------- */

  const addMonitor = async (
    data: AddMonitorInput
  ): Promise<Monitor> => {
    const hostname = getHostname(data.websiteUrl);
    const now = new Date().toISOString();

    const newMonitor: Monitor = {
      id: createId("mon"),
      name: data.name.trim(),
      websiteUrl: data.websiteUrl.trim(),
      monitorType: data.monitorType,
      status: "active",

      lastChecked: null,
      lastValue: "Awaiting first check",

      checkSource: "Demo source",

      createdAt: now,

      checkStatus: "not_checked",

      lastCheckMessage:
        "This monitor has not been checked yet.",

      isDemo: true,
    };

    setMonitors((previous) => [
      newMonitor,
      ...previous,
    ]);

    return newMonitor;
  };

  /* -------------------------------------------------------
     Delete monitor
  ------------------------------------------------------- */

  const deleteMonitor = (id: string): void => {
    setMonitors((previous) =>
      previous.filter((monitor) => monitor.id !== id)
    );

    setChanges((previous) =>
      previous.filter((change) => change.monitorId !== id)
    );
  };

  /* -------------------------------------------------------
     Toggle monitor
  ------------------------------------------------------- */

  const toggleMonitorStatus = (id: string): void => {
    setMonitors((previous) =>
      previous.map((monitor) => {
        if (monitor.id !== id) {
          return monitor;
        }

        const nextStatus: MonitorStatus =
          monitor.status === "active"
            ? "paused"
            : "active";

        return {
          ...monitor,
          status: nextStatus,
          lastCheckMessage:
            nextStatus === "paused"
              ? "Monitoring is paused."
              : "Monitoring is active.",
        };
      })
    );
  };

  /* -------------------------------------------------------
     Check monitor

     IMPORTANT:
     This function intentionally does NOT claim to perform
     real web scraping.

     Until the secure backend monitoring engine exists,
     the UI receives a controlled demo result.
  ------------------------------------------------------- */

  const checkMonitor = async (
    id: string
  ): Promise<CheckMonitorResult> => {
    const monitor = monitors.find(
      (item) => item.id === id
    );

    if (!monitor) {
      return {
        success: false,
        status: "failed",
        message: "Monitor not found.",
        monitorId: id,
      };
    }

    if (monitor.status === "paused") {
      return {
        success: false,
        status: "failed",
        message:
          "This monitor is paused. Resume it before checking.",
        monitorId: id,
      };
    }

    /* Set checking state first */
    setMonitors((previous) =>
      previous.map((item) =>
        item.id === id
          ? {
              ...item,
              checkStatus: "checking",
              lastCheckMessage:
                "Checking demo monitoring state…",
            }
          : item
      )
    );

    /* Small delay to make the UI state realistic */
    await new Promise((resolve) =>
      setTimeout(resolve, 500)
    );

    const now = new Date().toISOString();

    /*
      Demo behavior:
      We intentionally return a "completed" demo check
      instead of calling /api/scrape.

      Real scraping will be implemented later through
      a secure server-side monitoring service.
    */

    const demoValue =
      monitor.lastValue &&
      monitor.lastValue !== "Awaiting first check"
        ? monitor.lastValue
        : getDemoValue(monitor.monitorType);

    setMonitors((previous) =>
      previous.map((item) =>
        item.id === id
          ? {
              ...item,
              lastChecked: now,
              lastValue: demoValue,
              checkSource: "Demo source",
              checkStatus: "completed",
              lastCheckMessage:
                "Demo check completed. No live website verification was performed.",
            }
          : item
      )
    );

    return {
      success: true,
      status: "completed",
      message:
        "Demo check completed. No live website verification was performed.",
      monitorId: id,
      value: demoValue,
      source: "Demo source",
      changeDetected: false,
    };
  };

  /* -------------------------------------------------------
     Get monitor
  ------------------------------------------------------- */

  const getMonitor = (
    id: string
  ): Monitor | undefined => {
    return monitors.find(
      (monitor) => monitor.id === id
    );
  };

  /* -------------------------------------------------------
     Get monitor changes
  ------------------------------------------------------- */

  const getMonitorChanges = (
    monitorId: string
  ): Change[] => {
    return changes.filter(
      (change) => change.monitorId === monitorId
    );
  };

  /* -------------------------------------------------------
     Remove change
  ------------------------------------------------------- */

  const removeChange = (id: string): void => {
    setChanges((previous) =>
      previous.filter((change) => change.id !== id)
    );
  };

  /* -------------------------------------------------------
     Reset demo data
  ------------------------------------------------------- */

  const resetDemoData = (): void => {
    setMonitors(INITIAL_MONITORS);
    setChanges(INITIAL_CHANGES);

    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(
          STORAGE_KEYS.monitors
        );

        window.localStorage.removeItem(
          STORAGE_KEYS.changes
        );
      } catch {
        // Ignore storage errors.
      }
    }
  };

  /* -------------------------------------------------------
     Derived statistics
  ------------------------------------------------------- */

  const stats = useMemo(() => {
    const activeMonitors = monitors.filter(
      (monitor) => monitor.status === "active"
    ).length;

    const pausedMonitors = monitors.filter(
      (monitor) => monitor.status === "paused"
    ).length;

    const highSeverityChanges = changes.filter(
      (change) => change.severity === "High"
    ).length;

    return {
      totalMonitors: monitors.length,
      activeMonitors,
      pausedMonitors,
      totalChanges: changes.length,
      highSeverityChanges,
    };
  }, [monitors, changes]);

  return {
    monitors,
    changes,

    stats,

    addMonitor,
    deleteMonitor,
    toggleMonitorStatus,

    checkMonitor,

    getMonitor,
    getMonitorChanges,

    removeChange,
    resetDemoData,
  };
}

/* =========================================================
   Context
========================================================= */

type DemoDataContextValue = ReturnType<
  typeof useProvideDemoData
>;

const DemoDataContext =
  createContext<DemoDataContextValue | null>(null);

/* =========================================================
   Provider
========================================================= */

export function DemoDataProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const data = useProvideDemoData();

  return (
    <DemoDataContext.Provider value={data}>
      {children}
    </DemoDataContext.Provider>
  );
}

/* =========================================================
   Hook
========================================================= */

export function useDemoData(): DemoDataContextValue {
  const context = useContext(DemoDataContext);

  if (!context) {
    throw new Error(
      "useDemoData must be used inside DemoDataProvider."
    );
  }

  return context;
}

/* =========================================================
   Demo Value Generator
========================================================= */

function getDemoValue(
  monitorType: MonitorType
): string {
  switch (monitorType) {
    case "Product Price":
      return "9,990 DH";

    case "Product Availability":
      return "In stock";

    case "Product Catalog":
      return "42 products";

    case "Website Content":
      return "Homepage snapshot";

    default:
      return "Demo value";
  }
}

/* =========================================================
   Formatting Utilities
========================================================= */

export function formatDate(
  dateString: string | null | undefined
): string {
  if (!dateString) {
    return "Never";
  }

  try {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return "Invalid date";
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "Invalid date";
  }
}

export function formatDateTime(
  dateString: string | null | undefined
): string {
  if (!dateString) {
    return "Never";
  }

  try {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return "Invalid date";
    }

    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Invalid date";
  }
}

export function getTimeAgo(
  dateString: string | null | undefined
): string {
  if (!dateString) {
    return "Never";
  }

  try {
    const timestamp = new Date(
      dateString
    ).getTime();

    if (Number.isNaN(timestamp)) {
      return "Unknown";
    }

    const diff = Math.max(
      0,
      Date.now() - timestamp
    );

    const minutes = Math.floor(
      diff / 60000
    );

    if (minutes < 1) {
      return "Just now";
    }

    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    const hours = Math.floor(
      minutes / 60
    );

    if (hours < 24) {
      return `${hours}h ago`;
    }

    const days = Math.floor(
      hours / 24
    );

    if (days < 30) {
      return `${days}d ago`;
    }

    const months = Math.floor(
      days / 30
    );

    if (months < 12) {
      return `${months}mo ago`;
    }

    const years = Math.floor(
      months / 12
    );

    return `${years}y ago`;
  } catch {
    return "Unknown";
  }
}

/* =========================================================
   Display Helpers
========================================================= */

export function getMonitorTypeLabel(
  monitorType: MonitorType
): string {
  return monitorType;
}

export function getSeverityLabel(
  severity: Severity
): string {
  return severity;
}

export function getCheckStatusLabel(
  status: CheckStatus
): string {
  switch (status) {
    case "not_checked":
      return "Not checked";

    case "checking":
      return "Checking";

    case "completed":
      return "Completed";

    case "blocked":
      return "Source blocked";

    case "failed":
      return "Unable to verify";

    default:
      return "Unknown";
  }
}

export function getChangeTypeLabel(
  changeType: ChangeType
): string {
  switch (changeType) {
    case "price":
      return "Price";

    case "availability":
      return "Availability";

    case "catalog":
      return "Catalog";

    case "content":
      return "Content";

    default:
      return "Change";
  }
}
