import React, { useState } from 'react';
import type { WidgetProps, WidgetConfigProps } from '../types';
import { SettingsField, SettingsSelect, SettingsInput } from './SettingsComponents';

export const ENGINES: Record<string, { label: string; url: string; icon: string }> = {
  google: { label: 'Google', url: 'https://www.google.com/search?q=', icon: 'G' },
  duckduckgo: { label: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=', icon: '🦆' },
  bing: { label: 'Bing', url: 'https://www.bing.com/search?q=', icon: 'B' },
  brave: { label: 'Brave Search', url: 'https://search.brave.com/search?q=', icon: '🦁' },
  kagi: { label: 'Kagi', url: 'https://kagi.com/search?q=', icon: 'K' },
  startpage: { label: 'Startpage', url: 'https://www.startpage.com/search?q=', icon: 'S' },
};

export default function SearchWidget({ config }: WidgetProps) {
  const engine = (config.engine as string) ?? 'google';
  const placeholder = (config.placeholder as string) ?? 'Search the web...';
  const [query, setQuery] = useState('');

  const engineData = ENGINES[engine] ?? ENGINES.google;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    window.open(`${engineData.url}${encodeURIComponent(query.trim())}`, '_blank');
    setQuery('');
  }

  return (
    <div style={styles.container}>
      <form onSubmit={handleSearch} style={styles.form}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          style={styles.input}
          autoComplete="off"
        />
        <button type="submit" style={styles.btn} title={`Search with ${engineData.label}`}>
          →
        </button>
      </form>
    </div>
  );
}

export function SearchConfig({ config, onChange }: WidgetConfigProps) {
  const engine = (config.engine as string) ?? 'google';
  const placeholder = (config.placeholder as string) ?? 'Search the web...';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <SettingsField label="Search engine">
        <SettingsSelect
          value={engine}
          onChange={(v) => onChange({ ...config, engine: v })}
          options={Object.entries(ENGINES).map(([key, val]) => ({
            label: val.label,
            value: key,
          }))}
        />
      </SettingsField>

      <SettingsField label="Placeholder text">
        <SettingsInput
          value={placeholder}
          onChange={(v) => onChange({ ...config, placeholder: v })}
          placeholder="Search the web..."
        />
      </SettingsField>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    height: '100%',
  },
  form: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    width: '100%',
  },
  engineBadge: {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--color-surface-hover)',
    border: '1px solid var(--color-border)',
    borderRadius: '7px',
    fontSize: '0.85rem',
    fontWeight: 700,
    color: 'var(--color-text)',
    flexShrink: 0,
    userSelect: 'none',
  },
  input: {
    flex: 1,
    padding: '0.55rem 0.85rem',
    background: 'var(--color-background)',
    border: '1px solid var(--color-border)',
    borderRadius: '7px',
    color: 'var(--color-text)',
    fontSize: '0.95rem',
    outline: 'none',
  },
  btn: {
    padding: '0.5rem 0.85rem',
    background: 'var(--color-primary)',
    border: 'none',
    borderRadius: '7px',
    cursor: 'pointer',
    fontSize: '1.1rem',
    color: '#fff',
    flexShrink: 0,
    fontWeight: 700,
  },
};
