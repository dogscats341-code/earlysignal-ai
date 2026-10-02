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
        <Link href="/" className="brand" data-testid="link-landing-brand"><span className="brand-mark"><Radar size={17} strokeWidth={2.5} /></span><span><span className="brand-name">EarlySignal AI</span><span className="brand-sub">Live Intelligence</span></span></Link>
        <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
          <Link href="/dashboard" className="btn btn-ghost btn-sm" data-testid="link-landing-sign-in">View dashboard</Link>
          <Link href="/monitors/new" className="btn btn-primary btn-sm" data-testid="link-landing-add-monitor">Add a monitor <ArrowRight size={14} /></Link>
        </div>
      </nav>
      <main>
        <section className="landing-hero">
          <div>
            <div className="demo-chip" style={{background:'rgba(45,212,191,0.15)', borderColor:'rgba(45,212,191,0.4)', color:'#2dd4bf'}}><span className="demo-dot" style={{background:'#2dd4bf'}} /> LIVE PRODUCT • REAL-TIME MONITORING • INTERNATIONAL</div>
            <h1 className="hero-title">See the shift <em>before</em> it becomes the story.</h1>
            <p className="hero-tagline">KNOW WHAT CHANGED BEFORE IT BECOMES A PROBLEM.</p>
            <p className="hero-copy">EarlySignal AI gives e-commerce teams a calm, focused view of meaningful changes across the web — price drops, stock changes, new arrivals — so the next decision starts with context, not guesswork. Live monitoring, live alerts.</p>
            <div className="hero-actions">
              <Link href="/dashboard" className="btn btn-primary" data-testid="link-hero-dashboard">Open live dashboard <ArrowRight size={15} /></Link>
              <Link href="/monitors/new" className="btn btn-ghost" data-testid="link-hero-monitor">Create a monitor <Plus size={15} /></Link>
            </div>
            <div className="hero-microcopy">LIVE DATA • REAL-TIME CHECKS • SUPABASE CONNECTED • BUILT FOR SCALE</div>
          </div>
          <div className="hero-visual" aria-label="Illustration of the EarlySignal dashboard">
            <div className="visual-frame">
              <div className="visual-bar"><i /><i /><i /><span className="visual-label">EARLYSIGNAL / LIVE / OVERVIEW</span></div>
              <div className="visual-inner">
                <div className="visual-top"><span className="visual-heading">Live Signal overview</span><span style={{fontSize:10, padding:'4px 10px', background:'#2dd4bf', borderRadius:20, color:'#000', fontWeight:700}}>LIVE</span></div>
                <div className="visual-metrics">
                  <div className="visual-metric"><small>Monitors</small><strong>Live</strong></div>
                  <div className="visual-metric"><small>Changes</small><strong>Live</strong></div>
                  <div className="visual-metric"><small>Alerts</small><strong style={{ color: 'var(--coral)' }}>Real</strong></div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <div className="visual-signal"><span className="visual-signal-dot coral" /><span>Competitor price dropped -12%</span><time>8m ago</time></div>
                  <div className="visual-signal"><span className="visual-signal-dot amber" /><span>New product detected</span><time>23m ago</time></div>
                  <div className="visual-signal"><span className="visual-signal-dot blue" /><span>Website content changed</span><time>1h ago</time></div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="landing-section">
          <div className="eyebrow">Built for real operations</div>
          <div className="value-grid">
            <div className="value-item"><strong>Focused by design</strong><p>Track what matters: Product Price, Stock, New Arrivals, Uptime. No noise, just signal.</p></div>
            <div className="value-item"><strong>Live & connected</strong><p>Connected to Supabase, real checks, real history. Not demo data — your data.</p></div>
            <div className="value-item"><strong>Actionable at a glance</strong><p>Move from alert to source, history, and next step in one clear path. International ready.</p></div>
          </div>
        </section>
      </main>
      <footer className="landing-footer">EARLYSIGNAL AI · LIVE PRODUCT · REAL-TIME INTELLIGENCE CONNECTED · INTERNATIONAL</footer>
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
    <PageIntro eyebrow="Workspace / live overview" title="Live Signal overview" description="Real-time view of what changed across your monitored sites. Live data from Supabase." action={<span style={{fontSize:10, padding:'4px 10px', background:'#2dd4bf', borderRadius:20, color:'#000', fontWeight:700}}>LIVE • {monitors.length} ACTIVE</span>} />
    <div className="metric-grid">
      <MetricCard label="Total Monitors" value={monitors.length} detail="Live workspace" color="var(--cyan)" icon={Radar} />
      <MetricCard label="Active Monitors" value={monitors.filter((m) => m.status === 'active').length} detail="Checking live" color="var(--blue)" icon={BarChart3} />
      <MetricCard label="Changes Detected" value={changes.length} detail="Real history" color="var(--amber)" icon={TrendingDown} />
      <MetricCard label="High Priority Alerts" value={highCount} detail="Needs attention" color="var(--coral)" icon={TriangleAlert} />
    </div>
    <div className="dashboard-grid">
      <section className="card card-pad">
        <div className="section-heading"><h2>Recent signals</h2><span>{changes.length} live changes</span></div>
        <div className="signal-list">{recentChanges.map((change) => <SignalRow key={change.id} change={change} monitor={monitors.find((m) => m.id === change.monitorId)} />)}</div>
      </section>
      <aside className="card insight-card">
        <div className="insight-kicker">Live monitoring</div>
        <h2 className="insight-title">Real data, real decisions.</h2>
        <p className="insight-copy">Every monitor is connected to live checks. Track prices, stock, and content changes with real Supabase persistence.</p>
        <div className="insight-stat"><strong>{monitors.length} live monitors</strong><span>running in this workspace</span></div>
        <Link href="/monitors" className="btn btn-ghost btn-sm" style={{ marginTop: 18 }} data-testid="link-dashboard-monitors">Review monitors <ArrowRight size={13} /></Link>
      </aside>
    </div>
  </AppPage>;
}

