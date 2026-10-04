import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BellRing,
  Check,
  ChevronRight,
  ExternalLink,
  Globe2,
  Info,
  Pause,
  Play,
  Plus,
  Radar,
  RefreshCw,
  Search,
  Tag,
  TriangleAlert,
  TrendingDown,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'wouter';
import {
  type Change,
  type Monitor,
  type MonitorType,
  formatDate,
  formatDateTime,
  getTimeAgo,
  useDemoData,
} from '@/lib/demo-data';
import {
  AppShell,
  DataSourceBadge,
  DemoBadge,
  EmptyState,
  PageIntro,
  SeverityBadge,
  StatusBadge,
} from '@/components/earlysignal-shell';

// --- Helper Components ---

function InvalidState({ title, copy, href, label }: { title: string; copy: string; href: string; label: string }) {
  return (
    <AppPage>
      <EmptyState
        title={title}
        copy={copy}
        action={
          <Link href={href} className="btn btn-primary btn-sm" data-testid="link-invalid-state-back">
            <ArrowLeft size={14} /> {label}
          </Link>
        }
      />
    </AppPage>
  );
}

function AppPage({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <div className="main-content">{children}</div>
    </AppShell>
  );
}

function MetricCard({
  label,
  value,
  detail,
  color,
  icon: Icon,
}: {
  label: string;
  value: number;
  detail: string;
  color: string;
  icon: typeof BarChart3;
}) {
  return (
    <div
      className="card metric-card"
      style={{ '--metric-color': color } as React.CSSProperties}
      data-testid={`metric-${label.toLowerCase().replaceAll(' ', '-')}`}
    >
      <div className="metric-top">
        <span className="metric-label">{label}</span>
        <Icon className="metric-icon" size={17} />
      </div>
      <div className="metric-number">{String(value).padStart(2, '0')}</div>
      <div className="metric-foot">{detail}</div>
    </div>
  );
}

function SignalRow({ change, monitor }: { change: Change; monitor?: Monitor }) {
  return (
    <Link href={`/changes/${change.id}`} className="signal-row" data-testid={`link-signal-${change.id}`}>
      <div className={`signal-severity ${change.severity.toLowerCase()}`}>
        {change.severity === 'High' ? (
          <TriangleAlert size={16} />
        ) : change.severity === 'Medium' ? (
          <BellRing size={15} />
        ) : (
          <Info size={15} />
        )}
      </div>
      <div>
        <div className="signal-title">{change.title}</div>
        <div className="signal-meta">
          {monitor?.name ?? 'Unknown monitor'} · <DataSourceBadge source={change.dataSource} />
        </div>
      </div>
      <div className="signal-time">{getTimeAgo(change.detectedAt)}</div>
    </Link>
  );
}

// --- Pages ---

