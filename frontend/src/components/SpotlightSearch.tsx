import React, { useState, useRef, useEffect } from 'react';
import { ENGINES } from '../widgets/SearchWidget';

interface SpotlightSearchProps {
  onClose: () => void;
}

const ENGINE_KEYS = Object.keys(ENGINES);

export default function SpotlightSearch({ onClose }: SpotlightSearchProps) {
  const [query, setQuery] = useState('');
  const [engineIndex, setEngineIndex] = useState(() => {
    const saved = localStorage.getItem('orbix_spotlight_engine');
    const idx = ENGINE_KEYS.indexOf(saved ?? '');
    return idx >= 0 ? idx : 0;
  });
  const inputRef = useRef<HTMLInputElement>(null);

  const engineKey = ENGINE_KEYS[engineIndex];
  const engine = ENGINES[engineKey];

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    window.open(`${engine.url}${encodeURIComponent(query.trim())}`, '_blank');
    onClose();
  }

  function setEngine(idx: number) {
    setEngineIndex(idx);
    localStorage.setItem('orbix_spotlight_engine', ENGINE_KEYS[idx]);
  }

  function cycleEngine(dir: 1 | -1) {
    setEngine((engineIndex + dir + ENGINE_KEYS.length) % ENGINE_KEYS.length);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Tab') {
      e.preventDefault();
      cycleEngine(e.shiftKey ? -1 : 1);
    }
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.box} onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSearch}>
          <div style={styles.inputRow}>
            <span style={styles.engineBadge} title={`Engine: ${engine.label} (Tab to cycle)`}>
              {engine.icon}
            </span>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Search with ${engine.label}...`}
              style={styles.input}
              autoComplete="off"
            />
            <button type="submit" style={styles.goBtn}>→</button>
          </div>
        </form>

        <div style={styles.footer}>
          <div style={styles.engines}>
            {ENGINE_KEYS.map((key, i) => (
              <button
                key={key}
                style={{
                  ...styles.enginePill,
                  background: i === engineIndex ? 'var(--color-primary)' : 'transparent',
                  color: i === engineIndex ? '#000' : 'var(--color-text-muted)',
                  border: i === engineIndex
                    ? '2px solid var(--color-primary)'
                    : '2px solid var(--color-border)',
                }}
                onClick={() => { setEngine(i); inputRef.current?.focus(); }}
                type="button"
              >
                {ENGINES[key].label}
              </button>
            ))}
          </div>
          <span style={styles.hint}>TAB to cycle · ESC to close</span>
        </div>
      </div>
    </div>
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
    zIndex: 2000,
    padding: '1rem',
  },
  box: {
    width: '100%',
    maxWidth: '580px',
    background: 'var(--color-surface)',
    border: '2px solid var(--color-border)',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  inputRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
  },
  engineBadge: {
    fontSize: '1.1rem',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--color-surface-hover)',
    border: '2px solid var(--color-border)',
    flexShrink: 0,
    userSelect: 'none',
    cursor: 'default',
  },
  input: {
    flex: 1,
    padding: '0.6rem 0.85rem',
    background: 'var(--color-background)',
    border: '2px solid var(--color-border)',
    color: 'var(--color-text)',
    fontSize: '1rem',
    outline: 'none',
  },
  goBtn: {
    padding: '0.6rem 1rem',
    background: 'var(--color-primary)',
    color: '#000',
    border: '2px solid var(--color-primary)',
    fontSize: '1.1rem',
    fontWeight: 900,
    cursor: 'pointer',
    flexShrink: 0,
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  engines: {
    display: 'flex',
    gap: '0.35rem',
    flexWrap: 'wrap',
  },
  enginePill: {
    padding: '0.2rem 0.6rem',
    fontSize: '0.65rem',
    fontWeight: 700,
    letterSpacing: '0.06em',
    cursor: 'pointer',
    textTransform: 'uppercase',
  },
  hint: {
    fontSize: '0.62rem',
    color: 'var(--color-text-muted)',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  },
};