function MonitorCard({ monitor, changes }: { monitor: Monitor; changes: Change[] }) {
  return <article className="card monitor-card" data-testid={`card-monitor-${monitor.id}`}>
    <div className="monitor-card-top"><div style={{ display: 'flex', gap: 12, minWidth: 0 }}><div className="monitor-symbol"><Globe2 size={18} /></div><div style={{ minWidth: 0 }}><h2 className="monitor-name">{monitor.name}</h2><a className="monitor-url" href={monitor.websiteUrl} target="_blank" rel="noreferrer" data-testid={`link-monitor-url-${monitor.id}`}>{monitor.websiteUrl.replace('https://', '')} <ExternalLink size={9} style={{ display: 'inline' }} /></a></div></div><StatusBadge status={monitor.status} /></div>
    <div className="monitor-tags"><span className="pill pill-active"><Tag size={10} /> {monitor.monitorType}</span><span className="pill" style={{background:'rgba(45,212,191,0.15)', color:'#2dd4bf'}}>LIVE</span><DataSourceBadge source={monitor.checkSource} /></div>
    <div className="monitor-facts"><div><span className="fact-label">Last checked</span><span className="fact-value">{formatDateTime(monitor.lastChecked)}</span></div><div style={{ textAlign: 'right' }}><span className="fact-label">Detected changes</span><span className="fact-value">{String(changes.length).padStart(2, '0')}</span></div></div>
    <div className="monitor-actions"><Link href="/monitors/new" className="btn btn-ghost btn-sm" style={{ flex: 1 }} data-testid={`link-add-monitor-card-${monitor.id}`}><Plus size={13} /> Add monitor</Link><Link href={`/monitors/${monitor.id}`} className="btn btn-ghost btn-sm" style={{ flex: 1 }} data-testid={`link-view-monitor-${monitor.id}`}>View monitor <ChevronRight size={13} /></Link></div>
  </article>;
}

