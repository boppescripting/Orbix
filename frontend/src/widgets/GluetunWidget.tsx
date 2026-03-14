import React, { useState, useEffect, useCallback } from 'react';
import type { WidgetProps, WidgetConfigProps } from '../types';
import { SettingsField, SettingsInput, SettingsSelect } from './SettingsComponents';

const REFRESH_OPTIONS = [
  { label: '10 seconds', value: '10' },
  { label: '30 seconds', value: '30' },
  { label: '1 minute',   value: '60' },
];

interface PublicIp {
  public_ip?:    string;
  country?:      string;
  country_code?: string;
  city?:         string;
  region?:       string;
  asn_org?:      string;
}

interface GluetunData {
  vpnStatus: { status: string };
  publicIp:  PublicIp | null;
}

function countryFlag(code?: string): string {
  if (!code || code.length !== 2) return '🌐';
  return code.toUpperCase().split('').map(
    c => String.fromCodePoint(c.charCodeAt(0) + 127397)
  ).join('');
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('orbix_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function GluetunWidget({ config }: WidgetProps) {
  const url      = ((config.url as string) ?? '').replace(/\/$/, '');
  const username = (config.username as string) ?? '';
  const password = (config.password as string) ?? '';
  const refresh  = parseInt((config.refreshInterval as string) ?? '30', 10);

  const [data, setData]               = useState<GluetunData | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [loading, setLoading]         = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/integrations/gluetun', {
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
        <div style={styles.emptyIcon}>🔒</div>
        <p style={styles.hint}>Configure your Gluetun URL in settings.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.centered}>
        <div style={styles.emptyIcon}>⚠️</div>
        <p style={{ ...styles.hint, color: 'var(--color-danger)' }}>{error}</p>
        <button onClick={fetchData} style={styles.retryBtn}>Retry</button>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div style={styles.centered}>
        <p style={styles.hint}>Connecting…</p>
      </div>
    );
  }

  const running = data?.vpnStatus?.status === 'running';
  const ip      = data?.publicIp;

  return (
    <div style={styles.container}>

      {/* Hero status */}
      {/* Status bar */}
      <div style={styles.statusBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ ...styles.dot, background: running ? 'var(--color-success)' : 'var(--color-danger)' }} />
          <span style={styles.statusText}>
            {running ? 'VPN connected' : 'VPN disconnected'}
          </span>
        </div>
        {running && ip?.country_code && (
          <span style={styles.version}>{countryFlag(ip.country_code)} {ip.country ?? ip.country_code}</span>
        )}
      </div>

      {/* IP details */}
      {running && ip?.public_ip ? (
        <div style={styles.details}>
          <div style={styles.ipBig}>{ip.public_ip}</div>

          <div style={styles.metaGrid}>
            {(ip.country || ip.country_code) && (
              <div style={styles.metaCell}>
                <span style={styles.metaLabel}>Country</span>
                <span style={styles.metaValue}>
                  {countryFlag(ip.country_code)} {ip.country ?? ip.country_code}
                </span>
              </div>
            )}
            {ip.city && (
              <div style={styles.metaCell}>
                <span style={styles.metaLabel}>City</span>
                <span style={styles.metaValue}>
                  {ip.city}{ip.region ? `, ${ip.region}` : ''}
                </span>
              </div>
            )}
            {ip.asn_org && (
              <div style={{ ...styles.metaCell, gridColumn: '1 / -1' }}>
                <span style={styles.metaLabel}>Provider</span>
                <span style={{ ...styles.metaValue, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {ip.asn_org}
                </span>
              </div>
            )}
          </div>
        </div>
      ) : running ? (
        <div style={styles.noIp}>No IP info available</div>
      ) : (
        <div style={styles.disconnected}>
          <span style={{ fontSize: '1.8rem', opacity: 0.3 }}>🔓</span>
          <span style={styles.disconnectedText}>VPN is not running</span>
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

export function GluetunConfig({ config, onChange }: WidgetConfigProps) {
  const url             = (config.url as string) ?? '';
  const username        = (config.username as string) ?? '';
  const password        = (config.password as string) ?? '';
  const refreshInterval = (config.refreshInterval as string) ?? '30';
  const [probeResults, setProbeResults] = useState<Array<{path: string; httpStatus?: number; ok?: boolean; body?: string; error?: string}> | null>(null);
  const [probing, setProbing] = useState(false);

  async function runProbe() {
    if (!url) return;
    setProbing(true);
    setProbeResults(null);
    try {
      const token = localStorage.getItem('orbix_token');
      const res = await fetch('/api/integrations/gluetun/probe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ baseUrl: url, username, password }),
      });
      const data = await res.json();
      setProbeResults(data.results ?? []);
    } catch {
      setProbeResults([]);
    } finally {
      setProbing(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <SettingsField label="Gluetun control server URL" hint="Default port is 8000, e.g. http://192.168.1.1:8000">
        <SettingsInput
          value={url}
          onChange={(v) => onChange({ ...config, url: v })}
          placeholder="http://192.168.1.1:8000"
        />
      </SettingsField>

      <SettingsField label="Username" hint="Only required if auth/config.toml is configured">
        <SettingsInput
          value={username}
          onChange={(v) => onChange({ ...config, username: v })}
          placeholder="Leave blank if no auth"
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

      {url && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button onClick={runProbe} disabled={probing} style={probeBtn}>
            {probing ? 'Probing…' : '🔍 Diagnose endpoints'}
          </button>
          {probeResults && (
            <div style={probeBox}>
              {probeResults.slice(0, 3).map((r) => (
                <div key={r.path} style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline', flexWrap: 'wrap' }}>
                  <span style={{ color: r.ok ? 'var(--color-success)' : 'var(--color-danger)', fontSize: '0.7rem', flexShrink: 0, fontWeight: 600 }}>
                    {r.ok ? '✓' : r.httpStatus ?? '✗'}
                  </span>
                  <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: r.ok ? 'var(--color-text)' : 'var(--color-text-muted)' }}>
                    {r.path}
                  </span>
                  {r.error && (
                    <span style={{ fontSize: '0.68rem', color: 'var(--color-danger)' }}>{r.error}</span>
                  )}
                  {r.ok && r.body && (
                    <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>{r.body}</span>
                  )}
                </div>
              ))}
              {probeResults.every(r => !r.ok) && (
                <div style={{ fontSize: '0.72rem', color: 'var(--color-danger)', marginTop: '0.4rem', lineHeight: 1.5 }}>
                  Cannot connect. Check that the port is exposed and the URL is correct.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const probeBtn: React.CSSProperties = {
  padding: '0.4rem 0.75rem',
  background: 'var(--color-surface-hover)',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
  color: 'var(--color-text)',
  fontSize: '0.8rem',
  cursor: 'pointer',
  textAlign: 'left',
};

const probeBox: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.3rem',
  padding: '0.5rem',
  background: 'var(--color-background)',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
  maxHeight: '180px',
  overflowY: 'auto',
};

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
    gap: '0.6rem',
    textAlign: 'center',
  },
  emptyIcon: {
    fontSize: '2rem',
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
  details: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '0.65rem 0.75rem',
    background: 'var(--color-surface-hover)',
    borderRadius: '10px',
    flex: 1,
  },
  ipBig: {
    fontSize: '1.05rem',
    fontWeight: 700,
    color: 'var(--color-text)',
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: '0.02em',
  },
  metaGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.45rem 0.75rem',
  },
  metaCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.1rem',
    minWidth: 0,
  },
  metaLabel: {
    fontSize: '0.62rem',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    fontWeight: 600,
  },
  metaValue: {
    fontSize: '0.82rem',
    color: 'var(--color-text)',
    fontWeight: 500,
  },
  noIp: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.8rem',
    color: 'var(--color-text-muted)',
  },
  disconnected: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.4rem',
  },
  disconnectedText: {
    fontSize: '0.8rem',
    color: 'var(--color-text-muted)',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  updated: {
    fontSize: '0.68rem',
    color: 'var(--color-text-muted)',
    opacity: 0.55,
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
