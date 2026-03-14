import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface NavbarProps {
  editMode: boolean;
  onToggleEditMode: () => void;
  onAddWidget: () => void;
  onOpenTheme: () => void;
}

export default function Navbar({ editMode, onToggleEditMode, onAddWidget, onOpenTheme }: NavbarProps) {
  const { logout } = useAuth();

  return (
    <nav style={styles.nav}>
      <div style={styles.logo}>
        <span style={styles.logoText}>ORBIX</span>
      </div>

      <div style={styles.actions}>
        {editMode && (
          <>
            <button onClick={onAddWidget} style={styles.btnPrimary}>
              + ADD WIDGET
            </button>
            <button onClick={onOpenTheme} style={styles.btnSecondary} title="Customize theme">
              THEME
            </button>
          </>
        )}

        <button
          onClick={onToggleEditMode}
          style={editMode ? styles.btnEditActive : styles.btnEdit}
          title={editMode ? 'Exit edit mode' : 'Edit dashboard'}
        >
          {editMode ? 'DONE' : 'EDIT'}
        </button>

        <div style={styles.userArea}>
          <button onClick={logout} style={styles.btnLogout} title="Sign out">
            SIGN OUT
          </button>
        </div>
      </div>
    </nav>
  );
}

const styles: Record<string, React.CSSProperties> = {
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 1.25rem',
    height: '52px',
    background: 'var(--color-surface)',
    borderBottom: '2px solid var(--color-border)',
    flexShrink: 0,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  logoIcon: {
    fontSize: '1.2rem',
    color: 'var(--color-primary)',
  },
  logoText: {
    fontSize: '1rem',
    fontWeight: 900,
    color: 'var(--color-text)',
    letterSpacing: '0.18em',
    fontFamily: "'Courier New', Courier, monospace",
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  btnPrimary: {
    height: '32px',
    padding: '0 0.85rem',
    background: 'var(--color-primary)',
    color: '#000',
    border: '2px solid var(--color-primary)',
    borderRadius: 0,
    fontSize: '0.75rem',
    fontWeight: 800,
    letterSpacing: '0.08em',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  btnSecondary: {
    height: '32px',
    padding: '0 0.85rem',
    background: 'transparent',
    color: 'var(--color-text)',
    border: '2px solid var(--color-border)',
    borderRadius: 0,
    fontSize: '0.75rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    cursor: 'pointer',
  },
  btnEdit: {
    height: '32px',
    padding: '0 0.75rem',
    background: 'transparent',
    color: 'var(--color-text-muted)',
    border: '2px solid var(--color-border)',
    borderRadius: 0,
    fontSize: '0.75rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    cursor: 'pointer',
  },
  btnEditActive: {
    height: '32px',
    padding: '0 0.75rem',
    background: 'var(--color-primary)',
    color: '#000',
    border: '2px solid var(--color-primary)',
    borderRadius: 0,
    fontSize: '0.75rem',
    fontWeight: 900,
    letterSpacing: '0.08em',
    cursor: 'pointer',
  },
  userArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  username: {
    color: 'var(--color-text-muted)',
    fontSize: '0.75rem',
    letterSpacing: '0.05em',
    fontFamily: "'Courier New', Courier, monospace",
  },
  btnLogout: {
    height: '32px',
    padding: '0 0.75rem',
    background: 'transparent',
    color: 'var(--color-text-muted)',
    border: '2px solid var(--color-border)',
    borderRadius: 0,
    fontSize: '0.75rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    cursor: 'pointer',
  },
};
