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
    <AppPage>
      <div className="landing-hero">
        <div className="hero-content">
          <DemoBadge />

          <h1 className="hero-title">
            Know What Changed Before It Becomes a Problem
          </h1>

          <p className="hero-subtitle">
            EarlySignal helps businesses monitor important changes across
            websites and tracked sources. This version uses demo data and
            simulated checks while the real monitoring infrastructure is being
            developed.
          </p>

          <div className="hero-actions">
            <button
              className="btn btn-primary btn-lg"
              onClick={() => setLocation('/dashboard')}
            >
              Open Workspace
            </button>

            <button
              className="btn btn-secondary btn-lg"
              onClick={() => setLocation('/monitors')}
            >
              View Monitors
            </button>
          </div>
        </div>
      </div>
    </AppPage>
  );
}

export function DashboardPage() {
  const { monitors, changes } = useDemoData();
  const [, setLocation] = useLocation();

  const activeMonitors = monitors.filter(
    (monitor) => monitor.status === 'active',
  ).length;

  const recentChanges = [...changes]
    .sort(
      (a, b) =>
        new Date(b.detectedAt).getTime() -
        new Date(a.detectedAt).getTime(),
    )
    .slice(0, 5);

  return (
    <AppPage>
      <PageIntro
        title="Workspace Overview"
        subtitle="Monitor important changes from one centralized workspace."
      />

      <div
        className="card card-pad"
        style={{
          marginBottom: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <DemoBadge />
          <h2 style={{ marginTop: 10 }}>Demo monitoring environment</h2>
          <p className="text-subtle" style={{ marginTop: 6 }}>
            All monitors, changes and check results shown here are demo data.
            No live website verification is being performed.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setLocation('/monitors/new')}
        >
          + Add Monitor
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Active Monitors</div>
          <div className="stat-value">{activeMonitors}</div>
          <div className="text-subtle">Demo monitors</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Detected Changes</div>
          <div className="stat-value">{changes.length}</div>
          <div className="text-subtle">Demo signals</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Monitoring Mode</div>
          <div className="stat-value" style={{ fontSize: 20 }}>
            Demo
          </div>
          <div className="text-subtle">Live infrastructure not connected</div>
        </div>
      </div>

      <div className="card card-pad" style={{ marginTop: 24 }}>
        <div className="section-heading">
          <div>
            <h2>Recent Signals</h2>
            <p className="text-subtle" style={{ marginTop: 4 }}>
              Recent changes from the demo monitoring dataset.
            </p>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setLocation('/alerts')}
          >
            View All
          </button>
        </div>

        {recentChanges.length === 0 ? (
          <EmptyState
            title="No changes detected"
            message="Demo change signals will appear here when available."
          />
        ) : (
          <div className="signal-list">
            {recentChanges.map((change) => (
              <SignalRow
                key={change.id}
                change={change}
                monitor={monitors.find(
                  (monitor) => monitor.id === change.monitorId,
                )}
              />
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

  const handleCheck = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();

    setLoadingId(id);

    try {
      await checkMonitor(id);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <AppPage>
      <PageIntro
        title="Monitors"
        subtitle="Manage the websites and sources you want EarlySignal to track."
      />

      <div className="card card-pad" style={{ marginTop: 20 }}>
        <div
          className="section-heading"
          style={{
            marginBottom: 16,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h2>Tracked Sources ({monitors.length})</h2>
            <p className="text-subtle" style={{ marginTop: 4 }}>
              Demo monitoring data.
            </p>
          </div>

          <button
            className="btn btn-primary btn-sm"
            onClick={() => setLocation('/monitors/new')}
          >
            + New Monitor
          </button>
        </div>

        {monitors.length === 0 ? (
          <EmptyState
            title="No monitors yet"
            message="Create your first demo monitor to start exploring the workspace."
            onAction={() => setLocation('/monitors/new')}
          />
        ) : (
          <div className="monitor-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Monitor</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Last Value</th>
                  <th>Last Checked</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {monitors.map((monitor) => (
                  <tr
                    key={monitor.id}
                    onClick={() =>
                      setLocation(`/monitors/${monitor.id}`)
                    }
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <strong>{monitor.name}</strong>

                      <div
                        className="text-subtle"
                        style={{
                          marginTop: 4,
                          fontSize: 12,
                          wordBreak: 'break-all',
                        }}
                      >
                        {monitor.checkSource}
                      </div>
                    </td>

                    <td>{monitor.monitorType}</td>

                    <td>
                      <StatusBadge status={monitor.status} />
                    </td>

                    <td>
                      <strong>{monitor.lastValue || 'No value'}</strong>
                    </td>

                    <td>
                      {monitor.lastChecked
                        ? getTimeAgo(monitor.lastChecked)
                        : 'Never'}
                    </td>

                    <td>
                      <div
                        className="action-buttons"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <button
                          className="btn btn-secondary btn-xs"
                          disabled={loadingId === monitor.id}
                          onClick={(event) =>
                            handleCheck(monitor.id, event)
                          }
                        >
                          {loadingId === monitor.id
                            ? 'Checking...'
                            : 'Check'}
                        </button>

                        <button
                          className="btn btn-secondary btn-xs"
                          onClick={() =>
                            toggleMonitorStatus(monitor.id)
                          }
                        >
                          {monitor.status === 'active'
                            ? 'Pause'
                            : 'Resume'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppPage>
  );
}

export function NewMonitorPage() {
  const { addMonitor } = useDemoData();
  const [, setLocation] = useLocation();

  const [name, setName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [monitorType, setMonitorType] =
    useState<MonitorType>('Product Price');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setError('');

    if (!name.trim() || !websiteUrl.trim()) {
      setError('Please complete all required fields.');
      return;
    }

    setLoading(true);

    try {
      const created = await addMonitor({
        name: name.trim(),
        websiteUrl: websiteUrl.trim(),
        monitorType,
      });

      setLocation(`/monitors/${created.id}`);
    } catch {
      setError('Unable to create the demo monitor.');
      setLoading(false);
    }
  };

  return (
    <AppPage>
      <PageIntro
        title="Add Monitor"
        subtitle="Create a demo monitoring target. Live website monitoring will be connected in a later stage."
      />

      <div
        className="card card-pad"
        style={{ marginTop: 20, maxWidth: 680 }}
      >
        <div style={{ marginBottom: 20 }}>
          <DemoBadge />
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="monitor-name">
              Monitor Name
            </label>

            <input
              id="monitor-name"
              type="text"
              className="form-input"
              placeholder="e.g. Competitor iPhone Price"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="website-url">
              Target Website URL
            </label>

            <input
              id="website-url"
              type="url"
              className="form-input"
              placeholder="https://example.com/product"
              value={websiteUrl}
              onChange={(event) => setWebsiteUrl(event.target.value)}
              required
            />

            <div
              className="text-subtle"
              style={{ marginTop: 6, fontSize: 12 }}
            >
              The URL is stored as demo monitor data. It is not fetched or
              verified yet.
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="monitor-type">
              Monitor Type
            </label>

            <select
              id="monitor-type"
              className="form-input"
              value={monitorType}
              onChange={(event) =>
                setMonitorType(event.target.value as MonitorType)
              }
            >
              <option value="Product Price">Product Price</option>
              <option value="Product Availability">
                Product Availability
              </option>
              <option value="Website Content">Website Content</option>
            </select>
          </div>

          {error && (
            <div
              className="card"
              style={{
                marginTop: 16,
                padding: 12,
                borderColor: 'rgba(239,68,68,0.35)',
                color: '#fca5a5',
              }}
              role="alert"
            >
              {error}
            </div>
          )}

          <div
            style={{
              marginTop: 24,
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Monitor'}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setLocation('/monitors')}
            >
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
  const {
    getMonitor,
    checkMonitor,
    changes,
    toggleMonitorStatus,
  } = useDemoData();
  const [, setLocation] = useLocation();

  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const monitor = getMonitor(params?.id || '');

  if (!monitor) {
    return <NotFoundPage />;
  }

  const monitorChanges = changes
    .filter((change) => change.monitorId === monitor.id)
    .sort(
      (a, b) =>
        new Date(b.detectedAt).getTime() -
        new Date(a.detectedAt).getTime(),
    );

  const handleRunCheck = async () => {
    setChecking(true);
    setFeedback(null);

    try {
      const result = await checkMonitor(monitor.id);
      setFeedback(result);
    } finally {
      setChecking(false);
    }
  };

  return (
    <AppPage>
      <button
        className="btn btn-secondary btn-sm"
        onClick={() => setLocation('/monitors')}
        style={{ marginBottom: 16 }}
      >
        ← All monitors
      </button>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
          marginBottom: 8,
        }}
      >
        <h1 style={{ margin: 0 }}>{monitor.name}</h1>

        <StatusBadge status={monitor.status} />

        <DataSourceBadge source={monitor.checkSource} />

        <DemoBadge />
      </div>

      <p
        className="text-subtle"
        style={{
          wordBreak: 'break-all',
          marginTop: 8,
        }}
      >
        <a
          href={monitor.websiteUrl}
          target="_blank"
          rel="noreferrer"
          style={{ color: '#60a5fa' }}
        >
          {monitor.websiteUrl}
        </a>
      </p>

      <div
        className="card card-pad"
        style={{
          marginTop: 20,
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 16,
        }}
      >
        <div>
          <div className="stat-label">Monitor Type</div>
          <strong>{monitor.monitorType}</strong>
        </div>

        <div>
          <div className="stat-label">Last Value</div>
          <strong>{monitor.lastValue || 'No value'}</strong>
        </div>

        <div>
          <div className="stat-label">Last Checked</div>
          <strong>
            {monitor.lastChecked
              ? getTimeAgo(monitor.lastChecked)
              : 'Never'}
          </strong>
        </div>

        <div>
          <div className="stat-label">Check Status</div>
          <strong>
            {monitor.checkStatus || 'Not checked'}
          </strong>
        </div>
      </div>

      <div
        className="hero-actions"
        style={{
          margin: '20px 0',
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <button
          className="btn btn-primary"
          onClick={handleRunCheck}
          disabled={checking}
        >
          {checking ? 'Checking demo source...' : 'Run Demo Check'}
        </button>

        <button
          className="btn btn-secondary"
          onClick={() => toggleMonitorStatus(monitor.id)}
        >
          {monitor.status === 'active' ? 'Pause' : 'Resume'}
        </button>
      </div>

      {feedback && (
        <div
          className="card card-pad"
          style={{
            marginBottom: 20,
            borderColor: feedback.success
              ? 'rgba(16,185,129,0.35)'
              : 'rgba(239,68,68,0.35)',
          }}
          role="status"
        >
          <strong>
            {feedback.success
              ? 'Demo check completed'
              : 'Demo check could not be completed'}
          </strong>

          <p
            className="text-subtle"
            style={{ marginTop: 5 }}
          >
            {feedback.message}
          </p>
        </div>
      )}

      <div className="card card-pad" style={{ marginTop: 20 }}>
        <div className="section-heading">
          <div>
            <h2>Change History</h2>
            <p className="text-subtle" style={{ marginTop: 4 }}>
              Demo signals associated with this monitor.
            </p>
          </div>
        </div>

        {monitorChanges.length === 0 ? (
          <EmptyState
            title="No changes yet"
            message="No demo change signals are currently associated with this monitor."
          />
        ) : (
          <div className="signal-list">
            {monitorChanges.map((change) => (
              <SignalRow
                key={change.id}
                change={change}
                monitor={monitor}
              />
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

  const change = changes.find(
    (item) => item.id === params?.id,
  );

  const monitor = monitors.find(
    (item) => item.id === change?.monitorId,
  );

  if (!change) {
    return <NotFoundPage />;
  }

  return (
    <AppPage>
      <button
        className="btn btn-secondary btn-sm"
        onClick={() => setLocation('/alerts')}
        style={{ marginBottom: 16 }}
      >
        ← Back to Alerts
      </button>

      <PageIntro
        title={change.title}
        subtitle={change.description}
      />

      <div
        className="card card-pad"
        style={{ marginTop: 20 }}
      >
        <div style={{ marginBottom: 20 }}>
          <DemoBadge />
        </div>

        <div
          style={{
            display: 'grid',
            gap: 14,
          }}
        >
          <DetailRow
            label="Severity"
            value={<SeverityBadge severity={change.severity} />}
          />

          <DetailRow
            label="Monitor"
            value={monitor?.name || 'Unknown'}
          />

          <DetailRow
            label="Detected"
            value={formatDateTime(change.detectedAt)}
          />

          <DetailRow
            label="Old Value"
            value={change.oldValue}
          />

          <DetailRow
            label="New Value"
            value={change.newValue}
          />

          <DetailRow
            label="Data Source"
            value={change.dataSource}
          />

          <DetailRow
            label="Change Type"
            value={change.changeType}
          />
        </div>

        <div
          style={{
            marginTop: 24,
            padding: 14,
            borderRadius: 10,
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.2)',
          }}
        >
          <strong>Demo Analysis</strong>

          <p
            className="text-subtle"
            style={{ marginTop: 5 }}
          >
            This signal is part of EarlySignal's demonstration
            dataset. It does not represent a live verified event.
          </p>
        </div>
      </div>
    </AppPage>
  );
}

export function AlertsPage() {
  const { changes, monitors } = useDemoData();

  const sortedChanges = [...changes].sort(
    (a, b) =>
      new Date(b.detectedAt).getTime() -
      new Date(a.detectedAt).getTime(),
  );

  return (
    <AppPage>
      <PageIntro
        title="Alerts & Signals"
        subtitle="Review changes detected in the EarlySignal demo environment."
      />

      <div
        className="card card-pad"
        style={{ marginTop: 20 }}
      >
        <div
          className="section-heading"
          style={{ marginBottom: 16 }}
        >
          <div>
            <h2>
              Detected Signals ({sortedChanges.length})
            </h2>
          </div>

          <DemoBadge />
        </div>

        {sortedChanges.length === 0 ? (
          <EmptyState
            title="No alerts yet"
            message="When demo data contains a detected change, it will appear here."
          />
        ) : (
          <div className="signal-list">
            {sortedChanges.map((change) => (
              <SignalRow
                key={change.id}
                change={change}
                monitor={monitors.find(
                  (monitor) => monitor.id === change.monitorId,
                )}
              />
            ))}
          </div>
        )}
      </div>
    </AppPage>
  );
}

export function NotFoundPage() {
  const [, setLocation] = useLocation();

  return (
    <AppPage>
      <div
        className="card card-pad"
        style={{
          marginTop: 40,
          textAlign: 'center',
          padding: '60px 20px',
        }}
      >
        <h1
          style={{
            fontSize: '2rem',
            marginBottom: 12,
          }}
        >
          404
        </h1>

        <h2 style={{ marginBottom: 12 }}>
          Page Not Found
        </h2>

        <p
          className="text-subtle"
          style={{ marginBottom: 24 }}
        >
          The page you are looking for does not exist or has
          been moved.
        </p>

        <button
          className="btn btn-primary"
          onClick={() => setLocation('/dashboard')}
        >
          Return to Dashboard
        </button>
      </div>
    </AppPage>
  );
}

function SignalRow({
  change,
  monitor,
}: {
  change: Change;
  monitor?: Monitor;
}) {
  const [, setLocation] = useLocation();

  return (
    <button
      type="button"
      className="signal-item"
      onClick={() => setLocation(`/changes/${change.id}`)}
      style={{
        width: '100%',
        textAlign: 'left',
        cursor: 'pointer',
        padding: '14px 0',
        border: 0,
        borderBottom: '1px solid #1f2937',
        background: 'transparent',
        color: 'inherit',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <strong>{change.title}</strong>

          <div
            className="text-subtle"
            style={{
              fontSize: '0.85rem',
              marginTop: 4,
            }}
          >
            {monitor?.name || 'Monitor'} •{' '}
            {getTimeAgo(change.detectedAt)}
          </div>
        </div>

        <SeverityBadge severity={change.severity} />
      </div>
    </button>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(120px, 180px) 1fr',
        gap: 16,
        alignItems: 'center',
        paddingBottom: 12,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <span className="text-subtle">{label}</span>

      <span style={{ wordBreak: 'break-word' }}>
        {value}
      </span>
    </div>
  );
}
