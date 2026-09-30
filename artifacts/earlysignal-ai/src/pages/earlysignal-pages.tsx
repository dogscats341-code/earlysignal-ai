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
  Sparkles,
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
import { AppShell, DataSourceBadge, DemoBadge, EmptyState, PageIntro, SeverityBadge, StatusBadge } from '@/components/earlysignal-shell';

export function LandingPage() {
  return (
    <div className="landing">
      <nav className="landing-nav" aria-label="Landing navigation">
        <Link href="/" className="brand" data-testid="link-landing-brand"><span className="brand-mark"><Radar size={17} strokeWidth={2.5} /></span><span><span className="brand-name">EarlySignal AI</span><span className="brand-sub">Operational clarity</span></span></Link>
        <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
          <Link href="/dashboard" className="btn btn-ghost btn-sm" data-testid="link-landing-sign-in">View dashboard</Link>
          <Link href="/monitors/new" className="btn btn-primary btn-sm" data-testid="link-landing-add-monitor">Add a monitor <ArrowRight size={14} /></Link>
        </div>
      </nav>
      <main>
        <section className="landing-hero">
          <div>
            <div className="demo-chip"><span className="demo-dot" /> Demo product for small shops</div>
            <h1 className="hero-title">See the shift <em>before</em> it becomes the story.</h1>
            <p className="hero-tagline">Know What Changed Before It Becomes a Problem.</p>
            <p className="hero-copy">EarlySignal AI gives small e-commerce teams a calm, focused view of meaningful changes across the web — so the next decision starts with context, not guesswork.</p>
            <div className="hero-actions">
              <Link href="/dashboard" className="btn btn-primary" data-testid="link-hero-dashboard">Open demo dashboard <ArrowRight size={15} /></Link>
              <Link href="/monitors/new" className="btn btn-ghost" data-testid="link-hero-monitor">Create a monitor <Plus size={15} /></Link>
            </div>
            <div className="hero-microcopy">NO AUTH REQUIRED · DEMO DATA ONLY · BUILT FOR A QUICK READ</div>
          </div>
          <div className="hero-visual" aria-label="Illustration of the EarlySignal dashboard">
            <div className="visual-frame">
              <div className="visual-bar"><i /><i /><i /><span className="visual-label">EARLYSIGNAL / OVERVIEW</span></div>
              <div className="visual-inner">
                <div className="visual-top"><span className="visual-heading">Signal overview</span><DemoBadge /></div>
                <div className="visual-metrics">
                  <div className="visual-metric"><small>Monitors</small><strong>04</strong></div>
                  <div className="visual-metric"><small>Changes</small><strong>04</strong></div>
                  <div className="visual-metric"><small>Priority</small><strong style={{ color: 'var(--coral)' }}>01</strong></div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <div className="visual-signal"><span className="visual-signal-dot coral" /><span>Competitor product price changed</span><time>2h ago</time></div>
                  <div className="visual-signal"><span className="visual-signal-dot amber" /><span>New product detected</span><time>3h ago</time></div>
                  <div className="visual-signal"><span className="visual-signal-dot blue" /><span>Website content changed</span><time>1d ago</time></div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="landing-section">
          <div className="eyebrow">A smaller signal surface</div>
          <div className="value-grid">
            <div className="value-item"><strong>Focused by design</strong><p>Four monitor types. A short list of changes. The context you need without a wall of noise.</p></div>
            <div className="value-item"><strong>Honest about uncertainty</strong><p>Every example is labeled demo data, and analysis uses cautious language rather than pretending to know the future.</p></div>
            <div className="value-item"><strong>Actionable at a glance</strong><p>Move from a signal to its source, history, and a considered next step in one clear path.</p></div>
          </div>
        </section>
      </main>
      <footer className="landing-footer">EARLYSIGNAL AI · DEMO ENVIRONMENT · NO LIVE INTELLIGENCE CONNECTED</footer>
    </div>
  );
}

function AppPage({ children }: { children: React.ReactNode }) {
  return <AppShell><div className="main-content">{children}</div></AppShell>;
}

