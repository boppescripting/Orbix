import React, { useState } from 'react';
import type { WidgetProps } from '../types';

interface BookmarkLink {
  name: string;
  url: string;
}

export default function BookmarksWidget({ config, onConfigChange, editMode }: WidgetProps) {
  const links = (config.links as BookmarkLink[]) ?? [];
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');

  function handleAdd() {
    if (!newName.trim() || !newUrl.trim()) return;
    const url = newUrl.startsWith('http') ? newUrl : `https://${newUrl}`;
    const updated = [...links, { name: newName.trim(), url }];
    onConfigChange({ ...config, links: updated });
    setNewName('');
    setNewUrl('');
    setAdding(false);
  }

  function handleRemove(index: number) {
    const updated = links.filter((_, i) => i !== index);
    onConfigChange({ ...config, links: updated });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleAdd();
    if (e.key === 'Escape') setAdding(false);
  }

  return (
    <div style={styles.container}>
      <div style={styles.list}>
        {links.length === 0 && !adding && (
          <p style={styles.empty}>No bookmarks yet. Add one below.</p>
        )}
        {links.map((link, i) => (
          <div key={i} style={styles.linkRow}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.link}
              title={link.url}
            >
              <span style={styles.favicon}>
                {/* Simple letter avatar */}
                {link.name[0]?.toUpperCase() ?? '?'}
              </span>
              <span style={styles.linkName}>{link.name}</span>
            </a>
            {editMode && (
              <button
                onClick={() => handleRemove(i)}
                style={styles.removeBtn}
                title="Remove bookmark"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {editMode && adding ? (
        <div style={styles.addForm}>
          <input
            type="text"
            placeholder="Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={handleKeyDown}
            style={styles.addInput}
            autoFocus
          />
          <input
            type="text"
            placeholder="URL (e.g. github.com)"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            style={styles.addInput}
          />
          <div style={styles.addActions}>
            <button onClick={() => setAdding(false)} style={styles.cancelBtn}>
              Cancel
            </button>
            <button onClick={handleAdd} style={styles.addSubmitBtn}>
              Add
            </button>
          </div>
        </div>
      ) : editMode ? (
        <button onClick={() => setAdding(true)} style={styles.addBtn}>
          + Add bookmark
        </button>
      ) : null}
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
  list: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  empty: {
    color: 'var(--color-text-muted)',
    fontSize: '0.8rem',
    textAlign: 'center',
    padding: '1rem 0',
  },
  linkRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    borderRadius: '6px',
    padding: '0.25rem 0.35rem',
    transition: 'background 0.15s',
  },
  link: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: 'var(--color-text)',
    textDecoration: 'none',
    fontSize: '0.875rem',
    minWidth: 0,
  },
  favicon: {
    width: '22px',
    height: '22px',
    background: 'var(--color-primary)',
    color: '#fff',
    borderRadius: '5px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.7rem',
    fontWeight: 700,
    flexShrink: 0,
  },
  linkName: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  removeBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--color-text-muted)',
    cursor: 'pointer',
    fontSize: '0.7rem',
    padding: '0.1rem 0.3rem',
    borderRadius: '3px',
    opacity: 0.6,
    flexShrink: 0,
  },
  addForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
    padding: '0.5rem',
    background: 'var(--color-surface-hover)',
    borderRadius: '8px',
    border: '1px solid var(--color-border)',
  },
  addInput: {
    padding: '0.4rem 0.6rem',
    background: 'var(--color-background)',
    border: '1px solid var(--color-border)',
    borderRadius: '5px',
    color: 'var(--color-text)',
    fontSize: '0.8rem',
    outline: 'none',
  },
  addActions: {
    display: 'flex',
    gap: '0.4rem',
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    padding: '0.3rem 0.7rem',
    background: 'transparent',
    border: '1px solid var(--color-border)',
    borderRadius: '5px',
    color: 'var(--color-text-muted)',
    fontSize: '0.8rem',
    cursor: 'pointer',
  },
  addSubmitBtn: {
    padding: '0.3rem 0.7rem',
    background: 'var(--color-primary)',
    border: 'none',
    borderRadius: '5px',
    color: '#fff',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  addBtn: {
    padding: '0.4rem',
    background: 'transparent',
    border: '1px dashed var(--color-border)',
    borderRadius: '6px',
    color: 'var(--color-text-muted)',
    fontSize: '0.8rem',
    cursor: 'pointer',
    textAlign: 'center',
    flexShrink: 0,
  },
};
