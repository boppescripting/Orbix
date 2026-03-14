import React, { useState, useEffect } from 'react';
import type { WidgetProps, WidgetConfigProps } from '../types';
import { SettingsField, SettingsSelect, SettingsToggle } from './SettingsComponents';

const TIMEZONES = [
  { label: 'Local (device time)', value: 'local' },
  { label: 'UTC', value: 'UTC' },
  { label: 'US — New York (ET)', value: 'America/New_York' },
  { label: 'US — Chicago (CT)', value: 'America/Chicago' },
  { label: 'US — Denver (MT)', value: 'America/Denver' },
  { label: 'US — Los Angeles (PT)', value: 'America/Los_Angeles' },
  { label: 'US — Anchorage (AKT)', value: 'America/Anchorage' },
  { label: 'US — Honolulu (HT)', value: 'Pacific/Honolulu' },
  { label: 'Canada — Toronto', value: 'America/Toronto' },
  { label: 'Canada — Vancouver', value: 'America/Vancouver' },
  { label: 'Mexico — Mexico City', value: 'America/Mexico_City' },
  { label: 'Brazil — São Paulo', value: 'America/Sao_Paulo' },
  { label: 'Argentina — Buenos Aires', value: 'America/Argentina/Buenos_Aires' },
  { label: 'UK — London (GMT/BST)', value: 'Europe/London' },
  { label: 'Europe — Paris / Berlin (CET)', value: 'Europe/Paris' },
  { label: 'Europe — Helsinki (EET)', value: 'Europe/Helsinki' },
  { label: 'Europe — Moscow (MSK)', value: 'Europe/Moscow' },
  { label: 'Africa — Cairo (EET)', value: 'Africa/Cairo' },
  { label: 'Africa — Nairobi (EAT)', value: 'Africa/Nairobi' },
  { label: 'Asia — Dubai (GST)', value: 'Asia/Dubai' },
  { label: 'Asia — Karachi (PKT)', value: 'Asia/Karachi' },
  { label: 'Asia — Kolkata (IST)', value: 'Asia/Kolkata' },
  { label: 'Asia — Dhaka (BST)', value: 'Asia/Dhaka' },
  { label: 'Asia — Bangkok (ICT)', value: 'Asia/Bangkok' },
  { label: 'Asia — Singapore / KL (SGT)', value: 'Asia/Singapore' },
  { label: 'Asia — Shanghai / Beijing (CST)', value: 'Asia/Shanghai' },
  { label: 'Asia — Seoul (KST)', value: 'Asia/Seoul' },
  { label: 'Asia — Tokyo (JST)', value: 'Asia/Tokyo' },
  { label: 'Australia — Perth (AWST)', value: 'Australia/Perth' },
  { label: 'Australia — Adelaide (ACST)', value: 'Australia/Adelaide' },
  { label: 'Australia — Sydney (AEST)', value: 'Australia/Sydney' },
  { label: 'Pacific — Auckland (NZST)', value: 'Pacific/Auckland' },
];

function getTime(timezone: string, format: string): string {
  const tz = timezone === 'local' ? undefined : timezone;
  return new Date().toLocaleTimeString('en-US', {
    timeZone: tz,
    hour12: format === '12h',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function getDate(timezone: string): string {
  const tz = timezone === 'local' ? undefined : timezone;
  return new Date().toLocaleDateString('en-US', {
    timeZone: tz,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function ClockWidget({ config }: WidgetProps) {
  const timezone = (config.timezone as string) ?? 'local';
  const format = (config.format as string) ?? '24h';
  const showDate = config.showDate !== false;

  const [time, setTime] = useState(() => getTime(timezone, format));
  const [date, setDate] = useState(() => getDate(timezone));

  useEffect(() => {
    const id = setInterval(() => {
      setTime(getTime(timezone, format));
      setDate(getDate(timezone));
    }, 1000);
    return () => clearInterval(id);
  }, [timezone, format]);

  const tzLabel =
    timezone === 'local'
      ? 'Local time'
      : (TIMEZONES.find((t) => t.value === timezone)?.label ?? timezone);

  return (
    <div style={styles.container}>
      <div style={styles.time}>{time}</div>
      {showDate && <div style={styles.date}>{date}</div>}
      {config.showTimezone !== false && <div style={styles.tz}>{tzLabel}</div>}
    </div>
  );
}

export function ClockConfig({ config, onChange }: WidgetConfigProps) {
  const timezone = (config.timezone as string) ?? 'local';
  const format = (config.format as string) ?? '24h';
  const showDate = config.showDate !== false;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <SettingsField label="Timezone">
        <SettingsSelect
          value={timezone}
          onChange={(v) => onChange({ ...config, timezone: v })}
          options={TIMEZONES}
        />
      </SettingsField>

      <SettingsField label="Time format">
        <SettingsSelect
          value={format}
          onChange={(v) => onChange({ ...config, format: v })}
          options={[
            { label: '24-hour (14:30:00)', value: '24h' },
            { label: '12-hour (2:30:00 PM)', value: '12h' },
          ]}
        />
      </SettingsField>

      <SettingsField label="Show date">
        <SettingsToggle
          value={showDate}
          onChange={(v) => onChange({ ...config, showDate: v })}
        />
      </SettingsField>

      <SettingsField label="Show timezone label">
        <SettingsToggle
          value={config.showTimezone !== false}
          onChange={(v) => onChange({ ...config, showTimezone: v })}
        />
      </SettingsField>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: '0.35rem',
    padding: '0.5rem',
  },
  time: {
    fontSize: 'clamp(1.4rem, 4vw, 2.25rem)',
    fontWeight: 700,
    color: 'var(--color-text)',
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: '-0.02em',
  },
  date: {
    fontSize: '0.85rem',
    color: 'var(--color-text-muted)',
    textAlign: 'center',
  },
  tz: {
    fontSize: '0.7rem',
    color: 'var(--color-text-muted)',
    opacity: 0.6,
    textAlign: 'center',
  },
};