function MetricCard({ label, value, detail, color, icon: Icon }: { label: string; value: number; detail: string; color: string; icon: typeof BarChart3 }) {
  return <div className="card metric-card" style={{ '--metric-color': color } as React.CSSProperties} data-testid={`metric-${label.toLowerCase().replaceAll(' ', '-')}`}><div className="metric-top"><span className="metric-label">{label}</span><Icon className="metric-icon" size={17} /></div><div className="metric-number">{String(value).padStart(2, '0')}</div><div className="metric-foot">{detail}</div></div>;
}

function SignalRow({ change, monitor }: { change: Change; monitor?: Monitor }) {
  return <Link href={`/changes/${change.id}`} className="signal-row" data-testid={`link-signal-${change.id}`}>
    <div className={`signal-severity ${change.severity.toLowerCase()}`}>{change.severity === 'High' ? <TriangleAlert size={16} /> : change.severity === 'Medium' ? <BellRing size={15} /> : <Info size={15} />}</div>
    <div><div className="signal-title">{change.title}</div><div className="signal-meta">{monitor?.name ?? 'Unknown monitor'} · <DataSourceBadge source={change.dataSource} /></div></div>
    <div className="signal-time">{getTimeAgo(change.detectedAt)}</div>
  </Link>;
}

export function DashboardPage() {
  const { monitors, changes } = useDemoData();
  const recentChanges = changes.slice().sort((a, b) => +new Date(b.detectedAt) - +new Date(a.detectedAt));
  const highCount = changes.filter((change) => change.severity === 'High').length;
  return <AppPage>
    <PageIntro eyebrow="Workspace / overview" title="Signal overview" description="A quiet place to notice what changed, understand the context, and decide what deserves your attention." action={<DemoBadge />} />
    <div className="metric-grid">
      <MetricCard label="Total Monitors" value={monitors.length} detail="Across your workspace" color="var(--cyan)" icon={Radar} />
      <MetricCard label="Active Monitors" value={monitors.filter((m) => m.status === 'active').length} detail="Checking in within demo" color="var(--blue)" icon={BarChart3} />
      <MetricCard label="Changes Detected" value={changes.length} detail="Illustrative history" color="var(--amber)" icon={TrendingDown} />
      <MetricCard label="High Priority Alerts" value={highCount} detail="Worth a closer look" color="var(--coral)" icon={TriangleAlert} />
    </div>
    <div className="dashboard-grid">
      <section className="card card-pad">
        <div className="section-heading"><h2>Recent signals</h2><span>{changes.length} recorded changes</span></div>
        <div className="signal-list">{recentChanges.map((change) => <SignalRow key={change.id} change={change} monitor={monitors.find((m) => m.id === change.monitorId)} />)}</div>
      </section>
      <aside className="card insight-card">
        <div className="insight-kicker">Read the room</div>
        <h2 className="insight-title">The useful signal is usually the second look.</h2>
        <p className="insight-copy">EarlySignal puts the source, previous value, and suggested next step next to the alert. Use the demo to practice a measured review loop.</p>
        <div className="insight-stat"><strong>{monitors.length} monitors</strong><span>configured in this workspace</span></div>
        <Link href="/monitors" className="btn btn-ghost btn-sm" style={{ marginTop: 18 }} data-testid="link-dashboard-monitors">Review monitors <ArrowRight size={13} /></Link>
      </aside>
    </div>
  </AppPage>;
}