export function LandingPage() {
  return (
    <div className="landing">
      <nav className="landing-nav" aria-label="Landing navigation">
        <Link href="/" className="brand" data-testid="link-landing-brand">
          <span className="brand-mark">
            <Radar size={17} strokeWidth={2.5} />
          </span>
          <span>
            <span className="brand-name">EarlySignal AI</span>
            <span className="brand-sub">Live Intelligence</span>
          </span>
        </Link>
        <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
          <Link href="/dashboard" className="btn btn-ghost btn-sm" data-testid="link-landing-sign-in">
            View dashboard
          </Link>
          <Link href="/monitors/new" className="btn btn-primary btn-sm" data-testid="link-landing-add-monitor">
            Add a monitor <ArrowRight size={14} />
          </Link>
        </div>
      </nav>
      <main>
        <section className="landing-hero">
          <div>
            <div
              className="demo-chip"
              style={{
                background: 'rgba(45,212,191,0.15)',
                borderColor: 'rgba(45,212,191,0.4)',
                color: '#2dd4bf',
              }}
            >
              <span className="demo-dot" style={{ background: '#2dd4bf' }} /> LIVE PRODUCT • REAL-TIME MONITORING •
              INTERNATIONAL
            </div>
            <h1 className="hero-title">
              See the shift <em>before</em> it becomes the story.
            </h1>
            <p className="hero-tagline">KNOW WHAT CHANGED BEFORE IT BECOMES A PROBLEM.</p>
            <p className="hero-copy">
              EarlySignal AI gives e-commerce teams a calm, focused view of meaningful changes across the web — price
              drops, stock changes, new arrivals — so the next decision starts with context, not guesswork. Live
              monitoring, live alerts.
            </p>
            <div className="hero-actions">
              <Link href="/dashboard" className="btn btn-primary" data-testid="link-hero-dashboard">
                Open live dashboard <ArrowRight size={15} />
              </Link>
              <Link href="/monitors/new" className="btn btn-ghost" data-testid="link-hero-monitor">
                Create a monitor <Plus size={15} />
              </Link>
            </div>
            <div className="hero-microcopy">LIVE DATA • REAL-TIME CHECKS • BUILT FOR SCALE</div>
          </div>
          <div className="hero-visual" aria-label="Illustration of the EarlySignal dashboard">
            <div className="visual-frame">
              <div className="visual-bar">
                <i />
                <i />
                <i />
                <span className="visual-label">EARLYSIGNAL / LIVE / OVERVIEW</span>
              </div>
              <div className="visual-inner">
                <div className="visual-top">
                  <span className="visual-heading">Live Signal overview</span>
                  <span
                    style={{
                      fontSize: 10,
                      padding: '4px 10px',
                      background: '#2dd4bf',
                      borderRadius: 20,
                      color: '#000',
                      fontWeight: 700,
                    }}
                  >
                    LIVE
                  </span>
                </div>
                <div className="visual-metrics">
                  <div className="visual-metric">
                    <small>Monitors</small>
                    <strong>Live</strong>
                  </div>
                  <div className="visual-metric">
                    <small>Changes</small>
                    <strong>Live</strong>
                  </div>
                  <div className="visual-metric">
                    <small>Alerts</small>
                    <strong style={{ color: 'var(--coral)' }}>Real</strong>
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <div className="visual-signal">
                    <span className="visual-signal-dot coral" />
                    <span>Competitor price dropped -12%</span>
                    <time>8m ago</time>
                  </div>
                  <div className="visual-signal">
                    <span className="visual-signal-dot amber" />
                    <span>New product detected</span>
                    <time>23m ago</time>
                  </div>
                  <div className="visual-signal">
                    <span className="visual-signal-dot blue" />
                    <span>Website content changed</span>
                    <time>1h ago</time>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="landing-section">
          <div className="eyebrow">Built for real operations</div>
          <div className="value-grid">
            <div className="value-item">
              <strong>Focused by design</strong>
              <p>Track what matters: Product Price, Stock, New Arrivals, Uptime. No noise, just signal.</p>
            </div>
            <div className="value-item">
              <strong>Live & connected</strong>
              <p>Connected to live web check APIs, real checks, real history. Not static data — your data.</p>
            </div>
            <div className="value-item">
              <strong>Actionable at a glance</strong>
              <p>Move from alert to source, history, and next step in one clear path. International ready.</p>
            </div>
          </div>
        </section>
      </main>
      <footer className="landing-footer">
        EARLYSIGNAL AI · LIVE PRODUCT · REAL-TIME INTELLIGENCE CONNECTED · INTERNATIONAL
      </footer>
    </div>
  );
}

