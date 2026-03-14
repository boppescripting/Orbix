import React, { useState, useEffect, useCallback } from 'react';
import type { WidgetProps, WidgetConfigProps } from '../types';
import { SettingsField, SettingsInput, SettingsSelect, SettingsToggle } from './SettingsComponents';

const REFRESH_OPTIONS = [
  { label: '5 seconds',  value: '5' },
  { label: '10 seconds', value: '10' },
  { label: '30 seconds', value: '30' },
  { label: '1 minute',   value: '60' },
];

interface LeechTorrent {
  name:     string;
  progress: number;
  size:     string;
  dlSpeed:  string;
  eta:      number;
}

interface QbData {
  downloadSpeed: string;
  uploadSpeed:   string;
  leechCount:    number;
  seedCount:     number;
  leeching:      LeechTorrent[];
}

function fmtEta(seconds: number): string {
  if (!seconds || seconds < 0 || seconds >= 8_640_000) return '∞';
  if (seconds < 60)   return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('orbix_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function QbittorrentWidget({ config }: WidgetProps) {
  const url              = ((config.url as string) ?? '').replace(/\/$/, '');
  const username         = (config.username as string) ?? '';
  const password         = (config.password as string) ?? '';
  const refresh          = parseInt((config.refreshInterval as string) ?? '10', 10);
  const showLeechList    = config.showLeechList !== false;
  const showLeechSize    = config.showLeechSize === true;

  const [data, setData]               = useState<QbData | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [loading, setLoading]         = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/integrations/qbittorrent', {
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
        <div style={{ fontSize: '2rem' }}>🌊</div>
        <p style={styles.hint}>Configure your qBittorrent URL in settings.</p>
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
        <p style={styles.hint}>Connecting to qBittorrent…</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div style={styles.container}>
      {/* Speed + count stats */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: 'var(--color-primary)' }}>{data.leechCount}</div>
          <div style={styles.statLabel}>Leeching</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: 'var(--color-success)' }}>{data.seedCount}</div>
          <div style={styles.statLabel}>Seeding</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>
            <span style={styles.arrow}>↓</span>{data.downloadSpeed}
          </div>
          <div style={styles.statLabel}>Download</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>
            <span style={{ ...styles.arrow, color: 'var(--color-success)' }}>↑</span>{data.uploadSpeed}
          </div>
          <div style={styles.statLabel}>Upload</div>
        </div>
      </div>

      {/* Active leeches */}
      {showLeechList && data.leeching.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionLabel}>Downloading</div>
          <div style={styles.leechList}>
            {data.leeching.map((t, i) => (
              <div key={i} style={styles.leechRow}>
                <div style={styles.leechTop}>
                  <span style={styles.leechName}>{t.name}</span>
                  <span style={styles.leechMeta}>{t.progress}%</span>
                </div>
                <div style={styles.progressTrack}>
                  <div style={{ ...styles.progressFill, width: `${t.progress}%` }} />
                </div>
                <div style={styles.leechBottom}>
                  <span style={styles.leechSpeed}>↓ {t.dlSpeed}</span>
                  <span style={styles.leechEta}>
                    {showLeechSize && <>{t.size} · </>}
                    ETA {fmtEta(t.eta)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showLeechList && data.leeching.length === 0 && (
        <div style={styles.idle}>No active downloads</div>
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

export function QbittorrentConfig({ config, onChange }: WidgetConfigProps) {
  const url             = (config.url as string) ?? '';
  const username        = (config.username as string) ?? '';
  const password        = (config.password as string) ?? '';
  const refreshInterval = (config.refreshInterval as string) ?? '10';
  const showLeechList   = config.showLeechList !== false;
  const showLeechSize   = config.showLeechSize === true;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <SettingsField label="qBittorrent URL" hint="e.g. http://192.168.1.1:8080">
        <SettingsInput
          value={url}
          onChange={(v) => onChange({ ...config, url: v })}
          placeholder="http://192.168.1.1:8080"
        />
      </SettingsField>

      <SettingsField label="Username">
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

      <SettingsField label="Show download list">
        <SettingsToggle
          value={showLeechList}
          onChange={(v) => onChange({ ...config, showLeechList: v })}
        />
      </SettingsField>

      {showLeechList && (
        <SettingsField label="Show torrent size">
          <SettingsToggle
            value={showLeechSize}
            onChange={(v) => onChange({ ...config, showLeechSize: v })}
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
    background: 'var(--color-success)',
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
    fontSize: '1rem',
    fontWeight: 700,
    color: 'var(--color-text)',
    fontVariantNumeric: 'tabular-nums',
    lineHeight: 1,
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.2rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  arrow: {
    fontSize: '0.8rem',
    color: 'var(--color-primary)',
    flexShrink: 0,
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
  leechList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    overflowY: 'auto',
    flex: 1,
  },
  leechRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  leechTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: '0.5rem',
  },
  leechName: {
    fontSize: '0.78rem',
    fontWeight: 500,
    color: 'var(--color-text)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
  },
  leechMeta: {
    fontSize: '0.7rem',
    color: 'var(--color-text-muted)',
    flexShrink: 0,
    fontVariantNumeric: 'tabular-nums',
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
  leechBottom: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.68rem',
    color: 'var(--color-text-muted)',
  },
  leechSpeed: {
    color: 'var(--color-primary)',
    fontVariantNumeric: 'tabular-nums',
  },
  leechEta: {
    fontVariantNumeric: 'tabular-nums',
  },
  idle: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.8rem',
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