function MonitorCard({ monitor, changes }: { monitor: Monitor; changes: Change[] }) {
  return <article className="card monitor-card" data-testid={`card-monitor-${monitor.id}`}>
    <div className="monitor-card-top"><div style={{ display: 'flex', gap: 12, minWidth: 0 }}><div className="monitor-symbol"><Globe2 size={18} /></div><div style={{ minWidth: 0 }}><h2 className="monitor-name">{monitor.name}</h2><a className="monitor-url" href={monitor.websiteUrl} target="_blank" rel="noreferrer" data-testid={`link-monitor-url-${monitor.id}`}>{monitor.websiteUrl.replace('https://', '')} <ExternalLink size={9} style={{ display: 'inline' }} /></a></div></div><StatusBadge status={monitor.status} /></div>
    <div className="monitor-tags"><span className="pill pill-active"><Tag size={10} /> {monitor.monitorType}</span>{monitor.monitorType !== 'Product Price' && <span className="pill pill-soon">Coming soon</span>}<DataSourceBadge source={monitor.checkSource} /></div>
    <div className="monitor-facts"><div><span className="fact-label">Last checked</span><span className="fact-value">{formatDateTime(monitor.lastChecked)}</span></div><div style={{ textAlign: 'right' }}><span className="fact-label">Detected changes</span><span className="fact-value">{String(changes.length).padStart(2, '0')}</span></div></div>
    <div className="monitor-actions"><Link href="/monitors/new" className="btn btn-ghost btn-sm" style={{ flex: 1 }} data-testid={`link-add-monitor-card-${monitor.id}`}><Plus size={13} /> Add monitor</Link><Link href={`/monitors/${monitor.id}`} className="btn btn-ghost btn-sm" style={{ flex: 1 }} data-testid={`link-view-monitor-${monitor.id}`}>View monitor <ChevronRight size={13} /></Link></div>
  </article>;
}

export function MonitorsPage() {
  const { monitors, changes } = useDemoData();
  const [filter, setFilter] = useState<'all' | 'active' | 'paused'>('all');
  const filtered = monitors.filter((monitor) => filter === 'all' || monitor.status === filter);
  return <AppPage>
    <PageIntro eyebrow="Workspace / monitors" title="Monitors" description="Keep a short list of places worth checking. Each card is a clear, deliberately scoped demo watch." action={<Link href="/monitors/new" className="btn btn-primary" data-testid="link-add-monitor"><Plus size={15} /> Add monitor</Link>} />
    <div className="list-toolbar"><div className="filter-wrap"><Search size={15} color="var(--dim)" /><span className="eyebrow">Filter view</span><select className="select" value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} aria-label="Filter monitors" data-testid="select-monitor-filter"><option value="all">All monitors</option><option value="active">Active only</option><option value="paused">Paused only</option></select></div><span className="mono" style={{ color: 'var(--dim)', fontSize: 10 }}>{filtered.length} visible</span></div>
    {filtered.length === 0 ? <EmptyState title="No monitors in this view" copy="Try another filter or add a monitor to start building your demo workspace." action={<Link href="/monitors/new" className="btn btn-primary btn-sm" data-testid="link-empty-add-monitor"><Plus size={14} /> Add monitor</Link>} /> : <div className="monitor-grid">{filtered.map((monitor) => <MonitorCard key={monitor.id} monitor={monitor} changes={changes.filter((change) => change.monitorId === monitor.id)} />)}</div>}
  </AppPage>;
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
      setError('The monitor could not be saved. Check that the database is available and try again.');
    }
  };
  return <AppPage>
    <PageIntro eyebrow="Workspace / monitors / new" title="Add a monitor" description="Define one focused watch. Run a manual website check from its detail page whenever you want an updated value." action={<DemoBadge />} />
    <div className="form-shell">
      <form className="card form-card" onSubmit={submit} noValidate>
        <div className="callout" style={{ marginBottom: 24 }}><strong>Manual checks only.</strong> New monitors are not checked automatically. Open the monitor detail page and select Check now to fetch its current product price.</div>
        <div className="field"><label htmlFor="monitor-name">Monitor Name</label><input id="monitor-name" className="input" value={name} onChange={(event) => { setName(event.target.value); setError(''); }} placeholder="e.g. Northstar Home Goods" data-testid="input-monitor-name" /><span className="field-hint">Use a name your future self can scan in one second.</span></div>
        <div className="field"><label htmlFor="website-url">Website URL</label><input id="website-url" className="input" value={websiteUrl} onChange={(event) => { setWebsiteUrl(event.target.value); setError(''); }} placeholder="https://example.com" data-testid="input-website-url" /><span className="field-hint">Enter a public website URL. Live checks currently support Product Price.</span></div>
        <div className="field"><label htmlFor="monitor-type">Monitor Type</label><select id="monitor-type" className="select" style={{ width: '100%' }} value={monitorType} onChange={(event) => setMonitorType(event.target.value as MonitorType)} data-testid="select-monitor-type"><option value="Product Price">Product Price</option><option value="Product Availability" disabled>Product Availability — Coming Soon</option><option value="Product Catalog" disabled>Product Catalog — Coming Soon</option><option value="Website Content" disabled>Website Content — Coming Soon</option></select><span className="field-hint">Product Price is available in this phase. Other monitor types are coming soon.</span></div>
        {error && <div className="form-error" role="alert" data-testid="text-monitor-form-error"><TriangleAlert size={13} style={{ verticalAlign: 'middle', marginRight: 5 }} />{error}</div>}
        <div className="form-actions"><Link href="/monitors" className="btn btn-ghost" data-testid="button-cancel-monitor"><X size={14} /> Cancel</Link><button className="btn btn-primary" type="submit" data-testid="button-create-monitor"><Check size={14} /> Create monitor</button></div>
      </form>
    </div>
  </AppPage>;
}

