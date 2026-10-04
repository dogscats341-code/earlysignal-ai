import React from "react";

/* =========================================================
   EarlySignal AI — Application Shell
   Shared layout and UI primitives for the MVP.
========================================================= */

/* =========================================================
   Theme
========================================================= */

const colors = {
  background: "#090d16",
  header: "#0b1329",
  surface: "#0f172a",
  surfaceHover: "#111c31",
  border: "#1e293b",
  borderStrong: "#334155",

  text: "#f8fafc",
  textSecondary: "#cbd5e1",
  textMuted: "#94a3b8",
  textDim: "#64748b",

  primary: "#10b981",
  primaryDark: "#059669",

  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#38bdf8",
};

/* =========================================================
   Common Badge Components
========================================================= */

export function StatusBadge({
  status,
}: {
  status: string;
}) {
  const normalized = status.toUpperCase();

  const isPositive =
    normalized === "ACTIVE" ||
    normalized === "LIVE" ||
    normalized === "COMPLETED";

  const isWarning =
    normalized === "PAUSED" ||
    normalized === "CHECKING";

  const background = isPositive
    ? "rgba(16, 185, 129, 0.12)"
    : isWarning
      ? "rgba(245, 158, 11, 0.12)"
      : "rgba(239, 68, 68, 0.12)";

  const color = isPositive
    ? colors.primary
    : isWarning
      ? colors.warning
      : colors.danger;

  const border = isPositive
    ? "rgba(16, 185, 129, 0.28)"
    : isWarning
      ? "rgba(245, 158, 11, 0.28)"
      : "rgba(239, 68, 68, 0.28)";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 9px",
        borderRadius: "999px",
        fontSize: "11px",
        fontWeight: 700,
        lineHeight: 1,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        background,
        color,
        border: `1px solid ${border}`,
        whiteSpace: "nowrap",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: color,
          flexShrink: 0,
        }}
      />

      {status}
    </span>
  );
}

/* =========================================================
   Data Source Badge
========================================================= */

export function DataSourceBadge({
  source,
}: {
  source: string;
}) {
  const isDemo =
    source.toLowerCase().includes("demo");

  return (
    <span
      title={
        isDemo
          ? "This information comes from demo data."
          : `Data source: ${source}`
      }
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 8px",
        borderRadius: "6px",
        fontSize: "11px",
        fontWeight: 600,
        lineHeight: 1.2,
        background: isDemo
          ? "rgba(245, 158, 11, 0.10)"
          : colors.surface,
        color: isDemo
          ? "#fbbf24"
          : colors.textMuted,
        border: `1px solid ${
          isDemo
            ? "rgba(245, 158, 11, 0.25)"
            : colors.borderStrong
        }`,
        maxWidth: "100%",
      }}
    >
      <span aria-hidden="true">⚡</span>

      <span
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {source}
      </span>
    </span>
  );
}

/* =========================================================
   Severity Badge
========================================================= */

export function SeverityBadge({
  severity,
}: {
  severity: string;
}) {
  const normalized = severity.toLowerCase();

  const color =
    normalized === "high"
      ? colors.danger
      : normalized === "medium"
        ? colors.warning
        : colors.info;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 8px",
        borderRadius: "5px",
        fontSize: "10px",
        fontWeight: 800,
        lineHeight: 1.2,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        background: `${color}18`,
        color,
        border: `1px solid ${color}35`,
        whiteSpace: "nowrap",
      }}
    >
      {severity}
    </span>
  );
}

/* =========================================================
   Demo Badge
========================================================= */

export function DemoBadge() {
  return (
    <span
      title="This feature currently uses demonstration data."
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 8px",
        borderRadius: "5px",
        fontSize: "10px",
        lineHeight: 1.2,
        background: "rgba(245, 158, 11, 0.14)",
        color: "#fbbf24",
        border: "1px solid rgba(245, 158, 11, 0.28)",
        fontWeight: 800,
        letterSpacing: "0.04em",
        whiteSpace: "nowrap",
      }}
    >
      DEMO DATA
    </span>
  );
}

/* =========================================================
   Page Intro
========================================================= */

export function PageIntro({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div
      style={{
        marginBottom: "28px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          flexWrap: "wrap",
          marginBottom: "8px",
        }}
      >
        <h1
          className="responsive-title"
          style={{
            fontWeight: 800,
            color: colors.text,
            letterSpacing: "-0.025em",
            margin: 0,
          }}
        >
          {title}
        </h1>

        <DemoBadge />
      </div>

      <p
        style={{
          color: colors.textMuted,
          fontSize: "14px",
          lineHeight: 1.6,
          margin: 0,
          maxWidth: "760px",
        }}
      >
        {subtitle}
      </p>
    </div>
  );
}

