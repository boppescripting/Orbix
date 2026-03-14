import React, { useState, useEffect, useCallback } from 'react';
import type { WidgetProps, WidgetConfigProps } from '../types';
import { SettingsField, SettingsInput, SettingsSelect, SettingsToggle } from './SettingsComponents';

interface JfSession {
  UserName?: string;
  DeviceName?: string;
  NowPlayingItem?: {
    Name: string;
    Type: string;
    SeriesName?: string;
    RunTimeTicks?: number;
  };
  PlayState?: {
    PositionTicks?: number;
    IsPaused?: boolean;
  };
}

interface JfItem {
  Id: string;
  Name: string;
  Type: string;
  SeriesName?: string;
  ProductionYear?: number;
  DateCreated?: string;
}

interface JfInfo {
  ServerName: string;
  Version: string;
  OperatingSystem?: string;
}

interface JfData {
  info: JfInfo;
  sessions: JfSession[];
  recentItems: { Items: JfItem[]; TotalRecordCount: number };
}

const REFRESH_OPTIONS = [
  { label: '15 seconds', value: '15' },
  { label: '30 seconds', value: '30' },
  { label: '1 minute', value: '60' },
  { label: '5 minutes', value: '300' },
];

function ticksToTime(ticks: number): string {
  const totalSec = Math.floor(ticks / 10_000_000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function itemLabel(item: JfItem): string {
  if (item.Type === 'Episode' && item.SeriesName) return item.SeriesName;
  return item.Name;
}

function itemSub(item: JfItem): string {
  if (item.Type === 'Episode' && item.SeriesName) return item.Name;
  if (item.ProductionYear) return String(item.ProductionYear);
  return item.Type;
}

function typeIcon(type: string): string {
  switch (type) {
    case 'Movie':   return '🎬';
    case 'Episode': return '📺';
    case 'Series':  return '📺';
    case 'Audio':   return '🎵';
    default:        return '🎞️';
  }
}

export default function JellyfinWidget({ config }: WidgetProps) {
  const url      = ((config.url as string) ?? '').replace(/\/$/, '');
  const apiKey   = (config.apiKey as string) ?? '';
  const refresh  = parseInt((config.refreshInterval as string) ?? '30', 10);
  const showRecent   = config.showRecent !== false;
  const showStreams  = config.showStreams !== false;
  const maxRecent    = parseInt((config.maxRecent as string) ?? '5', 10);

  const [data, setData] = useState<JfData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    if (!url || !apiKey) return;
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('orbix_token');
      const res = await fetch('/api/integrations/jellyfin', {
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
        <span style={{ fontSize: '2rem' }}>🎬</span>
        <p style={styles.hint}>Configure your Jellyfin URL and API key in settings.</p>
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
        <p style={styles.hint}>Connecting to Jellyfin…</p>
      </div>
    );
  }

  const activeSessions = (data?.sessions ?? []).filter(s => s.NowPlayingItem);
  const recentItems    = (data?.recentItems?.Items ?? []).slice(0, maxRecent);

  return (
    <div style={styles.container}>
      {/* Active streams */}
      {showStreams && activeSessions.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionLabel}>
            Now playing · {activeSessions.length} stream{activeSessions.length !== 1 ? 's' : ''}
          </div>
          {activeSessions.map((session, i) => {
            const item      = session.NowPlayingItem!;
            const pos       = session.PlayState?.PositionTicks ?? 0;
            const dur       = item.RunTimeTicks ?? 0;
            const pct       = dur > 0 ? (pos / dur) * 100 : 0;
            const paused    = session.PlayState?.IsPaused ?? false;
            const title     = item.Type === 'Episode' && item.SeriesName
              ? `${item.SeriesName} — ${item.Name}`
              : item.Name;
            return (
              <div key={i} style={styles.sessionCard}>
                <div style={styles.sessionTop}>
                  <span style={styles.sessionIcon}>{typeIcon(item.Type)}</span>
                  <div style={styles.sessionInfo}>
                    <span style={styles.sessionTitle}>{title}</span>
                    <span style={styles.sessionMeta}>
                      {session.UserName}
                      {session.DeviceName ? ` · ${session.DeviceName}` : ''}
                      {paused ? ' · Paused' : ''}
                    </span>
                  </div>
                  {dur > 0 && (
                    <span style={styles.sessionTime}>
                      {ticksToTime(pos)} / {ticksToTime(dur)}
                    </span>
                  )}
                </div>
                {dur > 0 && (
                  <div style={styles.progressTrack}>
                    <div style={{ ...styles.progressFill, width: `${pct}%` }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showStreams && activeSessions.length === 0 && data && (
        <div style={styles.idle}>Nothing playing</div>
      )}

      {/* Recently added */}
      {showRecent && recentItems.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionLabel}>Recently added</div>
          <div style={styles.recentList}>
            {recentItems.map((item) => (
              <a
                key={item.Id}
                href={`${url}/web/index.html#!/details?id=${item.Id}`}
                target="_blank"
                rel="noreferrer"
                style={styles.recentRow}
              >
                <span style={styles.recentIcon}>{typeIcon(item.Type)}</span>
                <div style={styles.recentInfo}>
                  <span style={styles.recentTitle}>{itemLabel(item)}</span>
                  <span style={styles.recentSub}>{itemSub(item)}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
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

export function JellyfinConfig({ config, onChange }: WidgetConfigProps) {
  const url             = (config.url as string) ?? '';
  const apiKey          = (config.apiKey as string) ?? '';
  const refreshInterval = (config.refreshInterval as string) ?? '30';
  const showRecent      = config.showRecent !== false;
  const showStreams      = config.showStreams !== false;
  const maxRecent       = (config.maxRecent as string) ?? '5';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <SettingsField label="Jellyfin URL" hint="e.g. http://192.168.1.1:8096">
        <SettingsInput
          value={url}
          onChange={(v) => onChange({ ...config, url: v })}
          placeholder="http://192.168.1.1:8096"
        />
      </SettingsField>

      <SettingsField label="API key" hint="Dashboard → API Keys → +">
        <SettingsInput
          type="password"
          value={apiKey}
          onChange={(v) => onChange({ ...config, apiKey: v })}
          placeholder="••••••••••••••••"
        />
      </SettingsField>

      <SettingsField label="Show active streams">
        <SettingsToggle
          value={showStreams}
          onChange={(v) => onChange({ ...config, showStreams: v })}
        />
      </SettingsField>

      <SettingsField label="Show recently added">
        <SettingsToggle
          value={showRecent}
          onChange={(v) => onChange({ ...config, showRecent: v })}
        />
      </SettingsField>

      {showRecent && (
        <SettingsField label="Max recent items">
          <SettingsSelect
            value={maxRecent}
            onChange={(v) => onChange({ ...config, maxRecent: v })}
            options={['3','5','8','10'].map(v => ({ label: v, value: v }))}
          />
        </SettingsField>
      )}

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
  serverName: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--color-text)',
  },
  version: {
    fontSize: '0.7rem',
    color: 'var(--color-text-muted)',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
    flexShrink: 0,
  },
  sectionLabel: {
    fontSize: '0.7rem',
    fontWeight: 600,
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  idle: {
    fontSize: '0.8rem',
    color: 'var(--color-text-muted)',
    textAlign: 'center',
    padding: '0.5rem 0',
    flexShrink: 0,
  },
  sessionCard: {
    background: 'var(--color-surface-hover)',
    borderRadius: '7px',
    padding: '0.45rem 0.6rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  sessionTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  sessionIcon: {
    fontSize: '1rem',
    flexShrink: 0,
  },
  sessionInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  sessionTitle: {
    fontSize: '0.82rem',
    fontWeight: 600,
    color: 'var(--color-text)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  sessionMeta: {
    fontSize: '0.7rem',
    color: 'var(--color-text-muted)',
  },
  sessionTime: {
    fontSize: '0.7rem',
    color: 'var(--color-text-muted)',
    fontVariantNumeric: 'tabular-nums',
    flexShrink: 0,
  },
  progressTrack: {
    height: '3px',
    background: 'var(--color-border)',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'var(--color-primary)',
    borderRadius: '2px',
    transition: 'width 1s linear',
  },
  recentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    overflowY: 'auto',
  },
  recentRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.25rem 0.25rem',
    borderRadius: '5px',
    textDecoration: 'none',
    color: 'inherit',
    cursor: 'pointer',
  },
  recentIcon: {
    fontSize: '0.9rem',
    flexShrink: 0,
  },
  recentInfo: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  recentTitle: {
    fontSize: '0.8rem',
    fontWeight: 500,
    color: 'var(--color-text)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  recentSub: {
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
  },
};
