import React, { useState, useRef } from 'react';
import type { WidgetProps, WidgetConfigProps } from '../types';
import { SettingsField, SettingsSelect } from './SettingsComponents';

const FONT_SIZES = [
  { label: 'Small (13px)', value: '13px' },
  { label: 'Medium (14px)', value: '14px' },
  { label: 'Large (16px)', value: '16px' },
  { label: 'X-Large (18px)', value: '18px' },
];

export default function NotesWidget({ config, onConfigChange }: WidgetProps) {
  const content = (config.content as string) ?? '';
  const title = (config.title as string) ?? 'Notes';
  const fontSize = (config.fontSize as string) ?? '14px';

  const [editingTitle, setEditingTitle] = useState(false);
  const [localTitle, setLocalTitle] = useState(title);
  const [localContent, setLocalContent] = useState(content);
  const titleInputRef = useRef<HTMLInputElement>(null);

  function handleContentBlur() {
    if (localContent !== content) {
      onConfigChange({ ...config, content: localContent });
    }
  }

  function handleTitleClick() {
    setEditingTitle(true);
    setTimeout(() => titleInputRef.current?.focus(), 0);
  }

  function handleTitleBlur() {
    setEditingTitle(false);
    if (localTitle !== title) {
      onConfigChange({ ...config, title: localTitle });
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.titleRow}>
        {editingTitle ? (
          <input
            ref={titleInputRef}
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={(e) => { if (e.key === 'Enter') titleInputRef.current?.blur(); }}
            style={styles.titleInput}
          />
        ) : (
          <span style={styles.title} onClick={handleTitleClick} title="Click to edit title">
            {localTitle || 'Notes'}
          </span>
        )}
        <span style={styles.charCount}>{localContent.length} chars</span>
      </div>
      <textarea
        value={localContent}
        onChange={(e) => setLocalContent(e.target.value)}
        onBlur={handleContentBlur}
        placeholder="Start typing your notes..."
        style={{ ...styles.textarea, fontSize }}
      />
    </div>
  );
}

export function NotesConfig({ config, onChange }: WidgetConfigProps) {
  const fontSize = (config.fontSize as string) ?? '14px';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <SettingsField label="Font size">
        <SettingsSelect
          value={fontSize}
          onChange={(v) => onChange({ ...config, fontSize: v })}
          options={FONT_SIZES}
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
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: 'var(--color-text)',
    cursor: 'pointer',
    borderBottom: '1px dashed transparent',
  },
  titleInput: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: 'var(--color-text)',
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid var(--color-primary)',
    outline: 'none',
    flex: 1,
    padding: '0 2px',
  },
  charCount: {
    fontSize: '0.7rem',
    color: 'var(--color-text-muted)',
  },
  textarea: {
    flex: 1,
    background: 'transparent',
    border: '1px solid var(--color-border)',
    borderRadius: '6px',
    color: 'var(--color-text)',
    padding: '0.5rem',
    resize: 'none',
    outline: 'none',
    lineHeight: 1.6,
  },
};