/* =========================================================
   Empty State
========================================================= */

export function EmptyState({
  title,
  message,
  onAction,
  actionLabel = "Add First Monitor",
}: {
  title: string;
  message: string;
  onAction?: () => void;
  actionLabel?: string;
}) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "56px 24px",
        background: colors.surface,
        borderRadius: "16px",
        border: `1px dashed ${colors.borderStrong}`,
        margin: "20px 0",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: 48,
          height: 48,
          margin: "0 auto 16px",
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(16, 185, 129, 0.10)",
          color: colors.primary,
          fontSize: 20,
        }}
      >
        ⚡
      </div>

      <h3
        style={{
          fontSize: "18px",
          lineHeight: 1.3,
          color: colors.text,
          margin: "0 0 8px",
        }}
      >
        {title}
      </h3>

      <p
        style={{
          color: colors.textDim,
          fontSize: "14px",
          lineHeight: 1.6,
          margin: "0 auto 20px",
          maxWidth: "460px",
        }}
      >
        {message}
      </p>

      {onAction && (
        <button
          type="button"
          onClick={onAction}
          className="btn-primary-glow"
        >
          + {actionLabel}
        </button>
      )}
    </div>
  );
}

/* =========================================================
   App Page
   IMPORTANT:
   earlysignal-pages.tsx imports this component.
========================================================= */

export function AppPage({
  children,
  title,
  subtitle,
  actions,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <section
      style={{
        width: "100%",
      }}
    >
      {(title || subtitle || actions) && (
        <div
          className="app-page-header"
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "20px",
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              minWidth: 0,
              flex: 1,
            }}
          >
            {title && (
              <h1
                className="responsive-title"
                style={{
                  color: colors.text,
                  fontWeight: 800,
                  letterSpacing: "-0.025em",
                  margin: 0,
                }}
              >
                {title}
              </h1>
            )}

            {subtitle && (
              <p
                style={{
                  color: colors.textMuted,
                  fontSize: "14px",
                  lineHeight: 1.6,
                  margin: "8px 0 0",
                  maxWidth: "720px",
                }}
              >
                {subtitle}
              </p>
            )}
          </div>

          {actions && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flexWrap: "wrap",
                flexShrink: 0,
              }}
            >
              {actions}
            </div>
          )}
        </div>
      )}

      {children}
    </section>
  );
}

/* =========================================================
   App Shell
========================================================= */

