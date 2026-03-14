import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import type { Theme } from '../types';

interface ThemeEditorProps {
  onClose: () => void;
}

const COLOR_GROUPS: Array<{
  label: string;
  keys: Array<{ key: keyof Theme; label: string }>;
}> = [
  {
    label: 'Background',
    keys: [
      { key: 'background', label: 'Page Background' },
      { key: 'surface', label: 'Surface' },
      { key: 'surfaceHover', label: 'Surface Hover' },
    ],
  },
  {
    label: 'Text',
    keys: [
      { key: 'text', label: 'Primary Text' },
      { key: 'textMuted', label: 'Muted Text' },
    ],
  },
  {
    label: 'Accent',
    keys: [
      { key: 'primary', label: 'Primary' },
      { key: 'primaryHover', label: 'Primary Hover' },
      { key: 'success', label: 'Success' },
      { key: 'danger', label: 'Danger' },
    ],
  },
  {
    label: 'Widgets',
    keys: [
      { key: 'widgetBackground', label: 'Widget Background' },
      { key: 'widgetBorder', label: 'Widget Border' },
      { key: 'border', label: 'Border' },
    ],
  },
];

const FONT_FAMILIES = [
  { label: 'Courier New (Brutalist)', value: "'Courier New', Courier, monospace" },
  { label: 'System UI (Sans-serif)', value: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  { label: 'Georgia (Serif)', value: "Georgia, 'Times New Roman', serif" },
  { label: 'Consolas (Monospace)', value: "Consolas, 'Lucida Console', monospace" },
];

const FONT_WEIGHTS = [
  { label: 'Light (300)', value: '300' },
  { label: 'Normal (400)', value: '400' },
  { label: 'Medium (500)', value: '500' },
  { label: 'Bold (700)', value: '700' },
];

export default function ThemeEditor({ onClose }: ThemeEditorProps) {
  const { theme, updateTheme, saveTheme, resetTheme } = useTheme();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await saveTheme();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save theme:', err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <span style={styles.title}>THEME EDITOR</span>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>
        <p style={styles.subtitle}>Changes apply instantly as a live preview</p>

        <div style={styles.groups}>
          {/* Typography section */}
          <div style={styles.group}>
            <h3 style={styles.groupLabel}>Typography</h3>
            <div style={styles.colorRow}>
              <label style={styles.colorLabel}>Font Family</label>
              <select
                value={theme.fontFamily ?? "'Courier New', Courier, monospace"}
                onChange={(e) => updateTheme({ fontFamily: e.target.value })}
                style={styles.select}
              >
                {FONT_FAMILIES.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
            <div style={styles.colorRow}>
              <label style={styles.colorLabel}>Base Weight</label>
              <select
                value={theme.fontWeight ?? '400'}
                onChange={(e) => updateTheme({ fontWeight: e.target.value })}
                style={styles.select}
              >
                {FONT_WEIGHTS.map((w) => (
                  <option key={w.value} value={w.value}>{w.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Color sections */}
          {COLOR_GROUPS.map((group) => (
            <div key={group.label} style={styles.group}>
              <h3 style={styles.groupLabel}>{group.label}</h3>
              {group.keys.map(({ key, label }) => (
                <div key={key} style={styles.colorRow}>
                  <label style={styles.colorLabel}>{label}</label>
                  <div style={styles.colorInputWrapper}>
                    <input
                      type="color"
                      value={theme[key] as string}
                      onChange={(e) => updateTheme({ [key]: e.target.value })}
                      style={styles.colorInput}
                    />
                    <span style={styles.colorHex}>{theme[key] as string}</span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div style={styles.footer}>
          <button onClick={resetTheme} style={styles.btnReset}>
            RESET
          </button>
          <button onClick={handleSave} disabled={saving} style={styles.btnSave}>
            {saved ? '✓ SAVED' : saving ? 'SAVING...' : 'SAVE'}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    zIndex: 1000,
    padding: '1rem',
  },
  panel: {
    width: '320px',
    maxHeight: 'calc(100vh - 2rem)',
    background: 'var(--color-surface)',
    border: '2px solid var(--color-border)',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 1rem 0.5rem',
    borderBottom: '2px solid var(--color-border)',
    flexShrink: 0,
  },
  title: {
    fontSize: '0.8rem',
    fontWeight: 900,
    color: 'var(--color-text)',
    letterSpacing: '0.15em',
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--color-text-muted)',
    cursor: 'pointer',
    fontSize: '0.9rem',
    padding: '0.2rem 0.4rem',
  },
  subtitle: {
    color: 'var(--color-text-muted)',
    fontSize: '0.7rem',
    padding: '0.5rem 1rem 0.75rem',
    letterSpacing: '0.04em',
  },
  groups: {
    padding: '0 1rem',
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    paddingBottom: '1rem',
  },
  group: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
  },
  groupLabel: {
    fontSize: '0.65rem',
    fontWeight: 800,
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    borderBottom: '1px solid var(--color-border)',
    paddingBottom: '0.3rem',
    marginBottom: '0.1rem',
  },
  colorRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
  },
  colorLabel: {
    fontSize: '0.75rem',
    color: 'var(--color-text)',
    flex: 1,
    letterSpacing: '0.03em',
  },
  colorInputWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  colorInput: {
    width: '32px',
    height: '26px',
    padding: '2px',
    border: '2px solid var(--color-border)',
    cursor: 'pointer',
    background: 'transparent',
  },
  colorHex: {
    fontSize: '0.7rem',
    color: 'var(--color-text-muted)',
    fontFamily: "'Courier New', Courier, monospace",
    minWidth: '58px',
    letterSpacing: '0.04em',
  },
  select: {
    padding: '0.3rem 0.5rem',
    background: 'var(--color-surface-hover)',
    border: '2px solid var(--color-border)',
    color: 'var(--color-text)',
    fontSize: '0.72rem',
    cursor: 'pointer',
    maxWidth: '180px',
  },
  footer: {
    display: 'flex',
    gap: '0.5rem',
    padding: '0.75rem 1rem',
    borderTop: '2px solid var(--color-border)',
    flexShrink: 0,
  },
  btnReset: {
    flex: 1,
    padding: '0.5rem',
    background: 'transparent',
    color: 'var(--color-text-muted)',
    border: '2px solid var(--color-border)',
    fontSize: '0.72rem',
    fontWeight: 700,
    letterSpacing: '0.1em',
    cursor: 'pointer',
  },
  btnSave: {
    flex: 1,
    padding: '0.5rem',
    background: 'var(--color-primary)',
    color: '#000',
    border: '2px solid var(--color-primary)',
    fontSize: '0.72rem',
    fontWeight: 900,
    letterSpacing: '0.1em',
    cursor: 'pointer',
  },
};
