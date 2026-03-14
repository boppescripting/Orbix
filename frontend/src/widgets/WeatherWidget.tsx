import React, { useState, useEffect, useCallback } from 'react';
import type { WidgetProps, WidgetConfigProps } from '../types';
import { SettingsField, SettingsInput, SettingsSelect } from './SettingsComponents';
import { authHeaders } from '../utils';

const REFRESH_OPTIONS = [
  { label: '5 minutes',  value: '300' },
  { label: '15 minutes', value: '900' },
  { label: '30 minutes', value: '1800' },
  { label: '1 hour',     value: '3600' },
];

const UNIT_OPTIONS = [
  { label: '°C — Celsius',    value: 'celsius' },
  { label: '°F — Fahrenheit', value: 'fahrenheit' },
];

const WIND_OPTIONS = [
  { label: 'km/h', value: 'kmh' },
  { label: 'mph',  value: 'mph' },
];

interface WeatherData {
  location:    string;
  temperature: number;
  feelsLike:   number;
  humidity:    number;
  windSpeed:   number;
  condition:   string;
  icon:        string;
  unit:        string;
  windUnit:    string;
}

function unitSymbol(unit: string) {
  return unit === 'fahrenheit' ? '°F' : '°C';
}


export default function WeatherWidget({ config }: WidgetProps) {
  const city     = (config.city as string) ?? '';
  const unit     = (config.unit as string) ?? 'celsius';
  const windUnit = (config.windUnit as string) ?? 'kmh';
  const refresh  = parseInt((config.refreshInterval as string) ?? '900', 10);

  const windDisplay = (speedKmh: number) =>
    windUnit === 'mph' ? Math.round(speedKmh * 0.621371) : speedKmh;

  const [data, setData]               = useState<WeatherData | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [loading, setLoading]         = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    if (!city) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/integrations/weather', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ city, unit }),
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
  }, [city, unit]);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, refresh * 1000);
    return () => clearInterval(id);
  }, [fetchData, refresh]);

  if (!city) {
    return (
      <div style={styles.centered}>
        <div style={{ fontSize: '2rem' }}>🌤️</div>
        <p style={styles.hint}>Set a city name in settings to get started.</p>
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
        <p style={styles.hint}>Fetching weather…</p>
      </div>
    );
  }

  if (!data) return null;

  const sym = unitSymbol(data.unit);

  return (
    <div style={styles.container}>
      {/* Status bar */}
      <div style={styles.statusBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={styles.dot} />
          <span style={styles.statusText}>{data.location}</span>
        </div>
        <span style={styles.version}>{data.condition}</span>
      </div>

      {/* Main temp */}
      <div style={styles.tempRow}>
        <span style={styles.icon}>{data.icon}</span>
        <div>
          <div style={styles.temp}>{data.temperature}{sym}</div>
          <div style={styles.feelsLike}>Feels like {data.feelsLike}{sym}</div>
        </div>
      </div>

      {/* Stats grid */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{data.humidity}<span style={styles.unit}>%</span></div>
          <div style={styles.statLabel}>Humidity</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{windDisplay(data.windSpeed)}<span style={styles.unit}>{windUnit === 'mph' ? 'mph' : 'km/h'}</span></div>
          <div style={styles.statLabel}>Wind</div>
        </div>
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        {lastUpdated && (
          <span style={styles.updated}>
            Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
        <button onClick={fetchData} style={styles.refreshBtn} title="Refresh" disabled={loading}>↻</button>
      </div>
    </div>
  );
}

export function WeatherConfig({ config, onChange }: WidgetConfigProps) {
  const city            = (config.city as string) ?? '';
  const unit            = (config.unit as string) ?? 'celsius';
  const windUnit        = (config.windUnit as string) ?? 'kmh';
  const refreshInterval = (config.refreshInterval as string) ?? '900';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <SettingsField label="City" hint="e.g. London, New York, Tokyo">
        <SettingsInput
          value={city}
          onChange={(v) => onChange({ ...config, city: v })}
          placeholder="Enter city name"
        />
      </SettingsField>

      <SettingsField label="Temperature unit">
        <SettingsSelect
          value={unit}
          onChange={(v) => onChange({ ...config, unit: v })}
          options={UNIT_OPTIONS}
        />
      </SettingsField>

      <SettingsField label="Wind speed unit">
        <SettingsSelect
          value={windUnit}
          onChange={(v) => onChange({ ...config, windUnit: v })}
          options={WIND_OPTIONS}
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
    background: 'var(--color-primary)',
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
  tempRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.5rem 0.25rem',
    flex: 1,
  },
  icon: {
    fontSize: '3rem',
    lineHeight: 1,
    flexShrink: 0,
  },
  temp: {
    fontSize: '2.4rem',
    fontWeight: 700,
    color: 'var(--color-text)',
    lineHeight: 1,
    fontVariantNumeric: 'tabular-nums',
  },
  feelsLike: {
    fontSize: '0.78rem',
    color: 'var(--color-text-muted)',
    marginTop: '0.2rem',
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
