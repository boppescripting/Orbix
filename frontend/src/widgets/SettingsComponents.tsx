import React from 'react';

// Shared building blocks for widget settings panels

interface FieldProps {
  label: string;
  children: React.ReactNode;
  hint?: string;
}

export function SettingsField({ label, children, hint }: FieldProps) {
  return (
    <div style={fieldStyles.wrapper}>
      <label style={fieldStyles.label}>{label}</label>
      {children}
      {hint && <p style={fieldStyles.hint}>{hint}</p>}
    </div>
  );
}

interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
}

export function SettingsSelect({ value, onChange, options }: SelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={fieldStyles.select}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

interface InputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}

export function SettingsInput({ value, onChange, placeholder, type = 'text' }: InputProps) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={fieldStyles.input}
    />
  );
}

interface ToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
  label?: string;
}

export function SettingsToggle({ value, onChange, label }: ToggleProps) {
  return (
    <div style={fieldStyles.toggleRow}>
      <button
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        style={{
          ...fieldStyles.toggle,
          background: value ? 'var(--color-primary)' : 'transparent',
          borderColor: value ? 'var(--color-primary)' : 'var(--color-border)',
        }}
      >
        <span
          style={{
            ...fieldStyles.toggleThumb,
            background: value ? '#000' : 'var(--color-text-muted)',
            transform: value ? 'translateX(16px)' : 'translateX(2px)',
          }}
        />
      </button>
      {label && <span style={fieldStyles.toggleLabel}>{label}</span>}
    </div>
  );
}

const fieldStyles: Record<string, React.CSSProperties> = {
  wrapper: {
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
    fontFamily: "'Courier New', Courier, monospace",
  },
  hint: {
    margin: 0,
    fontSize: '0.68rem',
    color: 'var(--color-text-muted)',
    opacity: 0.6,
  },
  select: {
    padding: '0.45rem 0.65rem',
    background: 'var(--color-surface-hover)',
    border: '2px solid var(--color-border)',
    borderRadius: 0,
    color: 'var(--color-text)',
    fontSize: '0.85rem',
    outline: 'none',
    cursor: 'pointer',
    width: '100%',
  },
  input: {
    padding: '0.45rem 0.65rem',
    background: 'var(--color-surface-hover)',
    border: '2px solid var(--color-border)',
    borderRadius: 0,
    color: 'var(--color-text)',
    fontSize: '0.85rem',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
  },
  toggle: {
    position: 'relative',
    width: '36px',
    height: '20px',
    border: '2px solid var(--color-border)',
    borderRadius: 0,
    cursor: 'pointer',
    transition: 'background 0.15s, border-color 0.15s',
    flexShrink: 0,
    padding: 0,
  },
  toggleThumb: {
    position: 'absolute',
    top: '2px',
    width: '12px',
    height: '12px',
    background: 'var(--color-text)',
    borderRadius: 0,
    transition: 'transform 0.15s',
    display: 'block',
  },
  toggleLabel: {
    fontSize: '0.85rem',
    color: 'var(--color-text)',
  },
};
