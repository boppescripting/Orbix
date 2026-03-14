import React, { useState, useEffect, useCallback } from 'react';
import type { WidgetProps, WidgetConfigProps } from '../types';
import { SettingsField, SettingsInput, SettingsSelect } from './SettingsComponents';

interface AdGuardStats {
  num_dns_queries: number;
  num_blocked_filtering: number;
  num_replaced_safebrowsing: number;
  num_replaced_parental: number;
  avg_processing_time: number;
}

interface AdGuardStatus {
  protection_enabled: boolean;
  version: string;
  running: boolean;
}

const REFRESH_OPTIONS = [
  { label: '10 seconds', value: '10' },
  { label: '30 seconds', value: '30' },
  { label: '1 minute', value: '60' },
  { label: '5 minutes', value: '300' },
];

function fetchAdGuard(baseUrl: string, username: string, password: string): Promise<Response> {
  const token = localStorage.getItem('orbix_token');
  return fetch('/api/integrations/adguard', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ baseUrl, username, password }),
  });
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default function AdGuardWidget({ config }: WidgetProps) {
  const url = ((config.url as string) ?? '').replace(/\/$/, '');
  const username = (config.username as string) ?? '';
  const password = (config.password as string) ?? '';
  const refreshInterval = parseInt((config.refreshInterval as string) ?? '30', 10);

  const [stats, setStats] = useState<AdGuardStats | null>(null);
  const [status, setStatus] = useState<AdGuardStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAdGuard(url, username, password);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      setStats(body.stats);
      setStatus(body.status);
      setLastUpdated(new Date());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [url, username, password]);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, refreshInterval * 1000);
    return () => clearInterval(id);
  }, [fetchData, refreshInterval]);

  if (!url) {
    return (
      <div style={styles.centered}>
        <span style={styles.icon}>🛡️</span>
        <p style={styles.hint}>Configure your AdGuard Home URL in settings.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.centered}>
        <span style={{ fontSize: '1.5rem' }}>⚠️</span>
        <p style={{ ...styles.hint, color: 'var(--color-danger)', textAlign: 'center' }}>{error}</p>
        <button onClick={fetchData} style={styles.retryBtn}>Retry</button>
      </div>
    );
  }

  if (loading && !stats) {
    return (
      <div style={styles.centered}>
        <p style={styles.hint}>Connecting to AdGuard Home…</p>
      </div>
    );
  }

  const blocked = stats?.num_blocked_filtering ?? 0;
  const total = stats?.num_dns_queries ?? 0;
  const blockedPct = total > 0 ? ((blocked / total) * 100).toFixed(1) : '0.0';
  const avgMs = stats ? (stats.avg_processing_time * 1000).toFixed(1) : '—';
  const protectionOn = status?.protection_enabled ?? false;

  return (
    <div style={styles.container}>
      {/* Status bar */}
      <div style={styles.statusBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ ...styles.dot, background: protectionOn ? 'var(--color-success)' : 'var(--color-danger)' }} />
          <span style={styles.statusText}>
            {protectionOn ? 'Protection enabled' : 'Protection disabled'}
          </span>
        </div>
        {status?.version && (
          <span style={styles.version}>{status.version}</span>
        )}
      </div>

      {/* Main stats */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{fmt(total)}</div>
          <div style={styles.statLabel}>DNS Queries</div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: 'var(--color-danger)' }}>{fmt(blocked)}</div>
          <div style={styles.statLabel}>Blocked</div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: 'var(--color-primary)' }}>{blockedPct}%</div>
          <div style={styles.statLabel}>Block rate</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statValue}>{avgMs}<span style={styles.unit}>ms</span></div>
          <div style={styles.statLabel}>Avg latency</div>
        </div>
      </div>

      {/* Extra stats row */}
      {stats && (stats.num_replaced_safebrowsing > 0 || stats.num_replaced_parental > 0) && (
        <div style={styles.extraRow}>
          {stats.num_replaced_safebrowsing > 0 && (
            <span style={styles.extraTag}>🔒 {fmt(stats.num_replaced_safebrowsing)} safe browsing</span>
          )}
          {stats.num_replaced_parental > 0 && (
            <span style={styles.extraTag}>👨‍👩‍👧 {fmt(stats.num_replaced_parental)} parental</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={styles.footer}>
        {lastUpdated && (
          <span style={styles.updated}>
            Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        )}
        <button onClick={fetchData} style={styles.refreshBtn} title="Refresh now" disabled={loading}>
          ↻
        </button>
      </div>
    </div>
  );
}

export function AdGuardConfig({ config, onChange }: WidgetConfigProps) {
  const url = (config.url as string) ?? '';
  const username = (config.username as string) ?? '';
  const password = (config.password as string) ?? '';
  const refreshInterval = (config.refreshInterval as string) ?? '30';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <SettingsField label="AdGuard Home URL" hint="e.g. http://192.168.1.1:3000">
        <SettingsInput
          value={url}
          onChange={(v) => onChange({ ...config, url: v })}
          placeholder="http://192.168.1.1:3000"
        />
      </SettingsField>

      <SettingsField label="Username" hint="Leave blank if auth is disabled.">
        <SettingsInput
          value={username}
          onChange={(v) => onChange({ ...config, username: v })}
          placeholder="admin"
        />
      </SettingsField>

      <SettingsField label="Password">
        <SettingsInput
          type="password"
          value={password}
          onChange={(v) => onChange({ ...config, password: v })}
          placeholder="••••••••"
        />
      </SettingsField>

      <SettingsField label="Refresh interval">
        <SettingsSelect
          value={refreshInterval}
          onChange={(v) => onChange({ ...config, refreshInterval: v })}
          options={REFRESH_OPTIONS}
        />
      </SettingsField>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    gap: '0.6rem',
  },
  centered: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: '0.5rem',
  },
  icon: {
    fontSize: '2rem',
  },
  hint: {
    fontSize: '0.8rem',
    color: 'var(--color-text-muted)',
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: '0.25rem',
    padding: '0.3rem 0.8rem',
    background: 'var(--color-surface-hover)',
    border: '1px solid var(--color-border)',
    borderRadius: '5px',
    color: 'var(--color-text)',
    fontSize: '0.8rem',
    cursor: 'pointer',
  },
  statusBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.35rem 0.6rem',
    background: 'var(--color-surface-hover)',
    borderRadius: '6px',
    flexShrink: 0,
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  statusText: {
    fontSize: '0.78rem',
    fontWeight: 600,
    color: 'var(--color-text)',
  },
  version: {
    fontSize: '0.7rem',
    color: 'var(--color-text-muted)',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.5rem',
    flexShrink: 0,
  },
  statCard: {
    background: 'var(--color-surface-hover)',
    borderRadius: '7px',
    padding: '0.5rem 0.65rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.15rem',
  },
  statValue: {
    fontSize: '1.3rem',
    fontWeight: 700,
    color: 'var(--color-text)',
    fontVariantNumeric: 'tabular-nums',
    lineHeight: 1,
  },
  unit: {
    fontSize: '0.7rem',
    fontWeight: 400,
    color: 'var(--color-text-muted)',
    marginLeft: '2px',
  },
  statLabel: {
    fontSize: '0.7rem',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  barTrack: {
    height: '4px',
    background: 'var(--color-surface-hover)',
    borderRadius: '2px',
    overflow: 'hidden',
    flexShrink: 0,
  },
  barFill: {
    height: '100%',
    background: 'var(--color-danger)',
    borderRadius: '2px',
    transition: 'width 0.4s ease',
  },
  extraRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.4rem',
    flexShrink: 0,
  },
  extraTag: {
    fontSize: '0.72rem',
    color: 'var(--color-text-muted)',
    background: 'var(--color-surface-hover)',
    borderRadius: '4px',
    padding: '0.2rem 0.4rem',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  updated: {
    fontSize: '0.7rem',
    color: 'var(--color-text-muted)',
    opacity: 0.6,
  },
  refreshBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--color-text-muted)',
    cursor: 'pointer',
    fontSize: '1rem',
    padding: '0.1rem 0.3rem',
    borderRadius: '4px',
    lineHeight: 1,
  },
};