export function MonitorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { getMonitor, changes, toggleMonitorStatus, checkMonitor } = useDemoData();
  const [isChecking, setIsChecking] = useState(false);
  const [checkFeedback, setCheckFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const monitor = getMonitor(id);
  if (!monitor) return <InvalidState title="Monitor not found" copy="This demo monitor does not exist or may have been removed." href="/monitors" label="Back to monitors" />;
  const runCheck = async () => {
    setIsChecking(true);
    setCheckFeedback(null);
    try {
      const result = await checkMonitor(monitor.id);
      setCheckFeedback({ success: result.success, message: result.message });
    } catch {
      setCheckFeedback({ success: false, message: 'The website check could not be completed. Try again shortly.' });
    } finally {
      setIsChecking(false);
    }
  };
  const monitorChanges = changes.filter((change) => change.monitorId === monitor.id).sort((a, b) => +new Date(b.detectedAt) - +new Date(a.detectedAt));
  return <AppPage>
    <Link href="/monitors" className="btn btn-ghost btn-sm" style={{ marginBottom: 23 }} data-testid="link-back-monitors"><ArrowLeft size={13} /> All monitors</Link>
    <div className="detail-header"><div><div className="detail-title-row"><h1 className="detail-title">{monitor.name}</h1><StatusBadge status={monitor.status} /><DataSourceBadge source={monitor.checkSource} /></div><a className="detail-url" href={monitor.websiteUrl} target="_blank" rel="noreferrer" data-testid="link-detail-source">{monitor.websiteUrl} <ExternalLink size={10} style={{ display: 'inline' }} /></a></div><div className="monitor-detail-actions"><button className="btn btn-primary" type="button" onClick={runCheck} disabled={isChecking || monitor.monitorType !== 'Product Price'} title={monitor.monitorType !== 'Product Price' ? 'Live checks are available for Product Price monitors.' : undefined} data-testid="button-check-now">{isChecking ? <RefreshCw size={14} className="spin" /> : <RefreshCw size={14} />}{isChecking ? 'Checking…' : 'Check now'}</button><button className="btn btn-ghost" type="button" onClick={() => toggleMonitorStatus(monitor.id)} data-testid="button-toggle-monitor">{monitor.status === 'active' ? <><Pause size={14} /> Pause monitor</> : <><Play size={14} /> Resume monitor</>}</button></div></div>
    {checkFeedback && <div className={`check-feedback${checkFeedback.success ? '' : ' error'}`} role={checkFeedback.success ? 'status' : 'alert'} data-testid="text-check-feedback">{checkFeedback.message}</div>}
    <div className="detail-grid">
      <section className="card card-pad"><div className="section-heading"><h2>Change history</h2><span>{monitorChanges.length} recorded signals</span></div>{monitorChanges.length === 0 ? <EmptyState title="No changes detected yet." copy="Check this Product Price monitor to establish its first live value." /> : monitorChanges.map((change) => <div className="history-item" key={change.id}><div className="history-top"><Link href={`/changes/${change.id}`} className="history-title" data-testid={`link-history-change-${change.id}`}>{change.title}</Link><SeverityBadge severity={change.severity} /></div><p className="history-description">{change.description}</p><div className="history-values"><div className="value-box"><span className="value-box-label">Previous</span><span className="value-box-value">{change.oldValue}</span></div><div className="value-box"><span className="value-box-label">Current</span><span className="value-box-value">{change.newValue}</span></div></div><div className="signal-meta" style={{ marginTop: 12 }}>{formatDateTime(change.detectedAt)} · <DataSourceBadge source={change.dataSource} /></div></div>)}</section>
      <aside className="card card-pad"><div className="section-heading"><h2>Monitor details</h2><span>Read only</span></div><dl className="info-list"><div className="info-line"><dt>Type</dt><dd>{monitor.monitorType}</dd></div><div className="info-line"><dt>Status</dt><dd>{monitor.status}</dd></div><div className="info-line"><dt>Last price</dt><dd>{monitor.lastValue ?? 'Not captured'}</dd></div><div className="info-line"><dt>Created</dt><dd>{formatDate(monitor.createdAt)}</dd></div><div className="info-line"><dt>Last checked</dt><dd>{formatDateTime(monitor.lastChecked)}</dd></div><div className="info-line"><dt>Data mode</dt><dd style={{ color: monitor.checkSource === 'live' ? 'var(--cyan)' : 'var(--amber)' }}>{monitor.checkSource === 'live' ? 'Live check' : 'Demo data'}</dd></div></dl><div className="callout" style={{ marginTop: 22 }}>{monitor.checkSource === 'live' ? 'Checks are manual. Select Check now to fetch the latest product page value.' : 'This monitor retains its prepared demo history until you run a live check.'}</div></aside>
    </div>
  </AppPage>;
}