export function DashboardPage() {
  const { monitors, changes } = useDemoData();
  const recentChanges = useMemo(() => {
    return changes.slice().sort((a, b) => +new Date(b.detectedAt) - +new Date(a.detectedAt));
  }, [changes]);
  const highCount = changes.filter((change) => change.severity === 'High').length;

  return (
    <AppPage>
      <PageIntro
        eyebrow="Workspace / live overview"
        title="Live Signal overview"
        description="Real-time view of what changed across your monitored sites."
        action={
          <span
            style={{
              fontSize: 10,
              padding: '4px 10px',
              background: '#2dd4bf',
              borderRadius: 20,
              color: '#000',
              fontWeight: 700,
            }}
          >
            LIVE • {monitors.length} ACTIVE
          </span>
        }
      />
      <div className="metric-grid">
        <MetricCard label="Total Monitors" value={monitors.length} detail="Live workspace" color="var(--cyan)" icon={Radar} />
        <MetricCard label="Active Monitors" value={monitors.filter((m) => m.status === 'active').length} detail="Checking live" color="var(--blue)" icon={BarChart3} />
        <MetricCard label="Changes Detected" value={changes.length} detail="Real history" color="var(--amber)" icon={TrendingDown} />
        <MetricCard label="High Priority Alerts" value={highCount} detail="Needs attention" color="var(--coral)" icon={TriangleAlert} />
      </div>
      <div className="dashboard-grid">
        <section className="card card-pad">
          <div className="section-heading">
            <h2>Recent signals</h2>
            <span>{changes.length} live changes</span>
          </div>
          <div className="signal-list">
            {recentChanges.map((change) => (
              <SignalRow key={change.id} change={change} monitor={monitors.find((m) => m.id === change.monitorId)} />
            ))}
          </div>
        </section>
        <aside className="card insight-card">
          <div className="insight-kicker">Live monitoring</div>
          <h2 className="insight-title">Real data, real decisions.</h2>
          <p className="insight-copy">
            Every monitor is connected to live checks. Track prices, stock, and content changes in real-time.
          </p>
          <div className="insight-stat">
            <strong>{monitors.length} live monitors</strong>
            <span>running in this workspace</span>
          </div>
          <Link href="/monitors" className="btn btn-ghost btn-sm" style={{ marginTop: 18 }} data-testid="link-dashboard-monitors">
            Review monitors <ArrowRight size={13} />
          </Link>
        </aside>
      </div>
    </AppPage>
  );
}

function MonitorCard({ monitor, changes }: { monitor: Monitor; changes: Change[] }) {
  return (
    <article className="card monitor-card" data-testid={`card-monitor-${monitor.id}`}>
      <div className="monitor-card-top">
        <div style={{ display: 'flex', gap: 12, minWidth: 0 }}>
          <div className="monitor-symbol">
            <Globe2 size={18} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h2 className="monitor-name">{monitor.name}</h2>
            <a
              className="monitor-url"
              href={monitor.websiteUrl}
              target="_blank"
              rel="noreferrer"
              data-testid={`link-monitor-url-${monitor.id}`}
            >
              {monitor.websiteUrl.replace('https://', '')} <ExternalLink size={9} style={{ display: 'inline' }} />
            </a>
          </div>
        </div>
        <StatusBadge status={monitor.status} />
      </div>
      <div className="monitor-tags">
        <span className="pill pill-active">
          <Tag size={10} /> {monitor.monitorType}
        </span>
        <span className="pill" style={{ background: 'rgba(45,212,191,0.15)', color: '#2dd4bf' }}>
          LIVE
        </span>
        <DataSourceBadge source={monitor.checkSource} />
      </div>
      <div className="monitor-facts">
        <div>
          <span className="fact-label">Last checked</span>
          <span className="fact-value">{formatDateTime(monitor.lastChecked)}</span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span className="fact-label">Detected changes</span>
          <span className="fact-value">{String(changes.length).padStart(2, '0')}</span>
        </div>
      </div>
      <div className="monitor-actions">
        <Link href="/monitors/new" className="btn btn-ghost btn-sm" style={{ flex: 1 }} data-testid={`link-add-monitor-card-${monitor.id}`}>
          <Plus size={13} /> Add monitor
        </Link>
        <Link href={`/monitors/${monitor.id}`} className="btn btn-ghost btn-sm" style={{ flex: 1 }} data-testid={`link-view-monitor-${monitor.id}`}>
          View monitor <ChevronRight size={13} />
        </Link>
      </div>
    </article>
  );
}

