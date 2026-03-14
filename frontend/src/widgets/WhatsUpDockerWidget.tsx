import React, { useState, useEffect, useCallback } from 'react';
import type { WidgetProps, WidgetConfigProps } from '../types';
import { SettingsField, SettingsInput, SettingsSelect } from './SettingsComponents';

const REFRESH_OPTIONS = [
  { label: '1 minute',   value: '60' },
  { label: '5 minutes',  value: '300' },
  { label: '15 minutes', value: '900' },
  { label: '1 hour',     value: '3600' },
];

interface Container {
  id:              string;
  name:            string;
  currentTag:      string;
  newTag:          string | null;
  updateAvailable: boolean;
  status:          string;
  image:           string;
}

interface WudData {
  total:      number;
  running:    number;
  updates:    number;
  containers: Container[];
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('orbix_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function WhatsUpDockerWidget({ config }: WidgetProps) {
  const url     = ((config.url as string) ?? '').replace(/\/$/, '');
  const username = (config.username as string) ?? '';
  const password = (config.password as string) ?? '';
  const refresh  = parseInt((config.refreshInterval as string) ?? '300', 10);

  const [data, setData]               = useState<WudData | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [loading, setLoading]         = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/integrations/whatsupdocker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ baseUrl: url, username, password }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      setData(body);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [url, username, password]);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, refresh * 1000);
    return () => clearInterval(id);
  }, [fetchData, refresh]);

  if (!url) {
    return (
      <div style={styles.centered}>
        <div style={{ fontSize: '2rem' }}>🐳</div>
        <p style={styles.hint}>Configure your What's Up Docker URL in settings.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.centered}>
        <div style={{ fontSize: '1.5rem' }}>⚠️</div>
        <p style={{ ...styles.hint, color: 'var(--color-danger)' }}>{error}</p>
        <button onClick={fetchData} style={styles.retryBtn}>Retry</button>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div style={styles.centered}>
        <p style={styles.hint}>Connecting to What's Up Docker…</p>
      </div>
    );
  }

  if (!data) return null;

  const updatable = data.containers.filter(c => c.updateAvailable);

  return (
    <div style={styles.container}>
      {/* Summary pills */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{data.total}</div>
          <div style={styles.statLabel}>Containers</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: 'var(--color-success)' }}>{data.running}</div>
          <div style={styles.statLabel}>Running</div>
        </div>
        <div style={{ ...styles.statCard, gridColumn: '1 / -1' }}>
          <div style={{ ...styles.statValue, color: data.updates > 0 ? '#f59e0b' : 'var(--color-success)' }}>
            {data.updates}
          </div>
          <div style={styles.statLabel}>{data.updates === 1 ? 'Update available' : 'Updates available'}</div>
        </div>
      </div>

      {/* Update list */}
      {updatable.length > 0 ? (
        <div style={styles.section}>
          <div style={styles.sectionLabel}>Updates available</div>
          <div style={styles.updateList}>
            {updatable.map(c => (
              <div key={c.id} style={styles.updateRow}>
                <div style={styles.updateIcon}>📦</div>
                <div style={styles.updateInfo}>
                  <span style={styles.updateName}>{c.name}</span>
                  <span style={styles.updateTags}>
                    <span style={styles.tagOld}>{c.currentTag}</span>
                    <span style={styles.tagArrow}>→</span>
                    <span style={styles.tagNew}>{c.newTag}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : data && (
        <div style={styles.idle}>All containers up to date ✓</div>
      )}

      {/* Footer */}
      <div style={styles.footer}>
        {lastUpdated && (
          <span style={styles.updated}>
            Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        )}
        <button onClick={fetchData} style={styles.refreshBtn} title="Refresh" disabled={loading}>↻</button>
      </div>
    </div>
  );
}

export function WhatsUpDockerConfig({ config, onChange }: WidgetConfigProps) {
  const url             = (config.url as string) ?? '';
  const username        = (config.username as string) ?? '';
  const password        = (config.password as string) ?? '';
  const refreshInterval = (config.refreshInterval as string) ?? '300';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <SettingsField label="What's Up Docker URL" hint="e.g. http://192.168.1.1:3000">
        <SettingsInput
          value={url}
          onChange={(v) => onChange({ ...config, url: v })}
          placeholder="http://192.168.1.1:3000"
        />
      </SettingsField>

      <SettingsField label="Username" hint="Leave blank if auth is disabled">
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
    overflow: 'hidden',
  },
  centered: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: '0.5rem',
    textAlign: 'center',
  },
  hint: {
    fontSize: '0.8rem',
    color: 'var(--color-text-muted)',
    margin: 0,
  },
  retryBtn: {
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
    display: 'inline-block',
  },
  statusText: {
    fontSize: '0.78rem',
    fontWeight: 600,
    color: 'var(--color-text)',
  },
  meta: {
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
  statLabel: {
    fontSize: '0.7rem',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
    flex: 1,
    minHeight: 0,
  },
  sectionLabel: {
    fontSize: '0.7rem',
    fontWeight: 600,
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    flexShrink: 0,
  },
  updateList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.3rem',
    overflowY: 'auto',
    flex: 1,
  },
  updateRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.35rem 0.5rem',
    background: 'var(--color-surface-hover)',
    borderRadius: '6px',
  },
  updateIcon: {
    fontSize: '0.9rem',
    flexShrink: 0,
  },
  updateInfo: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    gap: '0.15rem',
  },
  updateName: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--color-text)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  updateTags: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
    fontSize: '0.7rem',
    fontFamily: 'monospace',
  },
  tagOld: {
    color: 'var(--color-text-muted)',
  },
  tagArrow: {
    color: 'var(--color-text-muted)',
  },
  tagNew: {
    color: '#f59e0b',
    fontWeight: 600,
  },
  idle: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.8rem',
    color: 'var(--color-success)',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
    flexShrink: 0,
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
