import React, { useState } from 'react';
import { Link, useRoute } from 'wouter';
import { useDemoData, formatDate, formatDateTime, getTimeAgo, Monitor } from '@/lib/demo-data';
import {
  AppShell,
  DataSourceBadge,
  DemoBadge,
  EmptyState,
  PageIntro,
  SeverityBadge,
  StatusBadge,
} from '@/components/earlysignal-shell';

// Helper function to truncate long URLs cleanly for display
function formatDisplayUrl(url: string, maxLength: number = 42): string {
  try {
    const parsed = new URL(url);
    const clean = `${parsed.hostname}${parsed.pathname}`;
    if (clean.length > maxLength) {
      return `${clean.substring(0, maxLength)}...`;
    }
    return clean;
  } catch {
    return url.length > maxLength ? `${url.substring(0, maxLength)}...` : url;
  }
}

export function LandingPage() {
  return (
    <AppShell>
      <div className="landing-hero">
        <DemoBadge label="Live Monitor Engine v2.0" />
        <h1>Automated E-commerce & Price Monitoring</h1>
        <p>Track price drops, stock updates, and page changes in real-time with instant alerts.</p>
        <div style={{ marginTop: 24 }}>
          <Link href="/dashboard" className="btn btn-primary">
            Launch Dashboard →
          </Link>
        </div>
      </div>
    </AppShell>
  );
}