export function MonitorsPage() {
  const { monitors, changes } = useDemoData();
  const [filter, setFilter] = useState<'all' | 'active' | 'paused'>('all');
  const filtered = monitors.filter((monitor) => filter === 'all' || monitor.status === filter);

  return (
    <AppPage>
      <PageIntro
        eyebrow="Workspace / monitors"
        title="Live Monitors"
        description="Your live watchlist. Every monitor runs real-time checks."
        action={
          <Link href="/monitors/new" className="btn btn-primary" data-testid="link-add-monitor">
            <Plus size={15} /> Add monitor
          </Link>
        }
      />
      <div className="list-toolbar">
        <div className="filter-wrap">
          <Search size={15} color="var(--dim)" />
          <span className="eyebrow">Filter view</span>
          <select
            className="select"
            value={filter}
            onChange={(event) => setFilter(event.target.value as typeof filter)}
            aria-label="Filter monitors"
            data-testid="select-monitor-filter"
          >
            <option value="all">All monitors</option>
            <option value="active">Active only</option>
            <option value="paused">Paused only</option>
          </select>
        </div>
        <span className="mono" style={{ color: 'var(--dim)', fontSize: 10 }}>
          {filtered.length} live
        </span>
      </div>
      {filtered.length === 0 ? (
        <EmptyState
          title="No monitors yet"
          copy="Add your first monitor to start live tracking."
          action={
            <Link href="/monitors/new" className="btn btn-primary btn-sm" data-testid="link-empty-add-monitor">
              <Plus size={14} /> Add monitor
            </Link>
          }
        />
      ) : (
        <div className="monitor-grid">
          {filtered.map((monitor) => (
            <MonitorCard key={monitor.id} monitor={monitor} changes={changes.filter((change) => change.monitorId === monitor.id)} />
          ))}
        </div>
      )}
    </AppPage>
  );
}

export function NewMonitorPage() {
  const [, setLocation] = useLocation();
  const { addMonitor } = useDemoData();
  const [name, setName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [monitorType, setMonitorType] = useState<MonitorType>('Product Price');
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return setError('Add a name so you can recognize this monitor later.');
    try {
      const parsed = new URL(websiteUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error();
    } catch {
      setError('Enter a complete website URL, including https://');
      return;
    }
    try {
      const monitor = await addMonitor({ name: name.trim(), websiteUrl: websiteUrl.trim(), monitorType });
      setLocation(`/monitors/${monitor.id}`);
    } catch {
      setError('Could not save monitor. Please try again.');
    }
  };

  return (
    <AppPage>
      <PageIntro
        eyebrow="Workspace / monitors / new"
        title="Add a live monitor"
        description="Define a focused watch. Works with any public URL worldwide - Amazon, Jumia, Zara, Etsy, Shopify stores."
        action={
          <span style={{ fontSize: 10, padding: '4px 10px', background: '#2dd4bf', borderRadius: 20, color: '#000', fontWeight: 700 }}>
            LIVE MODE
          </span>
        }
      />
      <div className="form-shell">
        <form className="card form-card" onSubmit={submit} noValidate>
          <div className="callout" style={{ marginBottom: 24, background: 'rgba(45,212,191,0.1)', borderColor: 'rgba(45,212,191,0.3)' }}>
            <strong>Live checks enabled.</strong> New monitors run real website checks. International URLs supported.
          </div>
          <div className="field">
            <label htmlFor="monitor-name">Monitor Name</label>
            <input
              id="monitor-name"
              className="input"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setError('');
              }}
              placeholder="e.g. Amazon - iPhone 15 Pro"
              data-testid="input-monitor-name"
            />
            <span className="field-hint">International naming - make it scannable.</span>
          </div>
          <div className="field">
            <label htmlFor="website-url">Website URL</label>
            <input
              id="website-url"
              className="input"
              value={websiteUrl}
              onChange={(event) => {
                setWebsiteUrl(event.target.value);
                setError('');
              }}
              placeholder="https://example.com/product"
              data-testid="input-website-url"
            />
            <span className="field-hint">Any public URL worldwide. Live Product Price extraction.</span>
          </div>
          <div className="field">
            <label htmlFor="monitor-type">Monitor Type</label>
            <select
              id="monitor-type"
              className="select"
              style={{ width: '100%' }}
              value={monitorType}
              onChange={(event) => setMonitorType(event.target.value as MonitorType)}
              data-testid="select-monitor-type"
            >
              <option value="Product Price">Product Price - Live</option>
              <option value="Product Availability">Product Availability - Live</option>
              <option value="Product Catalog">Product Catalog - Live</option>
              <option value="Website Content">Website Content - Live</option>
            </select>
            <span className="field-hint">All types now live - international support.</span>
          </div>
          {error && (
            <div className="form-error" role="alert" data-testid="text-monitor-form-error">
              <TriangleAlert size={13} style={{ verticalAlign: 'middle', marginRight: 5 }} />
              {error}
            </div>
          )}
          <div className="form-actions">
            <Link href="/monitors" className="btn btn-ghost" data-testid="button-cancel-monitor">
              <X size={14} /> Cancel
            </Link>
            <button type="submit" className="btn btn-primary" data-testid="button-save-monitor">
              <Check size={14} /> Save monitor
            </button>
          </div>
        </form>
      </div>
    </AppPage>
  );
}

