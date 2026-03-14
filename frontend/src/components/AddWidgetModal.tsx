import React, { useState, useRef, useEffect } from 'react';
import { widgetRegistry } from '../widgets/registry';
import type { WidgetDefinition } from '../types';

interface AddWidgetModalProps {
  onAdd: (type: string, config: Record<string, unknown>) => void;
  onClose: () => void;
}

const CATEGORIES: Array<{ label: string; types: string[] }> = [
  { label: 'Utilities',              types: ['clock', 'notes', 'bookmarks', 'search', 'iframe'] },
  { label: 'Media',                  types: ['jellyfin', 'jellyseerr'] },
  { label: 'Network',                types: ['gluetun', 'adguard', 'cloudflaretunnels'] },
  { label: 'Downloads & Containers', types: ['qbittorrent', 'whatsupdocker'] },
  { label: 'Information',            types: ['weather'] },
];

export default function AddWidgetModal({ onAdd, onClose }: AddWidgetModalProps) {
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? widgetRegistry.filter((w) => w.name.toLowerCase().includes(q))
    : null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <span style={styles.title}>ADD WIDGET</span>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        {/* Search */}
        <div style={styles.searchRow}>
          <span style={styles.searchIcon}>⌕</span>
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search widgets..."
            style={styles.searchInput}
          />
          {q && (
            <button style={styles.clearBtn} onClick={() => setQuery('')}>✕</button>
          )}
        </div>

        {/* Content */}
        <div style={styles.body}>
          {filtered ? (
            /* Search results */
            filtered.length === 0 ? (
              <div style={styles.empty}>
                <span style={styles.emptyIcon}>⌕</span>
                <p style={styles.emptyText}>No widgets match "{query}"</p>
              </div>
            ) : (
              <div>
                <p style={styles.resultsLabel}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>
                <div style={styles.grid}>
                  {filtered.map((def) => (
                    <WidgetCard key={def.type} def={def} onAdd={onAdd} />
                  ))}
                </div>
              </div>
            )
          ) : (
            /* Categorized list */
            CATEGORIES.map((cat) => {
              const widgets = cat.types
                .map((t) => widgetRegistry.find((w) => w.type === t))
                .filter((w): w is WidgetDefinition => !!w);
              if (widgets.length === 0) return null;
              return (
                <div key={cat.label} style={styles.category}>
                  <p style={styles.categoryLabel}>{cat.label.toUpperCase()}</p>
                  <div style={styles.grid}>
                    {widgets.map((def) => (
                      <WidgetCard key={def.type} def={def} onAdd={onAdd} />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function WidgetCard({
  def,
  onAdd,
}: {
  def: WidgetDefinition;
  onAdd: (type: string, config: Record<string, unknown>) => void;
}) {
  return (
    <button
      style={styles.card}
      onClick={() => onAdd(def.type, def.defaultConfig)}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLButtonElement;
        el.style.borderColor = 'var(--color-primary)';
        el.style.background = 'var(--color-surface-hover)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLButtonElement;
        el.style.borderColor = 'var(--color-border)';
        el.style.background = 'transparent';
      }}
    >
      {def.logoUrl ? (
        <img src={def.logoUrl} alt={def.name} style={styles.cardLogo} />
      ) : (
        <span style={styles.cardIcon}>{def.icon}</span>
      )}
      <div style={styles.cardText}>
        <span style={styles.cardName}>{def.name.toUpperCase()}</span>
        <span style={styles.cardDesc}>{def.description}</span>
      </div>
    </button>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem',
  },
  modal: {
    width: '100%',
    maxWidth: '640px',
    maxHeight: '85vh',
    background: 'var(--color-surface)',
    border: '2px solid var(--color-border)',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 1.25rem',
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
  searchRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.25rem',
    borderBottom: '2px solid var(--color-border)',
    flexShrink: 0,
  },
  searchIcon: {
    fontSize: '1.1rem',
    color: 'var(--color-text-muted)',
    flexShrink: 0,
    lineHeight: 1,
  },
  searchInput: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: 'var(--color-text)',
    fontSize: '0.85rem',
    letterSpacing: '0.03em',
  },
  clearBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--color-text-muted)',
    cursor: 'pointer',
    fontSize: '0.75rem',
    padding: '0.1rem 0.3rem',
    flexShrink: 0,
  },
  body: {
    flex: 1,
    overflowY: 'auto',
    padding: '1rem 1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  category: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  categoryLabel: {
    fontSize: '0.62rem',
    fontWeight: 800,
    color: 'var(--color-text-muted)',
    letterSpacing: '0.14em',
    borderBottom: '1px solid var(--color-border)',
    paddingBottom: '0.35rem',
  },
  resultsLabel: {
    fontSize: '0.65rem',
    color: 'var(--color-text-muted)',
    letterSpacing: '0.06em',
    marginBottom: '0.5rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '0.5rem',
  },
  card: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 0.85rem',
    background: 'transparent',
    border: '2px solid var(--color-border)',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'border-color 0.1s, background 0.1s',
  },
  cardIcon: {
    fontSize: '1.4rem',
    lineHeight: 1,
    flexShrink: 0,
    width: '28px',
    textAlign: 'center',
  },
  cardLogo: {
    width: '28px',
    height: '28px',
    objectFit: 'contain',
    flexShrink: 0,
  },
  cardText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
    minWidth: 0,
  },
  cardName: {
    fontSize: '0.68rem',
    fontWeight: 800,
    color: 'var(--color-text)',
    letterSpacing: '0.08em',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  cardDesc: {
    fontSize: '0.66rem',
    color: 'var(--color-text-muted)',
    lineHeight: 1.4,
    letterSpacing: '0.02em',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '3rem 1rem',
    color: 'var(--color-text-muted)',
  },
  emptyIcon: {
    fontSize: '2rem',
    lineHeight: 1,
  },
  emptyText: {
    fontSize: '0.8rem',
    letterSpacing: '0.04em',
  },
};
