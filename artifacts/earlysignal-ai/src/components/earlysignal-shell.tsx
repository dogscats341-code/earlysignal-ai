import {
  Activity,
  Bell,
  LayoutDashboard,
  ListChecks,
  Plus,
  Settings,
  ShieldAlert,
  Sparkles,
  Target,
} from 'lucide-react';
import { Link, useLocation } from 'wouter';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/monitors', label: 'Monitors', icon: Target },
  { href: '/alerts', label: 'Alerts', icon: Bell },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="brand" aria-label="EarlySignal AI" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span className="brand-mark" style={{ width: '32px', height: '32px', background: '#5ee9c8', borderRadius: '8px', display: 'grid', placeItems: 'center', color: '#000' }}>
        <Activity size={17} strokeWidth={2.5} />
      </span>
      {!compact && (
        <span>
          <span className="brand-name" style={{ color: 'white', fontWeight: 700, fontSize: '16px' }}>EarlySignal AI</span>
          <span className="brand-sub" style={{ display: 'block', fontSize: '9px', letterSpacing: '1.5px', color: '#8a9ba8', textTransform: 'uppercase' }}>Operational clarity</span>
        </span>
      )}
    </span>
  );
}

function Navigation({ mobile = false }: { mobile?: boolean }) {
  const [location] = useLocation();
  return (
    <nav aria-label="Main navigation" className="nav-list">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = location === href || (href === '/monitors' && location.startsWith('/monitors/'));
        return (
          <Link key={href} href={href} className={`nav-link${active ? ' active' : ''}`} data-testid={`link-nav-${label.toLowerCase()}`}>
            <Icon className="nav-icon" strokeWidth={1.8} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <div className="mobile-topbar">
        <a href="/" style={{ textDecoration: 'none', cursor: 'pointer', display: 'flex' }} data-testid="link-logo-home-mobile">
          <Logo />
        </a>
        <Link href="/monitors/new" className="btn btn-primary btn-sm" data-testid="link-mobile-add-monitor">
          <Plus size={14} /> Add monitor
        </Link>
      </div>
      <div className="app-layout">
        <aside className="sidebar">
          <a href="/" style={{ textDecoration: 'none', cursor: 'pointer', display: 'block' }} data-testid="link-logo-home">
            <Logo />
          </a>
          <div className="nav-section">
            <div className="eyebrow">Workspace</div>
            <Navigation />
          </div>
          <div className="sidebar-foot">
            <span className="demo-chip" style={{ background: 'rgba(45,212,191,0.15)', borderColor: 'rgba(45,212,191,0.4)', color: '#2dd4bf' }}>
              <span className="demo-dot" style={{ background: '#2dd4bf' }} /> LIVE • International
            </span>
            <p>Live monitoring active. Worldwide checks.</p>
          </div>
        </aside>
        <main className="main-area">{children}</main>
      </div>
    </div>
  );
}

export function DemoBadge() {
  return <span className="pill pill-demo" data-testid="status-demo-data"><ShieldAlert size={11} /> Demo data</span>;
}

export function DataSourceBadge({ source }: { source?: string }) {
  if (!source || source === 'demo') return <DemoBadge />;
  return (
    <span className="pill pill-live" data-testid="status-live-check" style={{ background: 'rgba(45,212,191,0.15)', color: '#2dd4bf', borderColor: 'rgba(45,212,191,0.3)' }}>
      <Activity size={11} /> {source === 'live' ? 'Live check' : source}
    </span>
  );
}

export function PageIntro({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <header className="page-header">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1 className="page-title">{title}</h1>
        {description && <p className="page-subtitle">{description}</p>}
      </div>
      {action}
    </header>
  );
}

export function StatusBadge({ status }: { status: 'active' | 'paused' | string }) {
  const isAct = status?.toLowerCase() === 'active';
  return (
    <span className={`pill pill-${isAct ? 'active' : 'paused'}`} data-testid={`status-monitor-${status}`}>
      <span className="demo-dot" style={{ background: isAct ? 'var(--cyan, #2dd4bf)' : '#9da9bb', boxShadow: 'none' }} /> {status}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: 'Low' | 'Medium' | 'High' | string }) {
  const sev = (severity || 'low').toLowerCase();
  return <span className={`pill pill-${sev}`} data-testid={`status-severity-${sev}`}>{severity} priority</span>;
}

export function SparkleIcon() {
  return <Sparkles size={16} />;
}

export function EmptyState({ title, copy, action }: { title: string; copy: string; action?: React.ReactNode }) {
  return (
    <div className="card empty-state">
      <div className="empty-icon">
        <ListChecks size={21} />
      </div>
      <h2>{title}</h2>
      <p>{copy}</p>
      {action}
    </div>
  );
}