export function MonitorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { monitors, changes, toggleMonitorStatus, checkMonitor } = useDemoData();
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<{ success?: boolean; message?: string } | null>(null);

  const monitor = monitors.find((m) => m.id === id);
  const monitorChanges = changes.filter((c) => c.monitorId === id);

  if (!monitor) {
    return (
      <InvalidState
        title="Monitor not found"
        copy="The requested monitor does not exist or has been removed."
        href="/monitors"
        label="Back to Monitors"
      />
    );
  }

  const handleLiveCheck = async () => {
    setChecking(true);
    setCheckResult(null);
    const res = await checkMonitor(monitor.id);
    setCheckResult(res);
    setChecking(false);
  };

  return (
    <AppPage>
      <PageIntro
        eyebrow="Workspace / monitors / detail"
        title={monitor.name}
        description={`Monitoring target on ${monitor.checkSource}`}
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleLiveCheck}
              disabled={checking}
              className="btn btn-primary btn-sm"
              data-testid="button-check-now"
            >
              <RefreshCw size={14} className={checking ? 'spin' : ''} />
              {checking ? 'Checking live...' : 'Check now (Live)'}
            </button>
            <button
              onClick={() => toggleMonitorStatus(monitor.id)}
              className="btn btn-ghost btn-sm"
              data-testid="button-toggle-status"
            >
              {monitor.status === 'active' ? (
                <>
                  <Pause size={14} /> Pause
                </>
              ) : (
                <>
                  <Play size={14} /> Resume
                </>
              )}
            </button>
          </div>
        }
      />

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20 }}>
        <StatusBadge status={monitor.status} />
        <DataSourceBadge source={monitor.checkSource} />
        <a
          href={monitor.websiteUrl}
          target="_blank"
          rel="noreferrer"
          className="mono"
          style={{ fontSize: 12, color: 'var(--dim)', wordBreak: 'break-all' }}
        >
          {monitor.websiteUrl} <ExternalLink size={10} style={{ display: 'inline' }} />
        </a>
      </div>

      {checkResult && (
        <div
          className={`callout ${checkResult.success ? 'callout-success' : 'callout-error'}`}
          style={{
            marginBottom: 20,
            padding: '12px 16px',
            borderRadius: 8,
            background: checkResult.success ? 'rgba(45, 212, 191, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            borderColor: checkResult.success ? 'rgba(45, 212, 191, 0.3)' : 'rgba(239, 68, 68, 0.3)',
            color: checkResult.success ? '#2dd4bf' : '#f87171',
          }}
        >
          {checkResult.message}
        </div>
      )}

      <div className="dashboard-grid" style={{ marginTop: 20 }}>
        <section className="card card-pad">
          <div className="section-heading">
            <h2>Live Change history</h2>
            <span>{monitorChanges.length} signals</span>
          </div>
          {monitorChanges.length === 0 ? (
            <EmptyState
              title="No changes yet"
              copy="Run a live check to establish baseline."
            />
          ) : (
            <div className="signal-list">
              {monitorChanges.map((change) => (
                <SignalRow key={change.id} change={change} monitor={monitor} />
              ))}
            </div>
          )}
        </section>

        <aside className="card card-pad">
          <div className="section-heading">
            <h2>Monitor details</h2>
            <span className="mono" style={{ fontSize: 10, color: 'var(--dim)' }}>
              LIVE
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
            <div>
              <span className="fact-label">Monitor Type</span>
              <div className="fact-value" style={{ marginTop: 4 }}>
                {monitor.monitorType}
              </div>
            </div>
            <div>
              <span className="fact-label">Last Value</span>
              <div className="fact-value" style={{ marginTop: 4, fontSize: 18, color: '#2dd4bf', fontWeight: 700 }}>
                {monitor.lastValue || 'Pending initial check'}
              </div>
            </div>
            <div>
              <span className="fact-label">Last Checked</span>
              <div className="fact-value" style={{ marginTop: 4 }}>
                {formatDateTime(monitor.lastChecked)}
              </div>
            </div>
            <div>
              <span className="fact-label">Created At</span>
              <div className="fact-value" style={{ marginTop: 4 }}>
                {formatDate(monitor.createdAt)}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </AppPage>
  );
}

