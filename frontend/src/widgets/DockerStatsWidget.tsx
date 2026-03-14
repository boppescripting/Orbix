import React, { useEffect, useState, useCallback, useMemo } from 'react';
import type { WidgetProps, WidgetConfigProps } from '../types';
import { SettingsField, SettingsInput, SettingsSelect, SettingsToggle } from './SettingsComponents';
import { authHeader, thresholdColor } from '../utils';

interface Container {
  id: string;
  shortId: string;
  name: string;
  image: string;
  state: string;
  status: string;
  cpuPercent: number;
  memUsage: number;
  memLimit: number;
  memPercent: number;
  memUsageFmt: string;
  memLimitFmt: string;
}

interface DockerData {
  total: number;
  running: number;
  containers: Container[];
}


function Statedot({ state }: { state: string }) {
  const color =
    state === 'running'
      ? 'var(--color-success)'
      : state === 'paused' || state === 'restarting'
      ? 'var(--color-primary)'
      : 'var(--color-danger)';
  return (
    <span
      style={{
        display: 'inline-block',
        width: '7px',
        height: '7px',
        background: color,
        flexShrink: 0,
        marginTop: '1px',
      }}
    />
  );
}

function Bar({ percent, color }: { percent: number; color: string }) {
  return (
    <div style={{ width: '60px', height: '4px', background: 'var(--color-border)', flexShrink: 0 }}>
      <div
        style={{
          width: `${Math.min(percent, 100)}%`,
          height: '100%',
          background: color,
          transition: 'width 0.3s',
        }}
      />
    </div>
  );
}

