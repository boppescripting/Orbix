import React, { useState, useEffect, useCallback } from 'react';
import type { WidgetProps, WidgetConfigProps } from '../types';
import { SettingsField, SettingsInput, SettingsSelect } from './SettingsComponents';

// Request status: 1=Pending, 2=Approved, 3=Declined, 4=Available, 5=Partially Available
const REQUEST_STATUS: Record<number, { label: string; color: string }> = {
  1: { label: 'Pending',   color: 'var(--color-text-muted)' },
  2: { label: 'Approved',  color: '#818cf8' },
  3: { label: 'Declined',  color: 'var(--color-danger)' },
  4: { label: 'Available', color: 'var(--color-success)' },
  5: { label: 'Partial',   color: '#f59e0b' },
};

const REFRESH_OPTIONS = [
  { label: '30 seconds', value: '30' },
  { label: '1 minute',   value: '60' },
  { label: '5 minutes',  value: '300' },
];

interface JsRequest {
  id: number;
  status: number;
  type: 'movie' | 'tv';
  createdAt: string;
  requestedBy?: { displayName?: string };
  mediaTitle: string | null;
}

interface JsCounts {
  total: number;
  pending: number;
  approved: number;
  declined: number;
  available: number;
}

interface JsStatus {
  version: string;
}

interface JsData {
  counts: JsCounts;
  requests: JsRequest[];
  status: JsStatus;
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function JellyseerrWidget({ config }: WidgetProps) {
  const url     = ((config.url as string) ?? '').replace(/\/$/, '');
  const apiKey  = (config.apiKey as string) ?? '';
  const refresh = parseInt((config.refreshInterval as string) ?? '60', 10);

  const [data, setData]           = useState<JsData | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const [loading, setLoading]     = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    if (!url || !apiKey) return;
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('orbix_token');
      const res = await fetch('/api/integrations/jellyseerr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ baseUrl: url, apiKey }),
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
  }, [url, apiKey]);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, refresh * 1000);
    return () => clearInterval(id);
  }, [fetchData, refresh]);

  if (!url || !apiKey) {
    return (
      <div style={styles.centered}>
        <span style={{ fontSize: '2rem' }}>🎟️</span>
        <p style={styles.hint}>Configure your Jellyseerr URL and API key in settings.</p>
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

  if (loading && !data) {
    return (
      <div style={styles.centered}>
        <p style={styles.hint}>Connecting to Jellyseerr…</p>
      </div>
    );
  }

  const counts   = data?.counts;
  const requests = data?.requests ?? [];

  return (
    <div style={styles.container}>
      {/* Status bar */}
      {data && (
        <div style={styles.statusBar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={styles.dot} />
            <span style={styles.serverLabel}>Jellyseerr</span>
          </div>
          <span style={styles.version}>v{data.status.version}</span>
        </div>
      )}

      {/* Count pills */}
      {counts && (
        <div style={styles.pills}>
          <div style={styles.pill}>
            <span style={{ ...styles.pillNum, color: 'var(--color-text-muted)' }}>{counts.pending}</span>
            <span style={styles.pillLabel}>Pending</span>
          </div>
          <div style={styles.pill}>
            <span style={{ ...styles.pillNum, color: '#818cf8' }}>{counts.approved}</span>
            <span style={styles.pillLabel}>Approved</span>
          </div>
          <div style={styles.pill}>
            <span style={{ ...styles.pillNum, color: 'var(--color-success)' }}>{counts.available}</span>
            <span style={styles.pillLabel}>Available</span>
          </div>
          <div style={styles.pill}>
            <span style={{ ...styles.pillNum, color: 'var(--color-danger)' }}>{counts.declined}</span>
            <span style={styles.pillLabel}>Declined</span>
          </div>
        </div>
      )}

      {/* Recent requests */}
      {requests.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionLabel}>Recent requests</div>
          <div style={styles.requestList}>
            {requests.map((req) => {
              const statusInfo = REQUEST_STATUS[req.status] ?? { label: 'Unknown', color: 'var(--color-text-muted)' };
              const title = req.mediaTitle ?? (req.type === 'movie' ? 'Movie' : 'TV Show');
              return (
                <div key={req.id} style={styles.requestRow}>
                  <span style={styles.typeIcon}>{req.type === 'movie' ? '🎬' : '📺'}</span>
                  <div style={styles.requestInfo}>
                    <span style={styles.requestTitle}>{title}</span>
                    <span style={styles.requestMeta}>
                      {req.requestedBy?.displayName ?? 'Unknown'}
                      {' · '}
                      {timeAgo(req.createdAt)}
                    </span>
                  </div>
                  <span style={{ ...styles.statusBadge, color: statusInfo.color }}>
                    {statusInfo.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {requests.length === 0 && data && (
        <div style={styles.idle}>No requests yet</div>
      )}

      {/* Footer */}
      <div style={styles.footer}>
        {lastUpdated && (
          <span style={styles.updated}>
            {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        )}
        <button onClick={fetchData} style={styles.refreshBtn} title="Refresh" disabled={loading}>↻</button>
      </div>
    </div>
  );
}

export function JellyseerrConfig({ config, onChange }: WidgetConfigProps) {
  const url             = (config.url as string) ?? '';
  const apiKey          = (config.apiKey as string) ?? '';
  const refreshInterval = (config.refreshInterval as string) ?? '60';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <SettingsField label="Jellyseerr URL" hint="e.g. http://192.168.1.1:5055">
        <SettingsInput
          value={url}
          onChange={(v) => onChange({ ...config, url: v })}
          placeholder="http://192.168.1.1:5055"
        />
      </SettingsField>

      <SettingsField label="API key" hint="Settings → General → API Key">
        <SettingsInput
          type="password"
          value={apiKey}
          onChange={(v) => onChange({ ...config, apiKey: v })}
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
    gap: '0.5rem',
    overflow: 'hidden',
  },
  centered: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: '0.5rem',
  },
  hint: {
    fontSize: '0.8rem',
    color: 'var(--color-text-muted)',
    textAlign: 'center',
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
    padding: '0.3rem 0.6rem',
    background: 'var(--color-surface-hover)',
    borderRadius: '6px',
    flexShrink: 0,
  },
  dot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: 'var(--color-success)',
    flexShrink: 0,
  },
  serverLabel: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--color-text)',
  },
  version: {
    fontSize: '0.7rem',
    color: 'var(--color-text-muted)',
  },
  pills: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '0.4rem',
    flexShrink: 0,
  },
  pill: {
    background: 'var(--color-surface-hover)',
    borderRadius: '7px',
    padding: '0.4rem 0.3rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.1rem',
  },
  pillNum: {
    fontSize: '1.1rem',
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums',
    lineHeight: 1,
  },
  pillLabel: {
    fontSize: '0.62rem',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
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
  requestList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    overflowY: 'auto',
    flex: 1,
  },
  requestRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.3rem 0',
    borderBottom: '1px solid var(--color-border)',
  },
  typeIcon: {
    fontSize: '0.9rem',
    flexShrink: 0,
  },
  requestInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  requestTitle: {
    fontSize: '0.82rem',
    fontWeight: 500,
    color: 'var(--color-text)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  requestMeta: {
    fontSize: '0.7rem',
    color: 'var(--color-text-muted)',
  },
  statusBadge: {
    fontSize: '0.7rem',
    fontWeight: 600,
    flexShrink: 0,
  },
  idle: {
    fontSize: '0.8rem',
    color: 'var(--color-text-muted)',
    textAlign: 'center',
    padding: '0.5rem 0',
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
  },
};
