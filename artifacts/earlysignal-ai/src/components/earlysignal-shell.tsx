import React from 'react';
import { useLocation } from 'wouter';

export function DemoBadge() {
  return <span className="badge badge-demo">LIVE ENGINE</span>;
}

export function StatusBadge({ status }: { status: string }) {
  const isOk = status === 'active';
  return (
    <span className={`badge ${isOk ? 'badge-active' : 'badge-paused'}`}>
      <span className="dot" />
      {status.toUpperCase()}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: string }) {
  const className =
    severity === 'High' ? 'badge-high' : severity === 'Medium' ? 'badge-medium' : 'badge-low';
  return <span className={`badge ${className}`}>{severity}</span>;
}

export function DataSourceBadge({ source }: { source: string }) {
  return <span className="badge badge-source">{source.toUpperCase()}</span>;
}

export function PageIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="page-intro">
      <div className="eyebrow">{eyebrow}</div>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}

export function EmptyState({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">✓</div>
      <h3>{title}</h3>
      <p>{copy}</p>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();

  const navItems = [
    { label: 'Overview', path: '/dashboard' },
    { label: 'Monitors', path: '/monitors' },
    { label: 'Alerts', path: '/alerts' },
  ];

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-brand" onClick={() => setLocation('/')} style={{ cursor: 'pointer' }}>
          <div className="brand-logo">~</div>
          <div>
            <div className="brand-name">EarlySignal AI</div>
            <div className="brand-tagline">OPERATIONAL CLARITY</div>
          </div>
        </div>
        <nav className="header-nav">
          {navItems.map((item) => (
            <button
              key={item.path}
              className={`nav-link ${location === item.path ? 'active' : ''}`}
              onClick={() => setLocation(item.path)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <button className="btn btn-primary btn-sm" onClick={() => setLocation('/monitors/new')}>
          + Add monitor
        </button>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}

export function AppPage({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