function InvalidState({ title, copy, href, label }: { title: string; copy: string; href: string; label: string }) {
  return <AppPage><div style={{ maxWidth: 600 }}><div className="eyebrow">Signal / unavailable</div><h1 className="page-title">{title}</h1><p className="page-subtitle">{copy}</p><Link href={href} className="btn btn-primary" style={{ marginTop: 24 }} data-testid="link-invalid-back"><ArrowLeft size={14} /> {label}</Link></div></AppPage>;
}

export function AlertsPage() {
  const { changes, monitors } = useDemoData();
  const sorted = changes.slice().sort((a, b) => +new Date(b.detectedAt) - +new Date(a.detectedAt));
  return <AppPage>
    <PageIntro eyebrow="Workspace / alerts" title="Alerts" description="A prioritized inbox for the changes that may deserve a considered second look." action={<DemoBadge />} />
    {sorted.length === 0 ? <EmptyState title="No alerts to review" copy="When changes are detected, they will appear here with context and a clear path forward." /> : <div className="alert-list">{sorted.map((change) => <div className="card alert-row" key={change.id} data-testid={`row-alert-${change.id}`}><div className={`severity-bar ${change.severity.toLowerCase()}`} /><div><div className="alert-title">{change.title}</div><div className="alert-meta">{monitors.find((m) => m.id === change.monitorId)?.name} · <DataSourceBadge source={change.dataSource} /></div><div className="signal-meta" style={{ marginTop: 8 }}>{change.description}</div></div><div><SeverityBadge severity={change.severity} /></div><div className="alert-date">{formatDateTime(change.detectedAt)}</div><Link href={`/changes/${change.id}`} className="btn btn-ghost btn-sm" data-testid={`link-alert-detail-${change.id}`}>View details <ChevronRight size={13} /></Link></div>)}</div>}
  </AppPage>;
}