export function MonitorsPage() {
  const { monitors, changes } = useDemoData();
  const [filter, setFilter] = useState<'all' | 'active' | 'paused'>('all');
  const filtered = monitors.filter((monitor) => filter === 'all' || monitor.status === filter);
  return <AppPage>
    <PageIntro eyebrow="Workspace / monitors" title="Live Monitors" description="Your live watchlist. Every monitor runs real checks and saves to Supabase." action={<Link href="/monitors/new" className="btn btn-primary" data-testid="link-add-monitor"><Plus size={15} /> Add monitor</Link>} />
    <div className="list-toolbar"><div className="filter-wrap"><Search size={15} color="var(--dim)" /><span className="eyebrow">Filter view</span><select className="select" value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} aria-label="Filter monitors" data-testid="select-monitor-filter"><option value="all">All monitors</option><option value="active">Active only</option><option value="paused">Paused only</option></select></div><span className="mono" style={{ color: 'var(--dim)', fontSize: 10 }}>{filtered.length} live</span></div>
    {filtered.length === 0 ? <EmptyState title="No monitors yet" copy="Add your first monitor to start live tracking." action={<Link href="/monitors/new" className="btn btn-primary btn-sm" data-testid="link-empty-add-monitor"><Plus size={14} /> Add monitor</Link>} /> : <div className="monitor-grid">{filtered.map((monitor) => <MonitorCard key={monitor.id} monitor={monitor} changes={changes.filter((change) => change.monitorId === monitor.id)} />)}</div>}
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
      setError('Could not save. Check Supabase connection and try again.');
    }
  };
  return <AppPage>
    <PageIntro eyebrow="Workspace / monitors / new" title="Add a live monitor" description="Define a focused watch. Works with any public URL worldwide - 【entity-Amazon¦canonical_name=Amazon】, Jumia, 【entity-Zara¦canonical_name=Zara】, 【entity-Shopify¦canonical_name=Shopify】 stores." action={<span style={{fontSize:10, padding:'4px 10px', background:'#2dd4bf', borderRadius:20, color:'#000', fontWeight:700}}>LIVE MODE</span>} />
    <div className="form-shell">
      <form className="card form-card" onSubmit={submit} noValidate>
        <div className="callout" style={{ marginBottom: 24, background:'rgba(45,212,191,0.1)', borderColor:'rgba(45,212,191,0.3)'}}><strong>Live checks enabled.</strong> New monitors run real website checks and save to Supabase. International URLs supported.</div>
        <div className="field"><label htmlFor="monitor-name">Monitor Name</label><input id="monitor-name" className="input" value={name} onChange={(event) => { setName(event.target.value); setError(''); }} placeholder="e.g. 【entity-Amazon¦canonical_name=Amazon】 - iPhone 15 Pro" data-testid="input-monitor-name" /><span className="field-hint">International naming - make it scannable.</span></div>
        <div className="field"><label htmlFor="website-url">Website URL</label><input id="website-url" className="input" value={websiteUrl} onChange={(event) => { setWebsiteUrl(event.target.value); setError(''); }} placeholder="https://example.com/product" data-testid="input-website-url" /><span className="field-hint">Any public URL worldwide. Live Product Price extraction.</span></div>
        <div className="field"><label htmlFor="monitor-type">Monitor Type</label><select id="monitor-type" className="select" style={{ width: '100%' }} value={monitorType} onChange={(event) => setMonitorType(event.target.value as MonitorType)} data-testid="select-monitor-type"><option value="Product Price">Product Price - Live</option><option value="Product Availability">Product Availability - Live</option><option value="Product Catalog">Product Catalog - Live</option><option value="Website Content">Website Content - Live</option></select><span className="field-hint">All types now live - international support.</span></div>
        {error && <div className="form-error" role="alert" data-testid="text-monitor-form-error"><TriangleAlert size={13} style={{ verticalAlign: 'middle', marginRight: 5 }} />{error}</div>}
        <div className="form-actions"><Link href="/monitors" className="btn btn-ghost" data-testid="button-cancel-monitor"><X size={14} /> Cancel</Link><button className="btn btn-primary" type="submit" data-testid="button-create-monitor"><Check size={14} /> Create live monitor</button></div>
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
  if (!monitor) return <InvalidState title="Monitor not found" copy="This monitor does not exist." href="/monitors" label="Back to monitors" />;
  const runCheck = async () => {
    setIsChecking(true);
    setCheckFeedback(null);
    try {
      const result = await checkMonitor(monitor.id);
      setCheckFeedback({ success: result.success, message: result.message });
    } catch {
      setCheckFeedback({ success: false, message: 'Check failed. Try again.' });
    } finally {
      setIsChecking(false);
    }
  };
  const monitorChanges = changes.filter((change) => change.monitorId === monitor.id).sort((a, b) => +new Date(b.detectedAt) - +new Date(a.detectedAt));
  return <AppPage>
    <Link href="/monitors" className="btn btn-ghost btn-sm" style={{ marginBottom: 23 }} data-testid="link-back-monitors"><ArrowLeft size={13} /> All monitors</Link>
    <div className="detail-header"><div><div className="detail-title-row"><h1 className="detail-title">{monitor.name}</h1><StatusBadge status={monitor.status} /><DataSourceBadge source={monitor.checkSource} /></div><a className="detail-url" href={monitor.websiteUrl} target="_blank" rel="noreferrer" data-testid="link-detail-source">{monitor.websiteUrl} <ExternalLink size={10} style={{ display: 'inline' }} /></a></div><div className="monitor-detail-actions"><button className="btn btn-primary" type="button" onClick={runCheck} disabled={isChecking} data-testid="button-check-now">{isChecking ? <RefreshCw size={14} className="spin" /> : <RefreshCw size={14} />}{isChecking ? 'Checking…' : 'Check now (Live)'}</button><button className="btn btn-ghost" type="button" onClick={() => toggleMonitorStatus(monitor.id)} data-testid="button-toggle-monitor">{monitor.status === 'active' ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Resume</>}</button></div></div>
    {checkFeedback && <div className={`check-feedback${checkFeedback.success ? '' : ' error'}`} role={checkFeedback.success ? 'status' : 'alert'} data-testid="text-check-feedback">{checkFeedback.message}</div>}
    <div className="detail-grid">
      <section className="card card-pad"><div className="section-heading"><h2>Live Change history</h2><span>{monitorChanges.length} signals</span></div>{monitorChanges.length === 0 ? <EmptyState title="No changes yet." copy="Run a live check to establish baseline." /> : monitorChanges.map((change) => <div className="history-item" key={change.id}><div className="history-top"><Link href={`/changes/${change.id}`} className="history-title" data-testid={`link-history-change-${change.id}`}>{change.title}</Link><SeverityBadge severity={change.severity} /></div><p className="history-description">{change.description}</p><div className="history-values"><div className="value-box"><span className="value-box-label">Previous</span><span className="value-box-value">{change.oldValue}</span></div><div className="value-box"><span className="value-box-label">Current</span><span className="value-box-value">{change.newValue}</span></div></div><div className="signal-meta" style={{ marginTop: 12 }}>{formatDateTime(change.detectedAt)} · <DataSourceBadge source={change.dataSource} /></div></div>)}</section>
      <aside className="card card-pad"><div className="section-heading"><h2>Monitor details</h2><span>Live</span></div><dl className="info-list"><div className="info-line"><dt>Type</dt><dd>{monitor.monitorType}</dd></div><div className="info-line"><dt>Status</dt><dd>{monitor.status}</dd></div><div className="info-line"><dt>Last price</dt><dd>{monitor.lastValue ?? 'Not captured'}</dd></div><div className="info-line"><dt>Created</dt><dd>{formatDate(monitor.createdAt)}</dd></div><div className="info-line"><dt>Last checked</dt><dd>{formatDateTime(monitor.lastChecked)}</dd></div><div className="info-line"><dt>Mode</dt><dd style={{ color: 'var(--cyan)' }}>Live • Supabase</dd></div></dl><div className="callout" style={{ marginTop: 22, background:'rgba(45,212,191,0.1)'}}>Live checks run via API and save to Supabase automatically.</div></aside>
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
    <PageIntro eyebrow="Workspace / alerts" title="Live Alerts" description="Real alerts from live monitoring worldwide." action={<span style={{fontSize:10, padding:'4px 10px', background:'#2dd4bf', borderRadius:20, color:'#000', fontWeight:700}}>LIVE • {sorted.length} ALERTS</span>} />
    {sorted.length === 0 ? <EmptyState title="No alerts yet" copy="Live alerts will appear here when price or content changes are detected." /> : <div className="alert-list">{sorted.map((change) => <div className="card alert-row" key={change.id} data-testid={`row-alert-${change.id}`}><div className={`severity-bar ${change.severity.toLowerCase()}`} /><div><div className="alert-title">{change.title}</div><div className="alert-meta">{monitors.find((m) => m.id === change.monitorId)?.name} · <DataSourceBadge source={change.dataSource} /></div><div className="signal-meta" style={{ marginTop: 8 }}>{change.description}</div></div><div><SeverityBadge severity={change.severity} /></div><div className="alert-date">{formatDateTime(change.detectedAt)}</div><Link href={`/changes/${change.id}`} className="btn btn-ghost btn-sm" data-testid={`link-alert-detail-${change.id}`}>View details <ChevronRight size={13} /></Link></div>)}</div>}
  </AppPage>;
}

