import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await register(username, password);
    } catch (err: unknown) {
      const message =
        err &&
        typeof err === 'object' &&
        'response' in err &&
        err.response &&
        typeof err.response === 'object' &&
        'data' in err.response &&
        err.response.data &&
        typeof err.response.data === 'object' &&
        'error' in err.response.data
          ? String((err.response.data as { error: string }).error)
          : 'Registration failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoArea}>
          <h1 style={styles.logoText}>ORBIX</h1>
          <p style={styles.logoSub}>Create your account</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={styles.input}
              placeholder="3-30 chars, letters, numbers, _"
              autoFocus
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="At least 6 characters"
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Confirm Password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              style={styles.input}
              placeholder="Repeat your password"
              required
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'CREATING...' : 'CREATE ACCOUNT'}
          </button>
        </form>

        <p style={styles.switchText}>
          Already have an account?{' '}
          <Link to="/login" style={styles.link}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--color-background)',
    padding: '1rem',
  },
  card: {
    width: '100%',
    maxWidth: '380px',
    background: 'var(--color-surface)',
    border: '2px solid var(--color-border)',
    padding: '2.5rem',
  },
  logoArea: {
    textAlign: 'center',
    marginBottom: '2rem',
    borderBottom: '2px solid var(--color-border)',
    paddingBottom: '1.5rem',
  },
  logoText: {
    fontSize: '1.75rem',
    fontWeight: 900,
    color: 'var(--color-text)',
    letterSpacing: '0.2em',
  },
  logoSub: {
    color: 'var(--color-text-muted)',
    fontSize: '0.75rem',
    marginTop: '0.4rem',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  label: {
    fontSize: '0.68rem',
    fontWeight: 800,
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  input: {
    padding: '0.65rem 0.85rem',
    background: 'var(--color-background)',
    border: '2px solid var(--color-border)',
    color: 'var(--color-text)',
    fontSize: '0.9rem',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  error: {
    color: 'var(--color-danger)',
    fontSize: '0.8rem',
    padding: '0.5rem 0.75rem',
    background: 'rgba(255,23,68,0.08)',
    border: '2px solid rgba(255,23,68,0.3)',
    letterSpacing: '0.03em',
  },
  button: {
    padding: '0.75rem',
    background: 'var(--color-primary)',
    color: '#000',
    border: '2px solid var(--color-primary)',
    fontSize: '0.8rem',
    fontWeight: 900,
    letterSpacing: '0.12em',
    cursor: 'pointer',
    marginTop: '0.5rem',
    width: '100%',
  },
  switchText: {
    textAlign: 'center',
    marginTop: '1.5rem',
    color: 'var(--color-text-muted)',
    fontSize: '0.8rem',
    letterSpacing: '0.03em',
  },
  link: {
    color: 'var(--color-text)',
    fontWeight: 700,
    textDecoration: 'underline',
    textUnderlineOffset: '3px',
  },
};
