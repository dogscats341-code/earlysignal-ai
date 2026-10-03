import { useEffect, useState } from 'react';

export type MonitorStatus = 'active' | 'paused';
export type MonitorType = 'Product Price' | 'Product Availability' | 'Product Catalog' | 'Website Content';
export type Severity = 'High' | 'Medium' | 'Low';

export interface Monitor {
  id: string;
  name: string;
  websiteUrl: string;
  monitorType: MonitorType;
  status: MonitorStatus;
  lastChecked: string;
  lastValue?: string;
  checkSource: string;
  createdAt: string;
}

export interface Change {
  id: string;
  monitorId: string;
  title: string;
  description: string;
  oldValue: string;
  newValue: string;
  severity: Severity;
  dataSource: string;
  detectedAt: string;
}

const INITIAL_MONITORS: Monitor[] = [
  {
    id: 'mon-1',
    name: 'Jumia Morocco - iPhone 15',
    websiteUrl: 'https://www.jumia.ma',
    monitorType: 'Product Price',
    status: 'active',
    lastChecked: new Date().toISOString(),
    lastValue: '11,499 DH',
    checkSource: 'jumia.ma Live',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'mon-2',
    name: 'Iris.ma - Gaming Laptop',
    websiteUrl: 'https://www.iris.ma',
    monitorType: 'Product Price',
    status: 'active',
    lastChecked: new Date().toISOString(),
    lastValue: '8,990 DH',
    checkSource: 'iris.ma Live',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

const INITIAL_CHANGES: Change[] = [
  {
    id: 'chg-1',
    monitorId: 'mon-1',
    title: 'Price decreased by 5%',
    description: 'Product price dropped from 12,099 DH to 11,499 DH on Jumia.',
    oldValue: '12,099 DH',
    newValue: '11,499 DH',
    severity: 'High',
    dataSource: 'jumia.ma Live',
    detectedAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
  },
];

export function useDemoData() {
  const [monitors, setMonitors] = useState<Monitor[]>(() => {
    const saved = localStorage.getItem('earlysignal_monitors');
    return saved ? JSON.parse(saved) : INITIAL_MONITORS;
  });

  const [changes, setChanges] = useState<Change[]>(() => {
    const saved = localStorage.getItem('earlysignal_changes');
    return saved ? JSON.parse(saved) : INITIAL_CHANGES;
  });

  useEffect(() => {
    localStorage.setItem('earlysignal_monitors', JSON.stringify(monitors));
  }, [monitors]);

  useEffect(() => {
    localStorage.setItem('earlysignal_changes', JSON.stringify(changes));
  }, [changes]);

  const addMonitor = async (data: { name: string; websiteUrl: string; monitorType: MonitorType }): Promise<Monitor> => {
    let hostname = 'website';
    try {
      hostname = new URL(data.websiteUrl).hostname.replace('www.', '');
    } catch {}

    const newMonitor: Monitor = {
      id: `mon-${Date.now()}`,
      name: data.name,
      websiteUrl: data.websiteUrl,
      monitorType: data.monitorType,
      status: 'active',
      lastChecked: new Date().toISOString(),
      lastValue: 'Pending check',
      checkSource: `${hostname} Live`,
      createdAt: new Date().toISOString(),
    };

    setMonitors((prev) => [newMonitor, ...prev]);
    return newMonitor;
  };

  const toggleMonitorStatus = (id: string) => {
    setMonitors((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: m.status === 'active' ? 'paused' : 'active' } : m))
    );
  };

  const checkMonitor = async (id: string): Promise<{ success: boolean; message: string }> => {
    const monitor = monitors.find((m) => m.id === id);
    if (!monitor) return { success: false, message: 'Monitor not found' };

    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: monitor.websiteUrl }),
      });

      const json = await res.json();

      if (!json.success) {
        return {
          success: false,
          message: json.data?.price === 'BLOCKED' ? 'Target website blocked request' : 'Could not extract price',
        };
      }

      const fetchedPrice = json.data.price;
      const oldPrice = monitor.lastValue || 'N/A';
      const now = new Date().toISOString();

      // تسجيل تغيّر جديد إذا اختلف السعر عن السعر السابق
      if (fetchedPrice && fetchedPrice !== oldPrice && oldPrice !== 'Pending check') {
        const newChange: Change = {
          id: `chg-${Date.now()}`,
          monitorId: monitor.id,
          title: `Price updated: ${fetchedPrice}`,
          description: `Price detected as ${fetchedPrice} (was ${oldPrice}) on ${json.data.hostname || monitor.name}`,
          oldValue: oldPrice,
          newValue: fetchedPrice,
          severity: 'High',
          dataSource: json.data.source || monitor.checkSource,
          detectedAt: now,
        };
        setChanges((prev) => [newChange, ...prev]);
      }

      // تحديث بيانات المراقب
      setMonitors((prev) =>
        prev.map((m) =>
          m.id === id
            ? {
                ...m,
                lastValue: fetchedPrice,
                lastChecked: now,
                checkSource: json.data.source || m.checkSource,
              }
            : m
        )
      );

      return { success: true, message: `Live check complete. Price: ${fetchedPrice}` };
    } catch {
      return { success: false, message: 'Failed to communicate with scrape engine' };
    }
  };

  const getMonitor = (id: string) => monitors.find((m) => m.id === id);

  return {
    monitors,
    changes,
    addMonitor,
    toggleMonitorStatus,
    checkMonitor,
    getMonitor,
  };
}

export function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string): string {
  try {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export function getTimeAgo(dateString: string): string {
  try {
    const diff = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return dateString;
  }
}
