import React, { useState } from 'react';
import { Link, useLocation, useParams } from 'wouter';
import {
  AppShell,
  DataSourceBadge,
  EmptyState,
  DemoBadge,
  PageIntro,
  SeverityBadge,
  StatusBadge,
} from '@/components/earlysignal-shell';
import {
  formatDate,
  formatDateTime,
  getTimeAgo,
  useDemoData,
  Monitor,
  Change,
} from '@/lib/demo-data';

// --- Auxiliary Components ---
function SignalRow({ change, monitor }: { change: Change; monitor?: Monitor }) {
  return (
    <div className="signal-row" style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="signal-main">
        <div className="signal-header" style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
          <span className="signal-title" style={{ fontWeight: 600 }}>{change.title}</span>
          <SeverityBadge level={change.severity} />
          <DataSourceBadge label={change.dataSource} />
        </div>
        <p className="signal-desc" style={{ color: '#aaa', fontSize: 14, margin: '4px 0' }}>{change.description}</p>
        <div className="signal-meta" style={{ fontSize: 12, color: '#777' }}>
          <span>Detected {getTimeAgo(change.detectedAt)}</span>
          {monitor && <span> • {monitor.name}</span>}
        </div>
      </div>
      <Link href={`/changes/${change.id}`} className="btn btn-secondary btn-sm" style={{ marginTop: 8, display: 'inline-block' }}>
        View details
      </Link>
    </div>
  );
}

// --- Landing Page ---
export function LandingPage() {
  return (
    <AppShell>
      <div className="hero-section" style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div className="badge-pill" style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 16, background: 'rgba(16,185,129,0.15)', color: '#10b981', fontSize: 13, marginBottom: 16 }}>
          🟢 LIVE SCRAPE ENGINE ACTIVE
        </div>
        <h1 style={{ fontSize: 36, marginBottom: 16 }}>Automated E-commerce & Price Monitoring</h1>
        <p className="hero-sub" style={{ color: '#aaa', maxWidth: 600, margin: '0 auto 24px' }}>
          Track price drops, stock updates, and page changes in real-time with instant live scraper alerts.
        </p>
        <div className="hero-actions" style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link href="/dashboard" className="btn btn-primary btn-lg">
            Launch Dashboard →
          </Link>
          <Link href="/monitors" className="btn btn-secondary btn-lg">
            View All Monitors
          </Link>
        </div>
      </div>
    </AppShell>
  );
}

