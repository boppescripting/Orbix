import React, { useState, useEffect, useCallback } from 'react';
import type { WidgetProps, WidgetConfigProps } from '../types';
import { SettingsField, SettingsInput, SettingsSelect } from './SettingsComponents';
import { authHeaders } from '../utils';

const REFRESH_OPTIONS = [
  { label: '30 seconds', value: '30' },
  { label: '1 minute',   value: '60' },
  { label: '5 minutes',  value: '300' },
];

interface Tunnel {
  id:          string;
  name:        string;
  status:      string;
  connections: number;
  createdAt:   string;
  type:        string;
}

const STATUS_COLOR: Record<string, string> = {
  healthy:  'var(--color-success)',
  down:     'var(--color-danger)',
  degraded: '#f59e0b',
  inactive: 'var(--color-text-muted)',
};

const STATUS_LABEL: Record<string, string> = {
  healthy:  'Healthy',
  down:     'Down',
  degraded: 'Degraded',
  inactive: 'Inactive',
};

function statusColor(status: string) {
  return STATUS_COLOR[status] ?? 'var(--color-text-muted)';
}

function statusLabel(status: string) {
  return STATUS_LABEL[status] ?? status;
}


export default function CloudflareTunnelsWidget({ config }: WidgetProps) {
  const accountId = (config.accountId as string) ?? '';
  const apiToken  = (config.apiToken as string) ?? '';
  const refresh   = parseInt((config.refreshInterval as string) ?? '60', 10);

  const [tunnels, setTunnels]         = useState<Tunnel[]>([]);
  const [error, setError]             = useState<string | null>(null);
  const [loading, setLoading]         = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    if (!accountId || !apiToken) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/integrations/cloudflaretunnels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ accountId, apiToken }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      setTunnels(body.tunnels ?? []);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [accountId, apiToken]);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, refresh * 1000);
    return () => clearInterval(id);
  }, [fetchData, refresh]);

  if (!accountId || !apiToken) {
    return (
      <div style={styles.centered}>
        <div style={{ fontSize: '2rem' }}>🌐</div>
        <p style={styles.hint}>Configure your Cloudflare Account ID and API token in settings.</p>
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

  if (loading && !tunnels.length) {
    return (
      <div style={styles.centered}>
        <p style={styles.hint}>Fetching tunnels…</p>
      </div>
    );
  }

  const healthy  = tunnels.filter(t => t.status === 'healthy').length;
  const unhealthy = tunnels.filter(t => t.status === 'down' || t.status === 'degraded').length;

  return (
    <div style={styles.container}>
      {/* Status bar */}
      <div style={styles.statusBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{
            ...styles.dot,
            background: unhealthy > 0 ? 'var(--color-danger)' : tunnels.length ? 'var(--color-success)' : 'var(--color-text-muted)',
          }} />
          <span style={styles.statusText}>Cloudflare Tunnels</span>
        </div>
        <span style={styles.version}>
          {healthy}/{tunnels.length} healthy
        </span>
      </div>

      {/* Tunnel list */}
      {tunnels.length === 0 ? (
        <div style={styles.empty}>No tunnels found.</div>
      ) : (
        <div style={styles.list}>
          {tunnels.map((tunnel) => (
            <div key={tunnel.id} style={styles.tunnelRow}>
              <span style={{
                ...styles.tunnelDot,
                background: statusColor(tunnel.status),
              }} />
              <div style={styles.tunnelInfo}>
                <span style={styles.tunnelName}>{tunnel.name}</span>
                <span style={styles.tunnelMeta}>
                  {statusLabel(tunnel.status)}
                  {tunnel.connections > 0 && ` · ${tunnel.connections} connection${tunnel.connections !== 1 ? 's' : ''}`}
                </span>
              </div>
            </div>
          ))}
        </div>
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

export function CloudflareTunnelsConfig({ config, onChange }: WidgetConfigProps) {
  const accountId      = (config.accountId as string) ?? '';
  const apiToken       = (config.apiToken as string) ?? '';
  const refreshInterval = (config.refreshInterval as string) ?? '60';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <SettingsField label="Account ID" hint="Cloudflare dashboard → right sidebar">
        <SettingsInput
          value={accountId}
          onChange={(v) => onChange({ ...config, accountId: v })}
          placeholder="e.g. a1b2c3d4e5f6..."
        />
      </SettingsField>

      <SettingsField label="API Token" hint="My Profile → API Tokens → Create Token (Cloudflare Tunnel: Read)">
        <SettingsInput
          type="password"
          value={apiToken}
          onChange={(v) => onChange({ ...config, apiToken: v })}
          placeholder="••••••••••••••••"
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
  version: {
    fontSize: '0.7rem',
    color: 'var(--color-text-muted)',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    flex: 1,
    overflowY: 'auto',
  },
  empty: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.8rem',
    color: 'var(--color-text-muted)',
  },
  tunnelRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    padding: '0.35rem 0.5rem',
    borderRadius: '6px',
    background: 'var(--color-surface-hover)',
  },
  tunnelDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  tunnelInfo: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    gap: '0.05rem',
  },
  tunnelName: {
    fontSize: '0.82rem',
    fontWeight: 600,
    color: 'var(--color-text)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  tunnelMeta: {
    fontSize: '0.7rem',
    color: 'var(--color-text-muted)',
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
