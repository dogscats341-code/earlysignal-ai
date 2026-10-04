import React, { useState } from 'react';

// Common Badge Components
export function StatusBadge({ status }: { status: string }) {
  const isLive = status === 'ACTIVE' || status === 'LIVE';
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 10px',
      borderRadius: '20px',
      fontSize: '11px',
      fontWeight: 700,
      textTransform: 'uppercase',
      background: isLive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
      color: isLive ? '#10b981' : '#ef4444',
      border: `1px solid ${isLive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: isLive ? '#10b981' : '#ef4444' }} />
      {status}
    </span>
  );
}

export function DataSourceBadge({ source }: { source: string }) {
  return (
    <span style={{
      padding: '3px 8px',
      borderRadius: '6px',
      fontSize: '11px',
      fontWeight: 600,
      background: '#1e293b',
      color: '#94a3b8',
      border: '1px solid #334155'
    }}>
      ⚡ {source}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: string }) {
  return (
    <span style={{
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: '10px',
      fontWeight: 700,
      background: '#334155',
      color: '#f8fafc'
    }}>
      {severity}
    </span>
  );
}

export function DemoBadge() {
  return (
    <span style={{
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: '10px',
      background: '#f59e0b',
      color: '#000',
      fontWeight: 800
    }}>
      DEMO MODE
    </span>
  );
}

export function PageIntro({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <h1 className="responsive-title" style={{ fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>{title}</h1>
      <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '6px' }}>{subtitle}</p>
    </div>
  );
}

export function EmptyState({ title, message, onAction }: { title: string; message: string; onAction?: () => void }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '48px 24px',
      background: '#0f172a',
      borderRadius: '16px',
      border: '1px border-style dashed #334155',
      margin: '20px 0'
    }}>
      <h3 style={{ fontSize: '18px', color: '#f8fafc', marginBottom: '8px' }}>{title}</h3>
      <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>{message}</p>
      {onAction && (
        <button onClick={onAction} className="btn-primary-glow">
          + Add First Monitor
        </button>
      )}
    </div>
  );
}

// App Shell Wrapper with Responsive CSS Injection
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#090d16', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Global Responsive Styles */}
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        .container-app {
          max-width: 1200px;
          margin: 0 auto;
          padding: 16px;
        }

        .responsive-title {
          font-size: clamp(1.5rem, 4vw, 2.5rem);
          line-height: 1.2;
        }

        .btn-primary-glow {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: #ffffff;
          font-weight: 700;
          padding: 12px 24px;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(16, 185, 129, 0.35);
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 14px;
        }

        .btn-primary-glow:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(16, 185, 129, 0.5);
        }

        .btn-primary-glow:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .btn-secondary {
          background: #1e293b;
          color: #e2e8f0;
          font-weight: 600;
          padding: 10px 18px;
          border-radius: 8px;
          border: 1px solid #334155;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-secondary:hover {
          background: #334155;
        }

        /* Mobile Responsive Card Grid Transformation */
        .desktop-table {
          width: 100%;
          border-collapse: collapse;
        }

        .desktop-table th {
          text-align: left;
          padding: 12px 16px;
          color: #64748b;
          font-size: 12px;
          text-transform: uppercase;
          border-bottom: 1px solid #1e293b;
        }

        .desktop-table td {
          padding: 16px;
          border-bottom: 1px solid #1e293b;
        }

        @media (max-width: 768px) {
          .desktop-table, .desktop-table tbody, .desktop-table tr, .desktop-table td {
            display: block;
            width: 100%;
          }

          .desktop-table thead {
            display: none;
          }

          .desktop-table tr {
            background: #0f172a;
            border-radius: 12px;
            border: 1px solid #1e293b;
            margin-bottom: 16px;
            padding: 16px;
          }

          .desktop-table td {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid rgba(255,255,255,0.05);
            text-align: right;
          }

          .desktop-table td::before {
            content: attr(data-label);
            font-weight: 600;
            color: #64748b;
            font-size: 12px;
            text-transform: uppercase;
          }

          .desktop-table td:last-child {
            border-bottom: none;
            padding-top: 12px;
            justify-content: flex-end;
          }
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          z-index: 1000;
        }

        .modal-box {
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: 16px;
          width: 100%;
          max-width: 500px;
          padding: 24px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.5);
        }

        .input-field {
          width: 100%;
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 8px;
          padding: 12px 16px;
          color: #fff;
          font-size: 14px;
          outline: none;
          margin-top: 6px;
          margin-bottom: 16px;
        }

        .input-field:focus {
          border-color: #10b981;
          box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
        }
      `}</style>

      {/* Header */}
      <header style={{ borderBottom: '1px solid #1e293b', background: '#0b1329', padding: '16px 0' }}>
        <div className="container-app" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#000' }}>⚡</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '18px', color: '#fff' }}>EarlySignal AI</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>OPERATIONAL CLARITY</div>
            </div>
          </div>
          <a href="/dashboard" className="btn-secondary" style={{ textDecoration: 'none', fontSize: '12px' }}>Workspace</a>
        </div>
      </header>

      {/* Body Content */}
      <main className="container-app" style={{ paddingTop: '24px', paddingBottom: '60px' }}>
        {children}
      </main>
    </div>
  );
}