// --- Dashboard Page ---
export function DashboardPage() {
  const { monitors, changes } = useDemoData();
  const activeMonitors = monitors.filter((m) => m.status === 'active');

  return (
    <AppShell>
      <PageIntro
        eyebrow="Workspace / Dashboard"
        title="Real-Time Price Intelligence"
        description="Overview of your active e-commerce monitors and recent detected price signals."
      />

      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginTop: 24 }}>
        <div className="card card-pad" style={{ padding: 16 }}>
          <span style={{ fontSize: 13, color: '#888' }}>Total Monitors</span>
          <div style={{ fontSize: 28, fontWeight: 700, margin: '4px 0' }}>{monitors.length}</div>
          <span style={{ fontSize: 12, color: '#10b981' }}>{activeMonitors.length} active now</span>
        </div>
        <div className="card card-pad" style={{ padding: 16 }}>
          <span style={{ fontSize: 13, color: '#888' }}>Detected Signals</span>
          <div style={{ fontSize: 28, fontWeight: 700, margin: '4px 0' }}>{changes.length}</div>
          <span style={{ fontSize: 12, color: '#aaa' }}>Price updates logged</span>
        </div>
        <div className="card card-pad" style={{ padding: 16 }}>
          <span style={{ fontSize: 13, color: '#888' }}>Engine Status</span>
          <div style={{ fontSize: 28, fontWeight: 700, margin: '4px 0', color: '#10b981' }}>Live</div>
          <span style={{ fontSize: 12, color: '#aaa' }}>Vercel Scraper API Ready</span>
        </div>
      </div>

      <div className="card card-pad" style={{ marginTop: 28, padding: 20 }}>
        <div className="section-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2>Recent Live Signals ({changes.length})</h2>
          <Link href="/alerts" className="btn btn-secondary btn-sm">View all alerts</Link>
        </div>
        {changes.length === 0 ? (
          <EmptyState title="No changes detected yet" copy="When prices update, live alerts will appear here." />
        ) : (
          <div className="signal-list">
            {changes.map((c) => (
              <SignalRow key={c.id} change={c} monitor={monitors.find((m) => m.id === c.monitorId)} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

// --- Monitors List Page ---
export function MonitorsPage() {
  const { monitors, checkMonitor, toggleMonitorStatus } = useDemoData();
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ id: string; text: string; isError?: boolean } | null>(null);

  const handleCheck = async (id: string) => {
    setCheckingId(id);
    setMessage(null);
    const res = await checkMonitor(id);
    setCheckingId(null);
    setMessage({ id, text: res.message, isError: !res.success });
  };

  return (
    <AppShell>
      <div className="page-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <PageIntro
          eyebrow="Workspace / Monitors"
          title="Monitored Targets"
          description="Manage your price tracking targets and trigger instant live scrape checks."
        />
        <Link href="/monitors/new" className="btn btn-primary">
          + Add Monitor
        </Link>
      </div>

      <div className="monitor-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20, marginTop: 24 }}>
        {monitors.length === 0 ? (
          <EmptyState title="No monitors yet" copy="Add your first product URL to start live price tracking." />
        ) : (
          monitors.map((m) => (
            <div key={m.id} className="card card-pad monitor-card" style={{ padding: 20 }}>
              <div className="badge-group" style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <StatusBadge status={m.status} />
                <DataSourceBadge label={m.checkSource} />
              </div>
              
              <h3 style={{ fontSize: 18, margin: '4px 0' }}>
                <Link href={`/monitors/${m.id}`}>{m.name}</Link>
              </h3>
              
              <a href={m.websiteUrl} target="_blank" rel="noreferrer" className="monitor-url" style={{ fontSize: 13, color: '#3b82f6', wordBreak: 'break-all', display: 'block', marginBottom: 16 }}>
                🔗 {m.websiteUrl}
              </a>

              <div className="metric-row" style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8, marginBottom: 16 }}>
                <div>
                  <span style={{ fontSize: 11, color: '#888', display: 'block' }}>CURRENT VALUE</span>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#10b981' }}>{m.lastValue || 'Pending check'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 11, color: '#888', display: 'block' }}>LAST CHECKED</span>
                  <div style={{ fontSize: 13, color: '#ccc' }}>{getTimeAgo(m.lastChecked)}</div>
                </div>
              </div>

              {message && message.id === m.id && (
                <div style={{ padding: 8, borderRadius: 6, fontSize: 13, marginBottom: 12, backgroundColor: message.isError ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)', color: message.isError ? '#fca5a5' : '#6ee7b7' }}>
                  {message.text}
                </div>
              )}

              <div className="card-actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  disabled={checkingId === m.id}
                  onClick={() => handleCheck(m.id)}
                  className="btn btn-primary btn-sm"
                >
                  {checkingId === m.id ? 'Scraping Live...' : 'Check Now (Live)'}
                </button>
                <button
                  onClick={() => toggleMonitorStatus(m.id)}
                  className="btn btn-secondary btn-sm"
                >
                  {m.status === 'active' ? 'Pause' : 'Activate'}
                </button>
                <Link href={`/monitors/${m.id}`} className="btn btn-secondary btn-sm">
                  Details →
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </AppShell>
  );
}

// --- New Monitor Page ---
export function NewMonitorPage() {
  const { addMonitor } = useDemoData();
  const [, setLocation] = useLocation();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState<'Product Price' | 'Product Availability' | 'Product Catalog' | 'Website Content'>('Product Price');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true);
    const newMon = await addMonitor({
      name: name || new URL(url).hostname,
      websiteUrl: url,
      monitorType: type,
    });
    setLoading(false);
    setLocation(`/monitors/${newMon.id}`);
  };

  return (
    <AppShell>
      <PageIntro
        eyebrow="Monitors / New"
        title="Add Target to Monitor"
        description="Paste any product page URL to start live price tracking."
      />

      <div className="card card-pad" style={{ marginTop: 24, maxWidth: 600, padding: 24 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14 }}>Target Name / Title</label>
            <input
              type="text"
              placeholder="e.g. Jumia Morocco / Amazon France Product"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.15)', background: '#111', color: '#fff' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14 }}>Target Product URL *</label>
            <input
              type="url"
              required
              placeholder="https://www.jumia.ma/product or https://www.amazon.fr/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.15)', background: '#111', color: '#fff' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14 }}>Monitor Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.15)', background: '#111', color: '#fff' }}
            >
              <option value="Product Price">Product Price</option>
              <option value="Product Availability">Product Availability</option>
              <option value="Website Content">Website Content</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Adding...' : 'Start Monitoring Target'}
            </button>
            <Link href="/monitors" className="btn btn-secondary">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

// --- Monitor Detail Page (Restored Action Buttons) ---
export function MonitorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { getMonitor, checkMonitor, toggleMonitorStatus, changes } = useDemoData();
  const monitor = getMonitor(id || '');

  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; isError?: boolean } | null>(null);

  if (!monitor) {
    return (
      <AppShell>
        <InvalidState title="Monitor Not Found" copy="The requested target monitor does not exist." href="/monitors" label="Back to Monitors" />
      </AppShell>
    );
  }

  const monitorChanges = changes.filter((c) => c.monitorId === monitor.id);

  const handleLiveCheck = async () => {
    setChecking(true);
    setFeedback(null);
    const res = await checkMonitor(monitor.id);
    setChecking(false);
    setFeedback({ text: res.message, isError: !res.success });
  };

  return (
    <AppShell>
      <div className="breadcrumb" style={{ marginBottom: 12 }}>
        <Link href="/monitors" style={{ color: '#888', textDecoration: 'none' }}>← All monitors</Link>
      </div>

      <div className="card card-pad" style={{ padding: 24 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <StatusBadge status={monitor.status} />
          <DataSourceBadge label={monitor.checkSource} />
        </div>

        <h1 style={{ fontSize: 28, margin: '6px 0' }}>{monitor.name}</h1>
        <a href={monitor.websiteUrl} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', fontSize: 14, wordBreak: 'break-all' }}>
          🔗 {monitor.websiteUrl}
        </a>

        {/* --- RESTORED LIVE ACTION BUTTONS --- */}
        <div style={{ marginTop: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            disabled={checking}
            onClick={handleLiveCheck}
            className="btn btn-primary"
            style={{ padding: '10px 20px', fontWeight: 600 }}
          >
            {checking ? '🔄 Scraping Live...' : '🔄 Check now (Live)'}
          </button>
          <button
            onClick={() => toggleMonitorStatus(monitor.id)}
            className="btn btn-secondary"
            style={{ padding: '10px 20px' }}
          >
            {monitor.status === 'active' ? '⏸ Pause' : '▶ Activate'}
          </button>
        </div>

        {feedback && (
          <div
            style={{
              marginTop: 16,
              padding: '12px 16px',
              borderRadius: 8,
              fontSize: 14,
              backgroundColor: feedback.isError ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              border: `1px solid ${feedback.isError ? '#ef4444' : '#10b981'}`,
              color: feedback.isError ? '#fca5a5' : '#6ee7b7',
            }}
          >
            {feedback.text}
          </div>
        )}
      </div>

      <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        <div className="card card-pad" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>Live Change History ({monitorChanges.length})</h2>
          {monitorChanges.length === 0 ? (
            <EmptyState title="No changes yet" copy="Run a live check to establish baseline or detect price updates." />
          ) : (
            <div className="signal-list">
              {monitorChanges.map((c) => (
                <SignalRow key={c.id} change={c} monitor={monitor} />
              ))}
            </div>
          )}
        </div>

        <div className="card card-pad" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>Monitor Details</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <span style={{ color: '#888', fontSize: 12, display: 'block' }}>LATEST DETECTED VALUE</span>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#10b981' }}>{monitor.lastValue || 'Pending check'}</div>
            </div>
            <div>
              <span style={{ color: '#888', fontSize: 12, display: 'block' }}>LAST CHECKED</span>
              <div style={{ fontSize: 14 }}>{formatDateTime(monitor.lastChecked)} ({getTimeAgo(monitor.lastChecked)})</div>
            </div>
            <div>
              <span style={{ color: '#888', fontSize: 12, display: 'block' }}>MONITOR TYPE</span>
              <div style={{ fontSize: 14 }}>{monitor.monitorType}</div>
            </div>
            <div>
              <span style={{ color: '#888', fontSize: 12, display: 'block' }}>CREATED AT</span>
              <div style={{ fontSize: 14 }}>{formatDate(monitor.createdAt)}</div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

// --- Change Detail Page ---
export function ChangeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { changes, getMonitor } = useDemoData();
  const change = changes.find((c) => c.id === id);

  if (!change) {
    return (
      <AppShell>
        <InvalidState title="Signal Not Found" copy="The requested alert signal could not be found." href="/dashboard" label="Back to Dashboard" />
      </AppShell>
    );
  }

  const monitor = getMonitor(change.monitorId);

  return (
    <AppShell>
      <div className="breadcrumb" style={{ marginBottom: 12 }}>
        <Link href="/alerts" style={{ color: '#888', textDecoration: 'none' }}>← All alerts</Link>
      </div>

      <div className="card card-pad" style={{ padding: 24 }}>
        <div className="badge-group" style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <SeverityBadge level={change.severity} />
          <DataSourceBadge label={change.dataSource} />
        </div>

        <h1 style={{ fontSize: 26, margin: '8px 0' }}>{change.title}</h1>
        <p style={{ color: '#aaa', fontSize: 15 }}>{change.description}</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, margin: '24px 0', padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
          <div>
            <span style={{ fontSize: 12, color: '#888' }}>PREVIOUS VALUE</span>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#ef4444' }}>{change.oldValue}</div>
          </div>
          <div>
            <span style={{ fontSize: 12, color: '#888' }}>NEW DETECTED VALUE</span>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#10b981' }}>{change.newValue}</div>
          </div>
        </div>

        {monitor && (
          <div style={{ paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <h3>Target Monitor</h3>
            <p><strong>{monitor.name}</strong></p>
            <Link href={`/monitors/${monitor.id}`} className="btn btn-secondary btn-sm" style={{ marginTop: 8, display: 'inline-block' }}>
              Go to Monitor Page →
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}

// --- Alerts Page ---
export function AlertsPage() {
  const { changes, monitors } = useDemoData();
  return (
    <AppShell>
      <PageIntro
        eyebrow="Workspace / Alerts"
        title="System Alert Signals"
        description="Complete log of detected price changes and inventory updates across all targets."
      />
      <div className="card card-pad" style={{ marginTop: 24, padding: 20 }}>
        {changes.length === 0 ? (
          <EmptyState title="No alerts generated" copy="When a monitor detects a change, it will appear here instantly." />
        ) : (
          <div className="signal-list">
            {changes.map((c) => (
              <SignalRow key={c.id} change={c} monitor={monitors.find((m) => m.id === c.monitorId)} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

// --- 404 Not Found Page ---
export function NotFoundPage() {
  return (
    <AppShell>
      <InvalidState title="404 - Page Not Found" copy="The requested route does not exist." href="/dashboard" label="Return to Dashboard" />
    </AppShell>
  );
}