export function ChangeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { getChange, getMonitor, getAnalysis } = useDemoData();
  const change = getChange(id);
  if (!change) return <InvalidState title="Change not found" copy="This demo signal is not part of the current prepared workspace." href="/alerts" label="Back to alerts" />;
  const monitor = getMonitor(change.monitorId);
  const analysis = getAnalysis(change.id);
  return <AppPage>
    <Link href="/alerts" className="btn btn-ghost btn-sm" style={{ marginBottom: 23 }} data-testid="link-back-alerts"><ArrowLeft size={13} /> All alerts</Link>
    <div className="change-layout">
      <div className="detail-title-row"><SeverityBadge severity={change.severity} /><DataSourceBadge source={change.dataSource} /></div>
      <h1 className="page-title" style={{ marginTop: 14 }}>{change.title}</h1>
      <p className="page-subtitle">{change.description}</p>
      <div className="card card-pad" style={{ marginTop: 25 }}><div className="section-heading"><h2>Change details</h2><span>{formatDateTime(change.detectedAt)}</span></div><dl className="info-list"><div className="info-line"><dt>Monitor</dt><dd><Link href={`/monitors/${monitor?.id}`} style={{ color: 'var(--blue)' }} data-testid="link-change-monitor">{monitor?.name ?? 'Unknown monitor'}</Link></dd></div><div className="info-line"><dt>Change type</dt><dd>{change.changeType}</dd></div><div className="info-line"><dt>Detected</dt><dd>{formatDateTime(change.detectedAt)}</dd></div><div className="info-line"><dt>Source</dt><dd><a href={change.sourceUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--blue)' }} data-testid="link-change-source">Open source <ExternalLink size={10} style={{ display: 'inline' }} /></a></dd></div></dl><div className="history-values" style={{ marginTop: 21 }}><div className="value-box"><span className="value-box-label">Previous value</span><span className="value-box-value">{change.oldValue}</span></div><div className="value-box"><span className="value-box-label">New value</span><span className="value-box-value">{change.newValue}</span></div></div></div>
      {analysis ? <section className="card analysis-card" data-testid="card-demo-ai-analysis"><div className="analysis-header"><div className="analysis-icon"><Sparkles size={17} /></div><div><h2>Demo AI Analysis</h2><p className="analysis-note">Illustrative interpretation · not live intelligence</p></div></div><div className="analysis-grid"><section><h3>Summary</h3><p>{analysis.summary}</p></section><section><h3>Why it may matter</h3><p>{analysis.whyItMatters}</p></section><section><h3>Suggested action</h3><p>{analysis.suggestedAction}</p></section></div></section> : <div className="callout" style={{ marginTop: 20 }}><strong>Demo AI Analysis unavailable.</strong> This prepared signal does not include an illustrative analysis.</div>}
    </div>
  </AppPage>;
}

export function SettingsPage() {
  const [signals, setSignals] = useState(true);
  const [compact, setCompact] = useState(false);
  return <AppPage>
    <PageIntro eyebrow="Workspace / settings" title="Settings" description="Small preferences for this demo workspace. Nothing here connects to an account or external service." action={<DemoBadge />} />
    <div className="settings-grid">
      <section className="card card-pad"><div className="section-heading"><h2>Demo preferences</h2><span>Saved locally</span></div><div className="setting-row"><div><div className="setting-name">Show prepared signals</div><div className="setting-description">Keep the illustrative signals visible across overview and alerts.</div></div><button className={`toggle${signals ? ' on' : ''}`} type="button" aria-label="Toggle prepared signals" aria-pressed={signals} onClick={() => setSignals(!signals)} data-testid="button-toggle-signals"><span /></button></div><div className="setting-row"><div><div className="setting-name">Compact monitor cards</div><div className="setting-description">A future layout preference, represented here for the demo.</div></div><button className={`toggle${compact ? ' on' : ''}`} type="button" aria-label="Toggle compact monitor cards" aria-pressed={compact} onClick={() => setCompact(!compact)} data-testid="button-toggle-compact"><span /></button></div></section>
      <aside className="card card-pad"><div className="section-heading"><h2>About this environment</h2><span>Important</span></div><div className="callout"><strong>Demo-only by design.</strong><br />EarlySignal AI does not authenticate users, fetch websites, send notifications, or claim live monitoring. Every monitor, change, and analysis shown in this workspace is centralized illustrative data.</div><div style={{ color: 'var(--dim)', fontSize: 11, lineHeight: 1.7, marginTop: 20 }}>Use this space to explore the workflow from a new monitor to a signal and its cautious suggested action.</div></aside>
    </div>
  </AppPage>;
}

export function NotFoundPage() {
  return <div className="not-found"><div><div className="eyebrow">404 / route not found</div><h1 className="page-title">That signal is off the map.</h1><p className="page-subtitle" style={{ marginInline: 'auto' }}>The page you requested is not part of this demo workspace.</p><Link href="/dashboard" className="btn btn-primary" style={{ marginTop: 23 }} data-testid="link-not-found-dashboard"><ArrowLeft size={14} /> Return to dashboard</Link></div></div>;
}