export function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: colors.background,
        color: colors.text,
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <style>{`
        *,
        *::before,
        *::after {
          box-sizing: border-box;
        }

        html {
          background: #090d16;
        }

        body {
          margin: 0;
          background: #090d16;
          color: #f8fafc;
        }

        button,
        input,
        textarea,
        select {
          font: inherit;
        }

        button {
          -webkit-tap-highlight-color: transparent;
        }

        a {
          color: inherit;
        }

        .container-app {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding-left: 20px;
          padding-right: 20px;
        }

        .responsive-title {
          font-size: clamp(1.55rem, 3vw, 2.35rem);
          line-height: 1.15;
        }

        .btn-primary-glow {
          background: linear-gradient(
            135deg,
            #10b981 0%,
            #059669 100%
          );
          color: #ffffff;
          font-weight: 700;
          padding: 11px 18px;
          min-height: 42px;
          border-radius: 10px;
          border: 1px solid rgba(16, 185, 129, 0.35);
          cursor: pointer;
          box-shadow:
            0 4px 18px rgba(16, 185, 129, 0.22);
          transition:
            transform 0.18s ease,
            box-shadow 0.18s ease,
            opacity 0.18s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 14px;
        }

        .btn-primary-glow:hover {
          transform: translateY(-1px);
          box-shadow:
            0 7px 24px rgba(16, 185, 129, 0.32);
        }

        .btn-primary-glow:focus-visible,
        .btn-secondary:focus-visible {
          outline: 2px solid #38bdf8;
          outline-offset: 2px;
        }

        .btn-primary-glow:disabled {
          opacity: 0.55;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .btn-secondary {
          background: #111827;
          color: #e2e8f0;
          font-weight: 600;
          padding: 9px 15px;
          min-height: 40px;
          border-radius: 9px;
          border: 1px solid #334155;
          cursor: pointer;
          transition:
            background 0.18s ease,
            border-color 0.18s ease,
            transform 0.18s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
        }

        .btn-secondary:hover {
          background: #1e293b;
          border-color: #475569;
          transform: translateY(-1px);
        }

        .desktop-table {
          width: 100%;
          border-collapse: collapse;
        }

        .desktop-table th {
          text-align: left;
          padding: 12px 16px;
          color: #64748b;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid #1e293b;
        }

        .desktop-table td {
          padding: 16px;
          border-bottom: 1px solid #1e293b;
          vertical-align: middle;
        }

        .desktop-table tr:last-child td {
          border-bottom: none;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.72);
          backdrop-filter: blur(5px);
          -webkit-backdrop-filter: blur(5px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          z-index: 1000;
          overflow-y: auto;
        }

        .modal-box {
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: 16px;
          width: 100%;
          max-width: 500px;
          max-height: calc(100vh - 32px);
          overflow-y: auto;
          padding: 24px;
          box-shadow:
            0 24px 60px rgba(0, 0, 0, 0.5);
        }

        .input-field {
          width: 100%;
          min-height: 44px;
          background: #111827;
          border: 1px solid #334155;
          border-radius: 9px;
          padding: 10px 13px;
          color: #ffffff;
          font-size: 14px;
          outline: none;
          margin-top: 6px;
          margin-bottom: 16px;
          transition:
            border-color 0.18s ease,
            box-shadow 0.18s ease;
        }

        .input-field::placeholder {
          color: #64748b;
        }

        .input-field:focus {
          border-color: #10b981;
          box-shadow:
            0 0 0 3px rgba(16, 185, 129, 0.14);
        }

        textarea.input-field {
          min-height: 110px;
          resize: vertical;
        }

        @media (max-width: 768px) {
          .container-app {
            padding-left: 14px;
            padding-right: 14px;
          }

          .app-page-header {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 14px !important;
          }

          .app-page-header > div:last-child {
            width: 100%;
          }

          .desktop-table,
          .desktop-table tbody,
          .desktop-table tr,
          .desktop-table td {
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
            margin-bottom: 12px;
            padding: 12px 14px;
          }

          .desktop-table td {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 16px;
            padding: 9px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            text-align: right;
            min-width: 0;
          }

          .desktop-table td::before {
            content: attr(data-label);
            flex: 0 0 auto;
            font-weight: 600;
            color: #64748b;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            text-align: left;
          }

          .desktop-table td:last-child {
            border-bottom: none;
            padding-top: 12px;
          }
        }

        @media (max-width: 480px) {
          .modal-overlay {
            padding: 10px;
            align-items: flex-end;
          }

          .modal-box {
            max-height: calc(100vh - 20px);
            border-radius: 16px 16px 12px 12px;
            padding: 18px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
            animation-duration: 0.01ms !important;
          }
        }
      `}</style>

      {/* Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          borderBottom: `1px solid ${colors.border}`,
          background: "rgba(11, 19, 41, 0.94)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
        }}
      >
        <div
          className="container-app"
          style={{
            minHeight: "68px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <a
            href="/dashboard"
            aria-label="EarlySignal AI Dashboard"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              textDecoration: "none",
              minWidth: 0,
            }}
          >
            <div
              aria-hidden="true"
              style={{
                width: 34,
                height: 34,
                flexShrink: 0,
                borderRadius: 9,
                background:
                  "linear-gradient(135deg, #10b981, #059669)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                color: "#03130e",
                boxShadow:
                  "0 5px 18px rgba(16, 185, 129, 0.22)",
              }}
            >
              ⚡
            </div>

            <div
              style={{
                minWidth: 0,
              }}
            >
              <div
                style={{
                  fontWeight: 800,
                  fontSize: "17px",
                  color: colors.text,
                  lineHeight: 1.1,
                  whiteSpace: "nowrap",
                }}
              >
                EarlySignal AI
              </div>

              <div
                style={{
                  fontSize: "9px",
                  color: colors.textDim,
                  letterSpacing: "0.11em",
                  marginTop: "3px",
                  whiteSpace: "nowrap",
                }}
              >
                EARLY WARNING INTELLIGENCE
              </div>
            </div>
          </a>

          <a
            href="/dashboard"
            className="btn-secondary"
            style={{
              fontSize: "12px",
              flexShrink: 0,
            }}
          >
            Workspace
          </a>
        </div>
      </header>

      {/* Main */}
      <main
        className="container-app"
        style={{
          paddingTop: "28px",
          paddingBottom: "72px",
        }}
      >
        {children}
      </main>
    </div>
  );
}
