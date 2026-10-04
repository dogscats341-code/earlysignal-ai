import React, { useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import {
  AppPage,
  DataSourceBadge,
  DemoBadge,
  EmptyState,
  PageIntro,
  SeverityBadge,
  StatusBadge,
} from '@/components/earlysignal-shell';
import {
  Change,
  formatDateTime,
  getTimeAgo,
  Monitor,
  MonitorType,
  useDemoData,
} from '@/lib/demo-data';

export function LandingPage() {
  const [, setLocation] = useLocation();
  return (
    <div className="landing-hero">
      <div className="hero-content">
        <DemoBadge />
        <h1 className="hero-title">Live E-commerce Price & Change Detection</h1>
        <p className="hero-subtitle">
          Track competitor prices, product availability, and web updates in real time with automated live checks.
        </p>
        <div className="hero-actions">
          <button className="btn btn-primary btn-lg" onClick={() => setLocation('/dashboard')}>
            Open Workspace
          </button>
          <button className="btn btn-secondary btn-lg" onClick={() => setLocation('/monitors')}>
            View Monitors
          </button>
        </div>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { monitors, changes } = useDemoData();
  const [, setLocation] = useLocation();

  const activeMonitors = monitors.filter((m) => m.status === 'active').length;

  return (
    <AppPage>
      <PageIntro
        eyebrow="Workspace / Overview"
        title="Live Intelligence Summary"
        description="Real-time monitoring metrics and active change signals across tracked sources."
      />

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Active Monitors</div>
          <div className="stat-value">{activeMonitors}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Detected Changes</div>
          <div className="stat-value">{changes.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">System Health</div>
          <div className="stat-value text-success">100% Operational</div>
        </div>
      </div>

      <div className="card card-pad" style={{ marginTop: 24 }}>
        <div className="section-heading">
          <h2>Recent Detected Signals</h2>
          <button className="btn btn-secondary btn-sm" onClick={() => setLocation('/alerts')}>
            View All Alerts
          </button>
        </div>
        {changes.length === 0 ? (
          <EmptyState title="No changes detected yet" copy="Trigger a live check on your monitors to establish a baseline." />
        ) : (
          <div className="signal-list">
            {changes.slice(0, 5).map((change) => (
              <SignalRow key={change.id} change={change} monitor={monitors.find((m) => m.id === change.monitorId)} />
            ))}
          </div>
        )}
      </div>
    </AppPage>
  );
}

export function MonitorsPage() {
  const { monitors, toggleMonitorStatus, checkMonitor } = useDemoData();
  const [, setLocation] = useLocation();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleCheck = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLoadingId(id);
    await checkMonitor(id);
    setLoadingId(null);
  };

  return (
    <AppPage>
      <PageIntro
        eyebrow="Workspace / Monitors"
        title="Tracked Endpoints"
        description="Manage active web scrapers, trigger manual syncs, and review last price values."
      />

      <div className="card card-pad" style={{ marginTop: 20 }}>
        <div className="section-heading" style={{ marginBottom: 16 }}>
          <h2>All Monitors ({monitors.length})</h2>
          <button className="btn btn-primary btn-sm" onClick={() => setLocation('/monitors/new')}>
            + New Monitor
          </button>
        </div>

        <div className="monitor-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Monitor Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Last Value</th>
                <th>Last Checked</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {monitors.map((m) => (
                <tr key={m.id} onClick={() => setLocation(`/monitors/${m.id}`)} style={{ cursor: 'pointer' }}>
                  <td>
                    <strong>{m.name}</strong>
                    <div className="text-subtle">{m.checkSource}</div>
                  </td>
                  <td>{m.monitorType}</td>
                  <td>
                    <StatusBadge status={m.status} />
                  </td>
                  <td>
                    <strong>{m.lastValue || 'N/A'}</strong>
                  </td>
                  <td>{getTimeAgo(m.lastChecked)}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-secondary btn-xs"
                        disabled={loadingId === m.id}
                        onClick={(e) => handleCheck(m.id, e)}
                      >
                        {loadingId === m.id ? 'Checking...' : 'Check now'}
                      </button>
                      <button
                        className="btn btn-secondary btn-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMonitorStatus(m.id);
                        }}
                      >
                        {m.status === 'active' ? 'Pause' : 'Resume'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppPage>
  );
}

export function NewMonitorPage() {
  const { addMonitor } = useDemoData();
  const [, setLocation] = useLocation();

  const [name, setName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [monitorType, setMonitorType] = useState<MonitorType>('Product Price');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !websiteUrl) return;

    setLoading(true);
    const created = await addMonitor({ name, websiteUrl, monitorType });
    setLoading(false);
    setLocation(`/monitors/${created.id}`);
  };

  return (
    <AppPage>
      <PageIntro
        eyebrow="Monitors / Create"
        title="Add New Target"
        description="Configure target URLs for automated price and availability scraping."
      />

      <div className="card card-pad" style={{ marginTop: 20, maxWidth: 600 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Monitor Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., Jumia - iPhone 15 Pro"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Target Product URL</label>
            <input
              type="url"
              className="form-input"
              placeholder="https://www.jumia.ma/..."
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Monitor Type</label>
            <select
              className="form-input"
              value={monitorType}
              onChange={(e) => setMonitorType(e.target.value as MonitorType)}
            >
              <option value="Product Price">Product Price</option>
              <option value="Product Availability">Product Availability</option>
              <option value="Website Content">Website Content</option>
            </select>
          </div>

          <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Monitor'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setLocation('/monitors')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </AppPage>
  );
}

export function MonitorDetailPage() {
  const [, params] = useRoute('/monitors/:id');
  const { getMonitor, checkMonitor, changes, toggleMonitorStatus } = useDemoData();
  const [, setLocation] = useLocation();

  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const monitor = getMonitor(params?.id || '');

  if (!monitor) {
    return <NotFoundPage />;
  }

  const monitorChanges = changes.filter((c) => c.monitorId === monitor.id);

  const handleRunCheck = async () => {
    setChecking(true);
    setFeedback(null);
    const result = await checkMonitor(monitor.id);
    setFeedback(result);
    setChecking(false);
  };

  return (
    <AppPage>
      <button className="btn btn-secondary btn-sm" onClick={() => setLocation('/monitors')} style={{ marginBottom: 16 }}>
        ← All monitors
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <h1 style={{ margin: 0 }}>{monitor.name}</h1>
        <StatusBadge status={monitor.status} />
        <DataSourceBadge source={monitor.checkSource} />
      </div>

      <p className="text-subtle" style={{ wordBreak: 'break-all' }}>
        <a href={monitor.websiteUrl} target="_blank" rel="noreferrer" style={{ color: '#60a5fa' }}>
          {monitor.websiteUrl}
        </a>
      </p>

      <div className="hero-actions" style={{ margin: '20px 0' }}>
        <button className="btn btn-primary" onClick={handleRunCheck} disabled={checking}>
          {checking ? 'Checking live server...' : 'Check now (Live)'}
        </button>
        <button className="btn btn-secondary" onClick={() => toggleMonitorStatus(monitor.id)}>
          {monitor.status === 'active' ? 'Pause' : 'Resume'}
        </button>
      </div>

      {feedback && (
        <div
          className={`card card-pad ${feedback.success ? 'border-success' : 'border-error'}`}
          style={{ marginBottom: 20, padding: 12 }}
        >
          {feedback.message}
        </div>
      )}

      <div className="card card-pad" style={{ marginTop: 20 }}>
        <h2>Live Change history</h2>
        {monitorChanges.length === 0 ? (
          <EmptyState title="No changes yet" copy="Run a live check to establish baseline." />
        ) : (
          <div className="signal-list">
            {monitorChanges.map((change) => (
              <SignalRow key={change.id} change={change} monitor={monitor} />
            ))}
          </div>
        )}
      </div>
    </AppPage>
  );
}

export function ChangeDetailPage() {
  const [, params] = useRoute('/changes/:id');
  const { changes, monitors } = useDemoData();
  const [, setLocation] = useLocation();

  const change = changes.find((c) => c.id === params?.id);
  const monitor = monitors.find((m) => m.id === change?.monitorId);

  if (!change) {
    return <NotFoundPage />;
  }

  return (
    <AppPage>
      <button className="btn btn-secondary btn-sm" onClick={() => setLocation('/alerts')} style={{ marginBottom: 16 }}>
        ← Back to Alerts
      </button>

      <PageIntro
        eyebrow={`Signal / ${change.severity} Severity`}
        title={change.title}
        description={change.description}
      />

      <div className="card card-pad" style={{ marginTop: 20 }}>
        <h3>Details</h3>
        <p>
          <strong>Monitor:</strong> {monitor?.name || 'Unknown'}
        </p>
        <p>
          <strong>Detected:</strong> {formatDateTime(change.detectedAt)}
        </p>
        <p>
          <strong>Old Value:</strong> {change.oldValue}
        </p>
        <p>
          <strong>New Value:</strong> {change.newValue}
        </p>
      </div>
    </AppPage>
  );
}

export function AlertsPage() {
  const { changes, monitors } = useDemoData();
  return (
    <AppPage>
      <PageIntro
        eyebrow="Workspace / alerts"
        title="All System Alerts"
        description="Complete feed of price updates and detected changes across all monitors."
      />
      <div className="card card-pad" style={{ marginTop: 20 }}>
        <div className="section-heading" style={{ marginBottom: 16 }}>
          <h2>All Detected Signals ({changes.length})</h2>
        </div>
        {changes.length === 0 ? (
          <EmptyState title="No alerts yet" copy="When a monitor detects a price change, it will show up here." />
        ) : (
          <div className="signal-list">
            {changes.map((change) => (
              <SignalRow key={change.id} change={change} monitor={monitors.find((m) => m.id === change.monitorId)} />
            ))}
          </div>
        )}
      </div>
    </AppPage>
  );
}

export function NotFoundPage() {
  return (
    <AppPage>
      <div className="card card-pad" style={{ marginTop: 40, textAlign: 'center', padding: '60px 20px' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '12px' }}>404 - Page Not Found</h1>
        <p style={{ color: '#888', marginBottom: '24px' }}>
          The page you are looking for does not exist or has been moved.
        </p>
        <a
          href="/dashboard"
          style={{
            display: 'inline-block',
            padding: '10px 20px',
            borderRadius: '6px',
            background: '#10b981',
            color: '#fff',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Return to Dashboard
        </a>
      </div>
    </AppPage>
  );
}

function SignalRow({ change, monitor }: { change: Change; monitor?: Monitor }) {
  const [, setLocation] = useLocation();
  return (
    <div
      className="signal-item"
      onClick={() => setLocation(`/changes/${change.id}`)}
      style={{ cursor: 'pointer', padding: '12px 0', borderBottom: '1px solid #1f2937' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <strong>{change.title}</strong>
          <div className="text-subtle" style={{ fontSize: '0.85rem' }}>
            {monitor?.name || 'Monitor'} • {getTimeAgo(change.detectedAt)}
          </div>
        </div>
        <SeverityBadge severity={change.severity} />
      </div>
    </div>
  );
}
