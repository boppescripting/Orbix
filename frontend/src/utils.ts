/** Returns an Authorization header string (always present, even if token is empty). */
export function authHeader(): string {
  return `Bearer ${localStorage.getItem('orbix_token') ?? ''}`;
}

/** Returns an Authorization header object, omitted entirely when no token is stored. */
export function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('orbix_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Returns a CSS color variable based on a percent value against two thresholds. */
export function thresholdColor(percent: number, warn = 50, danger = 80): string {
  if (percent > danger) return 'var(--color-danger)';
  if (percent > warn) return 'var(--color-primary)';
  return 'var(--color-success)';
}
