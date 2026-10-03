import React, { createContext, useContext, useEffect, useState } from 'react';

export type MonitorStatus = 'active' | 'paused';
export type MonitorType = 'Product Price' | 'Product Availability' | 'Product Catalog' | 'Website Content';
export type Severity = 'High' | 'Medium' | 'Low';

export interface CatalogItem {
  title: string;
  url: string;
  price?: string;
}

export interface Monitor {
  id: string;
  name: string;
  websiteUrl: string;
  monitorType: MonitorType;
  status: MonitorStatus;
  lastChecked: string;
  lastValue?: string;
  originalPrice?: string;
  discount?: string;
  availability?: string;
  catalogItems?: CatalogItem[];
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
    name: 'Amazon Trendy Store - Top',
    websiteUrl: 'https://www.amazon.com/dp/B0BW8ZFMDJ',
    monitorType: 'Product Price',
    status: 'active',
    lastChecked: new Date().toISOString(),
    lastValue: '$5.59',
    originalPrice: '$14.99',
    discount: '-63%',
    checkSource: 'amazon.com Live',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

const INITIAL_CHANGES: Change[] = [
  {
    id: 'chg-1',
    monitorId: 'mon-1',
    title: 'Price dropped by 63%',
    description: 'Special Deal detected: Price decreased from $14.99 to $5.59 (-63% discount).',
    oldValue: '$14.99',
    newValue: '$5.59 (-63%)',
    severity: 'High',
    dataSource: 'amazon.com Live',
    detectedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
];

function useProvideDemoData() {
  const [monitors, setMonitors] = useState<Monitor[]>(() => {
    try {
      const saved = localStorage.getItem('earlysignal_monitors');
      return saved ? JSON.parse(saved) : INITIAL_MONITORS;
    } catch {
      return INITIAL_MONITORS;
    }
  });

  const [changes, setChanges] = useState<Change[]>(() => {
    try {
      const saved = localStorage.getItem('earlysignal_changes');
      return saved ? JSON.parse(saved) : INITIAL_CHANGES;
    } catch {
      return INITIAL_CHANGES;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('earlysignal_monitors', JSON.stringify(monitors));
    } catch {}
  }, [monitors]);

  useEffect(() => {
    try {
      localStorage.setItem('earlysignal_changes', JSON.stringify(changes));
    } catch {}
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
        body: JSON.stringify({ url: monitor.websiteUrl, monitorType: monitor.monitorType }),
      });

      const json = await res.json();

      if (!json.success) {
        return {
          success: false,
          message: json.data?.price === 'BLOCKED' ? 'Target website blocked request' : 'Could not extract price',
        };
      }

      const fetchedData = json.data;
      const now = new Date().toISOString();
      const oldPrice = monitor.lastValue || 'N/A';

      // 1. تسجيل التغيير عند اكتشاف تخفيض أو سعر جديد
      if (fetchedData.price && fetchedData.price !== oldPrice && oldPrice !== 'Pending check') {
        const titleText = fetchedData.discount
          ? `Price dropped: ${fetchedData.price} (${fetchedData.discount})`
          : `Price updated: ${fetchedData.price}`;

        const descText = fetchedData.originalPrice
          ? `Product price updated to ${fetchedData.price} (List price was ${fetchedData.originalPrice}).`
          : `Detected new price ${fetchedData.price} on ${fetchedData.hostname}.`;

        const newChange: Change = {
          id: `chg-${Date.now()}`,
          monitorId: monitor.id,
          title: titleText,
          description: descText,
          oldValue: monitor.originalPrice || oldPrice,
          newValue: fetchedData.discount ? `${fetchedData.price} (${fetchedData.discount})` : fetchedData.price,
          severity: 'High',
          dataSource: fetchedData.source || monitor.checkSource,
          detectedAt: now,
        };
        setChanges((prev) => [newChange, ...prev]);
      }

      // 2. تحديث المونيتور بالمعلومات الكاملة (السعر الجديد والقديم والخصم والكتالوج)
      setMonitors((prev) =>
        prev.map((m) =>
          m.id === id
            ? {
                ...m,
                lastValue: fetchedData.price,
                originalPrice: fetchedData.originalPrice || m.originalPrice,
                discount: fetchedData.discount || m.discount,
                availability: fetchedData.availability || m.availability,
                catalogItems: fetchedData.catalogItems || m.catalogItems,
                lastChecked: now,
                checkSource: fetchedData.source || m.checkSource,
              }
            : m
        )
      );

      return {
        success: true,
        message: fetchedData.discount
          ? `Live check complete: ${fetchedData.price} (${fetchedData.discount} discount from ${fetchedData.originalPrice})`
          : `Live check complete: ${fetchedData.price}`,
      };
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

const DemoDataContext = createContext<ReturnType<typeof useProvideDemoData> | null>(null);

export function DemoDataProvider({ children }: { children: React.ReactNode }) {
  const data = useProvideDemoData();
  return React.createElement(DemoDataContext.Provider, { value: data }, children);
}

export function useDemoData() {
  const context = useContext(DemoDataContext);
  if (!context) {
    return useProvideDemoData();
  }
  return context;
}

export function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string): string {
  try {
    return new Date(dateString).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
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