export function DashboardPage() {
  const { monitors, changes } = useDemoData();
  const activeMonitors = monitors.filter((m) => m.status === 'active').length;

  return (
    <AppShell>
      <PageIntro
        eyebrow="Workspace / Overview"
        title="Dashboard"
        description="Real-time activity and health status of all tracked products."
      />

      <div className="stats-grid" style={{ marginTop: 20 }}>
        <div className="card card-pad">
          <div className="stat-label">Active Monitors</div>
          <div className="stat-value">{activeMonitors}</div>
        </div>
        <div className="card card-pad">
          <div className="stat-label">Total Monitors</div>
          <div className="stat-value">{monitors.length}</div>
        </div>
        <div className="card card-pad">
          <div className="stat-label">Detected Changes</div>
          <div className="stat-value">{changes.length}</div>
        </div>
      </div>

      <div className="card card-pad" style={{ marginTop: 24 }}>
        <div className="section-heading" style={{ marginBottom: 16 }}>
          <h2>Monitored Items</h2>
          <Link href="/monitors/new" className="btn btn-primary btn-sm">
            + Add Monitor
          </Link>
        </div>
        {monitors.length === 0 ? (
          <EmptyState title="No monitors yet" copy="Add your first URL to start checking prices in real time." />
        ) : (
          <div className="monitor-list">
            {monitors.map((m) => (
              <div key={m.id} className="monitor-row">
                <div>
                  <Link href={`/monitors/${m.id}`} className="font-semibold">
                    {m.name}
                  </Link>
                  <div className="text-sm text-muted" style={{ wordBreak: 'break-all' }}>
                    {formatDisplayUrl(m.websiteUrl)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span className="badge">{m.lastValue || 'Pending'}</span>
                  <StatusBadge status={m.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export function MonitorsPage() {
  const { monitors } = useDemoData();

  return (
    <AppShell>
      <PageIntro
        eyebrow="Workspace / Monitors"
        title="Monitors"
        description="Manage and trigger live checks across all configured monitors."
      >
        <Link href="/monitors/new" className="btn btn-primary">
          + Add Monitor
        </Link>
      </PageIntro>

      <div className="card card-pad" style={{ marginTop: 20 }}>
        {monitors.map((m) => (
          <div key={m.id} className="monitor-row">
            <div>
              <Link href={`/monitors/${m.id}`} className="font-semibold">
                {m.name}
              </Link>
              <div className="text-sm text-muted">{formatDisplayUrl(m.websiteUrl)}</div>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <DataSourceBadge source={m.checkSource} />
              <StatusBadge status={m.status} />
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}

export function NewMonitorPage() {
  const { addMonitor } = useDemoData();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !url) return;
    setLoading(true);
    await addMonitor({ name, websiteUrl: url, monitorType: 'Product Price' });
    setLoading(false);
    window.location.href = '/monitors';
  };

  return (
    <AppShell>
      <PageIntro eyebrow="Monitors / New" title="Create Monitor" description="Set up real-time tracking for any e-commerce product URL." />
      <form onSubmit={handleSubmit} className="card card-pad" style={{ marginTop: 20, maxWidth: 600 }}>
        <div className="form-group">
          <label>Monitor Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Etsy T-Shirt / Amazon Item" required />
        </div>
        <div className="form-group" style={{ marginTop: 16 }}>
          <label>Target URL</label>
          <input className="input" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.etsy.com/listing/..." required />
        </div>
        <button type="submit" className="btn btn-primary" style={{ marginTop: 20 }} disabled={loading}>
          {loading ? 'Creating...' : 'Create & Start Monitoring'}
        </button>
      </form>
    </AppShell>
  );
}

export function MonitorDetailPage() {
  const [, params] = useRoute('/monitors/:id');
  const { getMonitor, checkMonitor, toggleMonitorStatus, changes } = useDemoData();
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<string | null>(null);

  const monitor = params?.id ? getMonitor(params.id) : null;

  if (!monitor) {
    return (
      <AppShell>
        <div className="card card-pad">Monitor not found.</div>
      </AppShell>
    );
  }

  const monitorChanges = changes.filter((c) => c.monitorId === monitor.id);

  const handleLiveCheck = async () => {
    setChecking(true);
    setCheckResult(null);
    const res = await checkMonitor(monitor.id);
    setChecking(false);
    setCheckResult(res.message);
  };

  return (
    <AppShell>
      <PageIntro eyebrow="Monitors / Detail" title={monitor.name} description={`Monitoring target on ${monitor.checkSource}`}>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleLiveCheck} className="btn btn-primary" disabled={checking}>
            {checking ? 'Checking Live...' : '🔄 Check now (Live)'}
          </button>
          <button onClick={() => toggleMonitorStatus(monitor.id)} className="btn btn-secondary">
            {monitor.status === 'active' ? '⏸ Pause' : '▶ Resume'}
          </button>
        </div>
      </PageIntro>

      {/* Shortened URL Container */}
      <div style={{ marginTop: 12, marginBottom: 16 }}>
        <a href={monitor.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-muted" style={{ wordBreak: 'break-all' }}>
          🔗 {formatDisplayUrl(monitor.websiteUrl, 55)}
        </a>
      </div>

      {checkResult && (
        <div className={`card card-pad ${checkResult.includes('complete') ? 'bg-success' : 'bg-error'}`} style={{ marginBottom: 20 }}>
          {checkResult}
        </div>
      )}

      <div className="card card-pad">
        <h2>Live Change History ({monitorChanges.length})</h2>
        {monitorChanges.length === 0 ? (
          <EmptyState title="No changes yet" copy="Run a live check or wait for the system to detect price updates." />
        ) : (
          monitorChanges.map((c) => (
            <div key={c.id} className="change-row" style={{ marginTop: 12 }}>
              <div>
                <strong>{c.title}</strong>
                <p className="text-sm text-muted">{c.description}</p>
              </div>
              <SeverityBadge severity={c.severity} />
            </div>
          ))
        )        }
      </div>
    </AppShell>
  );
}

export function ChangeDetailPage() {
  const [, params] = useRoute('/changes/:id');
  const { changes } = useDemoData();
  const change = changes.find((c) => c.id === params?.id);

  if (!change) {
    return (
      <AppShell>
        <div className="card card-pad">Change record not found.</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageIntro eyebrow="Signals / Detail" title={change.title} description={change.description} />
      <div className="card card-pad" style={{ marginTop: 20 }}>
        <div>Old Value: {change.oldValue}</div>
        <div>New Value: {change.newValue}</div>
        <div>Detected At: {formatDateTime(change.detectedAt)}</div>
      </div>
    </AppShell>
  );
}

export function AlertsPage() {
  const { changes } = useDemoData();
  return (
    <AppShell>
      <PageIntro eyebrow="Workspace / Alerts" title="All System Alerts" description="Feed of detected price updates across all monitors." />
      <div className="card card-pad" style={{ marginTop: 20 }}>
        {changes.map((c) => (
          <div key={c.id} className="change-row">
            <div>{c.title}</div>
            <SeverityBadge severity={c.severity} />
          </div>
        ))}
      </div>
    </AppShell>
  );
}

export function NotFoundPage() {
  return (
    <AppShell>
      <div className="card card-pad">404 - Page Not Found</div>
    </AppShell>
  );
}