export default function DockerStatsWidget({ config }: WidgetProps) {
  const url = (config.url as string) ?? '';
  const refreshInterval = parseInt((config.refreshInterval as string) ?? '10', 10) * 1000;
  const showStopped = (config.showStopped as boolean) ?? true;

  const [data, setData] = useState<DockerData | null>(null);
  const [error, setError] = useState('');
  const [actionPending, setActionPending] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/integrations/dockerstats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: authHeader() },
        body: JSON.stringify({ url }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? 'Error'); return; }
      setError('');
      setData(json);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Fetch failed');
    }
  }, [url]);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, refreshInterval);
    return () => clearInterval(id);
  }, [fetchData, refreshInterval]);

  async function doAction(containerId: string, action: 'start' | 'stop' | 'restart') {
    setActionPending(`${containerId}-${action}`);
    try {
      await fetch('/api/integrations/dockerstats/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: authHeader() },
        body: JSON.stringify({ url, containerId, action }),
      });
      setTimeout(fetchData, 800);
    } finally {
      setActionPending(null);
    }
  }

  if (error) {
    return <div style={styles.error}>{error}</div>;
  }
  if (!data) {
    return <div style={styles.empty}>Loading...</div>;
  }

  const containers = useMemo(
    () => showStopped ? data.containers : data.containers.filter((c) => c.state === 'running'),
    [data.containers, showStopped]
  );

  return (
    <div style={styles.wrap}>
      {/* Status bar */}
      <div style={styles.statusBar}>
        <Statedot state="running" />
        <span style={styles.statusText}>
          {data.running}/{data.total} running
        </span>
      </div>

      {/* Container list */}
      <div style={styles.list}>
        {containers.length === 0 && (
          <div style={styles.empty}>No containers</div>
        )}
        {containers.map((c) => {
          const isRunning = c.state === 'running';
          const cpuColor = thresholdColor(c.cpuPercent);
          const memColor = thresholdColor(c.memPercent);

          return (
            <div key={c.id} style={styles.row}>
              {/* Name + state */}
              <div style={styles.nameCell}>
                <Statedot state={c.state} />
                <span style={styles.name} title={c.image}>{c.name}</span>
              </div>

              {/* Stats */}
              <div style={styles.statsCell}>
                {isRunning ? (
                  <>
                    <div style={styles.stat}>
                      <span style={styles.statLabel}>CPU</span>
                      <Bar percent={c.cpuPercent} color={cpuColor} />
                      <span style={styles.statVal}>{c.cpuPercent.toFixed(1)}%</span>
                    </div>
                    <div style={styles.stat}>
                      <span style={styles.statLabel}>MEM</span>
                      <Bar percent={c.memPercent} color={memColor} />
                      <span style={styles.statVal}>{c.memUsageFmt}</span>
                    </div>
                  </>
                ) : (
                  <span style={styles.stoppedLabel}>{c.status}</span>
                )}
              </div>

              {/* Actions */}
              <div style={styles.actions}>
                {!isRunning && (
                  <ActionBtn
                    label="▶"
                    title="Start"
                    pending={actionPending === `${c.id}-start`}
                    color="var(--color-success)"
                    onClick={() => doAction(c.id, 'start')}
                  />
                )}
                {isRunning && (
                  <ActionBtn
                    label="■"
                    title="Stop"
                    pending={actionPending === `${c.id}-stop`}
                    color="var(--color-danger)"
                    onClick={() => doAction(c.id, 'stop')}
                  />
                )}
                {isRunning && (
                  <ActionBtn
                    label="↺"
                    title="Restart"
                    pending={actionPending === `${c.id}-restart`}
                    color="var(--color-text-muted)"
                    onClick={() => doAction(c.id, 'restart')}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActionBtn({
  label,
  title,
  pending,
  color,
  onClick,
}: {
  label: string;
  title: string;
  pending: boolean;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={pending}
      title={title}
      style={{
        background: 'transparent',
        border: '1px solid var(--color-border)',
        color: pending ? 'var(--color-text-muted)' : color,
        cursor: pending ? 'default' : 'pointer',
        padding: '0.1rem 0.35rem',
        fontSize: '0.75rem',
        lineHeight: 1,
        opacity: pending ? 0.5 : 1,
      }}
    >
      {pending ? '…' : label}
    </button>
  );
}

export function DockerStatsConfig({ config, onChange }: WidgetConfigProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <SettingsField
        label="Docker API URL"
        hint="Leave empty to use the socket at /var/run/docker.sock (requires socket mount in compose). Or provide an HTTP URL for TCP access."
      >
        <SettingsInput
          value={(config.url as string) ?? ''}
          onChange={(v) => onChange({ ...config, url: v })}
          placeholder="Leave empty for socket, or http://host:2375"
        />
      </SettingsField>
      <SettingsField label="Refresh interval">
        <SettingsSelect
          value={(config.refreshInterval as string) ?? '10'}
          onChange={(v) => onChange({ ...config, refreshInterval: v })}
          options={[
            { label: '5 seconds', value: '5' },
            { label: '10 seconds', value: '10' },
            { label: '30 seconds', value: '30' },
            { label: '60 seconds', value: '60' },
          ]}
        />
      </SettingsField>
      <SettingsField label="Show stopped containers">
        <SettingsToggle
          value={(config.showStopped as boolean) ?? true}
          onChange={(v) => onChange({ ...config, showStopped: v })}
        />
      </SettingsField>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    gap: '0.5rem',
  },
  statusBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    paddingBottom: '0.5rem',
    borderBottom: '1px solid var(--color-border)',
    flexShrink: 0,
  },
  statusText: {
    fontSize: '0.72rem',
    color: 'var(--color-text-muted)',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    fontWeight: 700,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
    overflowY: 'auto',
    flex: 1,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.35rem 0.4rem',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    minWidth: 0,
  },
  nameCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    flex: '0 0 30%',
    minWidth: 0,
  },
  name: {
    fontSize: '0.72rem',
    fontWeight: 700,
    color: 'var(--color-text)',
    letterSpacing: '0.02em',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  statsCell: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    minWidth: 0,
  },
  stat: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
  },
  statLabel: {
    fontSize: '0.6rem',
    color: 'var(--color-text-muted)',
    letterSpacing: '0.08em',
    fontWeight: 800,
    width: '26px',
    flexShrink: 0,
  },
  statVal: {
    fontSize: '0.65rem',
    color: 'var(--color-text-muted)',
    fontWeight: 600,
    minWidth: '36px',
  },
  stoppedLabel: {
    fontSize: '0.65rem',
    color: 'var(--color-text-muted)',
    letterSpacing: '0.04em',
  },
  actions: {
    display: 'flex',
    gap: '0.25rem',
    flexShrink: 0,
  },
  empty: {
    color: 'var(--color-text-muted)',
    fontSize: '0.8rem',
    textAlign: 'center',
    padding: '1rem',
  },
  error: {
    color: 'var(--color-danger)',
    fontSize: '0.75rem',
    padding: '0.5rem',
    border: '1px solid var(--color-danger)',
    background: 'rgba(255,23,68,0.06)',
  },
};
