import React, { createContext, useContext, useEffect, useState } from 'react';

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

// ✂️ دالة اختصار وتنظيف الروابط الذكية
export function cleanAndShortenUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl.trim());
    const hostname = parsed.hostname.toLowerCase();

    // 1. اختصار روابط أمازون (استخراج معرّف المنتج ASIN فقط)
    if (hostname.includes('amazon')) {
      const asinMatch = parsed.pathname.match(/\/(dp|gp\/product)\/([A-Z0-9]{10})/i);
      if (asinMatch && asinMatch[2]) {
        return `https://${parsed.hostname}/dp/${asinMatch[2]}`;
      }
    }

    // 2. اختصار روابط Etsy (حذف معلمات التتبع وإبقاء معرف المنتج)
    if (hostname.includes('etsy')) {
      const etsyMatch = parsed.pathname.match(/\/listing\/(\d+)/i);
      if (etsyMatch && etsyMatch[1]) {
        return `https://${parsed.hostname}/listing/${etsyMatch[1]}`;
      }
      return `${parsed.origin}${parsed.pathname}`;
    }

    // 3. تنظيف أي رابط آخر من معلمات التتبع الطويلة (UTM, Ref, Context)
    const cleanParams = new URLSearchParams();
    parsed.searchParams.forEach((value, key) => {
      if (!key.startsWith('utm_') && !key.startsWith('ref') && !key.includes('click') && !key.includes('fbclid')) {
        cleanParams.append(key, value);
      }
    });

    const queryString = cleanParams.toString();
    return `${parsed.origin}${parsed.pathname}${queryString ? '?' + queryString : ''}`;
  } catch {
    return rawUrl;
  }
}

const INITIAL_MONITORS: Monitor[] = [
  {
    id: 'mon-1',
    name: 'Jumia Morocco - iPhone 15',
    websiteUrl: 'https://www.jumia.ma/iphone-15.html',
    monitorType: 'Product Price',
    status: 'active',
    lastChecked: new Date().toISOString(),
    lastValue: '11,499 DH',
    checkSource: 'jumia.ma Live',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

const INITIAL_CHANGES: Change[] = [];

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

  // إضافة المراقبة مع اختصار الرابط تلقائياً
  const addMonitor = async (data: { name: string; websiteUrl: string; monitorType: MonitorType }): Promise<Monitor> => {
    // تطبيق عملية الاختصار التلقائية
    const shortenedUrl = cleanAndShortenUrl(data.websiteUrl);

    let hostname = 'website';
    try {
      hostname = new URL(shortenedUrl).hostname.replace('www.', '');
    } catch {}

    const newMonitor: Monitor = {
      id: `mon-${Date.now()}`,
      name: data.name,
      websiteUrl: shortenedUrl, // حفظ الرابط المختصر النظيف
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

const DemoDataContext = createContext<ReturnType<typeof useProvideDemoData> | null>(null);

export function DemoDataProvider({ children }: { children: React.ReactNode }) {
  const data = useProvideDemoData();
  return <DemoDataContext.Provider value={data}>{children}</DemoDataContext.Provider>;
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
