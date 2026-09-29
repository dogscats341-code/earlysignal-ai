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
    <span className="brand" aria-label="EarlySignal AI">
      <span className="brand-mark"><Activity size={17} strokeWidth={2.5} /></span>
      {!compact && <span><span className="brand-name">EarlySignal AI</span><span className="brand-sub">Operational clarity</span></span>}
    </span>
  );
}

function Navigation({ mobile = false }: { mobile?: boolean }) {
  const [location] = useLocation();
  return (
    <nav aria-label="Main navigation" className={mobile ? 'nav-list' : 'nav-list'}>
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
        <Logo />
        <Link href="/monitors/new" className="btn btn-primary btn-sm" data-testid="link-mobile-add-monitor"><Plus size={14} /> Add monitor</Link>
      </div>
      <div className="app-layout">
        <aside className="sidebar">
          <Link href="/dashboard" className="brand" data-testid="link-brand-dashboard"><Logo /></Link>
          <div className="nav-section">
            <div className="eyebrow">Workspace</div>
            <Navigation />
          </div>
          <div className="sidebar-foot">
            <span className="demo-chip"><span className="demo-dot" /> Demo environment</span>
            <p>Signals are illustrative. No live monitoring is connected.</p>
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

export function StatusBadge({ status }: { status: 'active' | 'paused' }) {
  return <span className={`pill pill-${status}`} data-testid={`status-monitor-${status}`}><span className="demo-dot" style={{ background: status === 'active' ? 'var(--cyan)' : '#9da9bb', boxShadow: 'none' }} /> {status}</span>;
}

export function SeverityBadge({ severity }: { severity: 'Low' | 'Medium' | 'High' }) {
  return <span className={`pill pill-${severity.toLowerCase()}`} data-testid={`status-severity-${severity.toLowerCase()}`}>{severity} priority</span>;
}

export function SparkleIcon() {
  return <Sparkles size={16} />;
}

export function EmptyState({ title, copy, action }: { title: string; copy: string; action?: React.ReactNode }) {
  return <div className="card empty-state"><div className="empty-icon"><ListChecks size={21} /></div><h2>{title}</h2><p>{copy}</p>{action}</div>;
}