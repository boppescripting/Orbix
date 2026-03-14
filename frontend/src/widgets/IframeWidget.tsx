import React from 'react';
import type { WidgetProps, WidgetConfigProps } from '../types';
import { SettingsField } from './SettingsComponents';

export default function IframeWidget({ config }: WidgetProps) {
  const url = (config.url as string) ?? 'https://example.com';

  return (
    <div style={styles.container}>
      <iframe
        src={url}
        style={styles.iframe}
        title={String(config.title ?? 'Embedded content')}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        loading="lazy"
      />
    </div>
  );
}

export function IframeConfig({ config, onChange }: WidgetConfigProps) {
  const url = (config.url as string) ?? '';

  function handleUrlBlur(value: string) {
    const normalized = value && !value.startsWith('http') ? `https://${value}` : value;
    onChange({ ...config, url: normalized });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <SettingsField label="URL" hint="Enter the full address to embed.">
        <input
          type="text"
          defaultValue={url}
          onBlur={(e) => handleUrlBlur(e.target.value)}
          placeholder="https://example.com"
          style={inputStyle}
        />
      </SettingsField>

      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)', opacity: 0.7 }}>
        Note: some sites block embedding via X-Frame-Options.
      </p>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '0.45rem 0.65rem',
  background: 'var(--color-surface-hover)',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
  color: 'var(--color-text)',
  fontSize: '0.875rem',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  iframe: {
    flex: 1,
    border: 'none',
    borderRadius: '6px',
    width: '100%',
    height: '100%',
    background: '#fff',
  },
};