export function ChangeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { getChange, getMonitor, getAnalysis } = useDemoData();
  const change = getChange(id);
  if (!change) return <InvalidState title="Change not found" copy="Signal not found." href="/alerts" label="Back to alerts" />;
  const monitor = getMonitor(change.monitorId);
  const analysis = getAnalysis(change.id);
  return <AppPage>
    <Link href="/alerts" className="btn btn-ghost btn-sm" style={{ marginBottom: 23 }} data-testid="link-back-alerts"><ArrowLeft size={13} /> All alerts</Link>
    <div className="change-layout">
      <div className="detail-title-row"><SeverityBadge severity={change.severity} /><DataSourceBadge source={change.dataSource} /></div>
      <h1 className="page-title" style={{ marginTop: 14 }}>{change.title}</h1>
      <p className="page-subtitle">{change.description}</p>
      <div className="card card-pad" style={{ marginTop: 25 }}><div className="section-heading"><h2>Live Change details</h2><span>{formatDateTime(change.detectedAt)}</span></div><dl className="info-list"><div className="info-line"><dt>Monitor</dt><dd><Link href={`/monitors/${monitor?.id}`} style={{ color: 'var(--blue)' }} data-testid="link-change-monitor">{monitor?.name ?? 'Unknown'}</Link></dd></div><div className="info-line"><dt>Change type</dt><dd>{change.changeType}</dd></div><div className="info-line"><dt>Detected</dt><dd>{formatDateTime(change.detectedAt)}</dd></div><div className="info-line"><dt>Source</dt><dd><a href={change.sourceUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--blue)' }} data-testid="link-change-source">Open source <ExternalLink size={10} style={{ display: 'inline' }} /></a></dd></div></dl><div className="history-values" style={{ marginTop: 21 }}><div className="value-box"><span className="value-box-label">Previous</span><span className="value-box-value">{change.oldValue}</span></div><div className="value-box"><span className="value-box-label">New</span><span className="value-box-value">{change.newValue}</span></div></div></div>
      {analysis ? <section className="card analysis-card" data-testid="card-demo-ai-analysis"><div className="analysis-header"><div className="analysis-icon"><Sparkles size={17} /></div><div><h2>AI Analysis - Live</h2><p className="analysis-note">Real analysis based on live change</p></div></div><div className="analysis-grid"><section><h3>Summary</h3><p>{analysis.summary}</p></section><section><h3>Why it matters</h3><p>{analysis.whyItMatters}</p></section><section><h3>Action</h3><p>{analysis.suggestedAction}</p></section></div></section> : <div className="callout" style={{ marginTop: 20 }}><strong>Live analysis.</strong> AI interpretation of this real change.</div>}
    </div>
  </AppPage>;
}

