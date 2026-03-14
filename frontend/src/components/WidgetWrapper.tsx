import React, { useState, useRef, useEffect } from 'react';
import type { WidgetConfigProps } from '../types';

interface WidgetWrapperProps {
  widgetId: string;
  widgetName: string;
  editMode: boolean;
  onRemove: () => void;
  children: React.ReactNode;
  configComponent?: React.ComponentType<WidgetConfigProps>;
  config: Record<string, unknown>;
  onConfigChange: (config: Record<string, unknown>) => void;
}

export default function WidgetWrapper({
  widgetName,
  editMode,
  onRemove,
  children,
  configComponent: ConfigComponent,
  config,
  onConfigChange,
}: WidgetWrapperProps) {
  const displayName = (config.customName as string) || widgetName;
  const [showSettings, setShowSettings] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(displayName);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const hasSettings = !!ConfigComponent && editMode;

  useEffect(() => {
    if (!editMode) {
      setShowSettings(false);
      setEditingName(false);
    }
  }, [editMode]);

  // Keep nameValue in sync if config changes externally
  useEffect(() => {
    setNameValue((config.customName as string) || widgetName);
  }, [config.customName, widgetName]);

  function startEditingName(e: React.MouseEvent) {
    if (!editMode) return;
    e.stopPropagation();
    setEditingName(true);
    setTimeout(() => nameInputRef.current?.focus(), 0);
  }

  function commitName() {
    setEditingName(false);
    const trimmed = nameValue.trim();
    const finalName = trimmed || widgetName;
    setNameValue(finalName);
    onConfigChange({ ...config, customName: trimmed || '' });
  }

  function handleNameKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') commitName();
    if (e.key === 'Escape') {
      setNameValue((config.customName as string) || widgetName);
      setEditingName(false);
    }
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        {/* Drag handle — only the grip icon, keeps title clicks independent */}
        {editMode && (
          <span
            className="widget-drag-handle"
            style={styles.dragIcon}
            title="Drag to move"
          >
            ⠿
          </span>
        )}

        {/* Widget title — editable inline in edit mode */}
        <div style={styles.titleArea}>
          {editingName ? (
            <input
              ref={nameInputRef}
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={commitName}
              onKeyDown={handleNameKeyDown}
              onClick={(e) => e.stopPropagation()}
              style={styles.nameInput}
              placeholder={widgetName}
            />
          ) : (
            <span
              style={{
                ...styles.title,
                cursor: editMode ? 'text' : 'default',
                borderBottom: editMode ? '1px dashed var(--color-border)' : '1px dashed transparent',
              }}
              onClick={startEditingName}
              title={editMode ? 'Click to rename' : undefined}
            >
              {displayName}
            </span>
          )}
        </div>

        {hasSettings && (
          <button
            onClick={(e) => { e.stopPropagation(); setShowSettings((s) => !s); }}
            style={{
              ...styles.iconBtn,
              color: showSettings ? 'var(--color-primary)' : 'var(--color-text-muted)',
              background: showSettings ? 'rgba(99,102,241,0.12)' : 'transparent',
            }}
            title={showSettings ? 'Close settings' : 'Widget settings'}
          >
            ⚙
          </button>
        )}

        {editMode && (
          <button
            onClick={onRemove}
            style={styles.iconBtn}
            title="Remove widget"
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-danger)';
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.1)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-muted)';
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            }}
          >
            ✕
          </button>
        )}
      </div>

      <div style={styles.content}>
        {showSettings && ConfigComponent ? (
          <ConfigComponent config={config} onChange={onConfigChange} />
        ) : (
          children
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    width: '100%',
    height: '100%',
    background: 'var(--color-widget-bg)',
    border: '2px solid var(--color-widget-border)',
    borderRadius: 0,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    padding: '0.35rem 0.6rem',
    borderBottom: '2px solid var(--color-border)',
    flexShrink: 0,
    background: 'var(--color-surface)',
  },
  dragIcon: {
    color: 'var(--color-text-muted)',
    fontSize: '1rem',
    lineHeight: 1,
    flexShrink: 0,
    width: '16px',
    textAlign: 'center',
    userSelect: 'none',
  },
  titleArea: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
  },
  title: {
    fontSize: '0.7rem',
    fontWeight: 800,
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '100%',
    fontFamily: "'Courier New', Courier, monospace",
  },
  nameInput: {
    flex: 1,
    width: '100%',
    fontSize: '0.7rem',
    fontWeight: 800,
    color: 'var(--color-text)',
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid var(--color-primary)',
    outline: 'none',
    padding: '0 2px',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    fontFamily: "'Courier New', Courier, monospace",
  },
  iconBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--color-text-muted)',
    cursor: 'pointer',
    padding: '0.2rem 0.4rem',
    borderRadius: 0,
    fontSize: '0.85rem',
    lineHeight: 1,
    transition: 'color 0.1s',
    flexShrink: 0,
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: '0.75rem',
  },
};