export function ChangeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { changes, monitors } = useDemoData();

  const change = changes.find((c) => c.id === id);
  const monitor = change ? monitors.find((m) => m.id === change.monitorId) : undefined;

  if (!change) {
    return (
      <InvalidState
        title="Signal not found"
        copy="The detected change record does not exist or was cleared."
        href="/dashboard"
        label="Return to Dashboard"
      />
    );
  }

  return (
    <AppPage>
      <PageIntro
        eyebrow="Workspace / changes / detail"
        title={change.title}
        description={change.description}
        action={<SeverityBadge severity={change.severity} />}
      />

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20 }}>
        <DataSourceBadge source={change.dataSource} />
        <span className="mono" style={{ fontSize: 12, color: 'var(--dim)' }}>
          Detected {formatDateTime(change.detectedAt)} ({getTimeAgo(change.detectedAt)})
        </span>
      </div>

      <div className="dashboard-grid" style={{ marginTop: 20 }}>
        <section className="card card-pad">
          <div className="section-heading">
            <h2>Value Shift</h2>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
              padding: '20px 0',
            }}
          >
            <div style={{ padding: 16, borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
              <span className="fact-label">Previous Value</span>
              <div style={{ fontSize: 20, fontWeight: 700, marginTop: 8, color: 'var(--dim)' }}>
                {change.oldValue}
              </div>
            </div>
            <div style={{ padding: 16, borderRadius: 8, background: 'rgba(45,212,191,0.05)', border: '1px solid rgba(45,212,191,0.3)' }}>
              <span className="fact-label" style={{ color: '#2dd4bf' }}>New Detected Value</span>
              <div style={{ fontSize: 20, fontWeight: 700, marginTop: 8, color: '#2dd4bf' }}>
                {change.newValue}
              </div>
            </div>
          </div>
        </section>

        <aside className="card card-pad">
          <div className="section-heading">
            <h2>Source Monitor</h2>
          </div>
          {monitor ? (
            <div style={{ marginTop: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>{monitor.name}</h3>
              <p className="mono" style={{ fontSize: 12, color: 'var(--dim)', marginTop: 4, wordBreak: 'break-all' }}>
                {monitor.websiteUrl}
              </p>
              <Link
                href={`/monitors/${monitor.id}`}
                className="btn btn-ghost btn-sm"
                style={{ marginTop: 16 }}
                data-testid="link-change-source-monitor"
              >
                View monitor details <ArrowRight size={13} />
              </Link>
            </div>
          ) : (
            <p style={{ marginTop: 16, color: 'var(--dim)' }}>Monitor details not available.</p>
          )}
        </aside>
      </div>
    </AppPage>
  );
}

export function AlertsPage() {
  const { changes, monitors } = useDemoData();
  const sortedChanges = useMemo(() => {
    return changes.slice().sort((a, b) => +new Date(b.detectedAt) - +new Date(a.detectedAt));
  }, [changes]);

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
        {sortedChanges.length === 0 ? (
          <EmptyState title="No alerts yet" copy="When a monitor detects a price or status change, it will show up here." />
        ) : (
          <div className="signal-list">
            {sortedChanges.map((change) => (
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
    <InvalidState
      title="404 - Page Not Found"
      copy="The page you are looking for does not exist or has been moved."
      href="/dashboard"
      label="Return to Dashboard"
    />
  );
}