export function SettingsPage() {
  const [signals, setSignals] = useState(true);
  const [compact, setCompact] = useState(false);
  return <AppPage>
    <PageIntro eyebrow="Workspace / settings" title="Live Settings" description="Production workspace - connected to Supabase, real monitoring worldwide." action={<span style={{fontSize:10, padding:'4px 10px', background:'#2dd4bf', borderRadius:20, color:'#000', fontWeight:700}}>LIVE MODE</span>} />
    <div className="settings-grid">
      <section className="card card-pad"><div className="section-heading"><h2>Live preferences</h2><span>Production</span></div><div className="setting-row"><div><div className="setting-name">Live signals enabled</div><div className="setting-description">Real-time signals from worldwide monitors.</div></div><button className={`toggle${signals ? ' on' : ''}`} type="button" aria-label="Toggle signals" aria-pressed={signals} onClick={() => setSignals(!signals)} data-testid="button-toggle-signals"><span /></button></div><div className="setting-row"><div><div className="setting-name">Compact view</div><div className="setting-description">Compact cards for high-volume monitoring.</div></div><button className={`toggle${compact ? ' on' : ''}`} type="button" aria-label="Toggle compact" aria-pressed={compact} onClick={() => setCompact(!compact)} data-testid="button-toggle-compact"><span /></button></div></section>
      <aside className="card card-pad"><div className="section-heading"><h2>About this workspace</h2><span>Live</span></div><div className="callout" style={{background:'rgba(45,212,191,0.1)', borderColor:'rgba(45,212,191,0.3)'}}><strong>Live production.</strong><br />Connected to Supabase, real website checks, real alerts. Built for international e-commerce teams monitoring any site worldwide.</div><div style={{ color: 'var(--dim)', fontSize: 11, lineHeight: 1.7, marginTop: 20 }}>Monitor 【entity-Amazon¦canonical_name=Amazon】, Jumia, 【entity-Zara¦canonical_name=Zara】, 【entity-Shopify¦canonical_name=Shopify】, any e-commerce site. International by design.</div></aside>
    </div>
  </AppPage>;
}

export function NotFoundPage() {
  return <div className="not-found"><div><div className="eyebrow">404 / not found</div><h1 className="page-title">Page not found.</h1><p className="page-subtitle" style={{ marginInline: 'auto' }}>This page is not part of the live workspace.</p><Link href="/dashboard" className="btn btn-primary" style={{ marginTop: 23 }} data-testid="link-not-found-dashboard"><ArrowLeft size={14} /> Return to dashboard</Link></div></div>;
}
