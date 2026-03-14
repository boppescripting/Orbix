import { useState, useEffect, useCallback } from 'react';
import type { Widget, LayoutItem } from '../types';
import * as api from '../api';
import { getWidgetDef } from '../widgets/registry';
import Navbar from '../components/Navbar';
import WidgetGrid from '../components/WidgetGrid';
import AddWidgetModal from '../components/AddWidgetModal';
import ThemeEditor from '../components/ThemeEditor';
import SpotlightSearch from '../components/SpotlightSearch';

export default function DashboardPage() {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [layout, setLayout] = useState<LayoutItem[]>([]);
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [showThemeEditor, setShowThemeEditor] = useState(false);
  const [showSpotlight, setShowSpotlight] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);

  // Spacebar opens spotlight search (unless focus is in an input)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== ' ') return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return;
      e.preventDefault();
      setShowSpotlight(true);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Load widgets and layout on mount
  useEffect(() => {
    async function load() {
      try {
        const [ws, ly] = await Promise.all([api.getWidgets(), api.getLayout()]);
        setWidgets(ws);
        setLayout(ly);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleLayoutChange = useCallback((newLayout: LayoutItem[]) => {
    setLayout(newLayout);
    api.saveLayout(newLayout).catch(console.error);
  }, []);

  const handleAddWidget = useCallback(
    async (type: string, config: Record<string, unknown>) => {
      try {
        const widget = await api.createWidget(type, config);
        setWidgets((prev) => [...prev, widget]);

        const def = getWidgetDef(type);
        const newLayoutItem: LayoutItem = {
          i: widget.id,
          x: 0,
          y: Infinity, // puts it at the bottom
          w: def?.defaultSize.w ?? 4,
          h: def?.defaultSize.h ?? 4,
          minW: def?.defaultSize.minW,
          minH: def?.defaultSize.minH,
        };
        setLayout((prev) => {
          const next = [...prev, newLayoutItem];
          api.saveLayout(next).catch(console.error);
          return next;
        });
        setShowAddWidget(false);
      } catch (err) {
        console.error('Failed to add widget:', err);
      }
    },
    []
  );

  const handleRemoveWidget = useCallback(async (id: string) => {
    try {
      await api.deleteWidget(id);
      setWidgets((prev) => prev.filter((w) => w.id !== id));
      setLayout((prev) => {
        const next = prev.filter((l) => l.i !== id);
        api.saveLayout(next).catch(console.error);
        return next;
      });
    } catch (err) {
      console.error('Failed to remove widget:', err);
    }
  }, []);

  const handleUpdateWidget = useCallback(
    async (id: string, config: Record<string, unknown>) => {
      try {
        const updated = await api.updateWidget(id, config);
        setWidgets((prev) => prev.map((w) => (w.id === id ? updated : w)));
      } catch (err) {
        console.error('Failed to update widget:', err);
      }
    },
    []
  );

  if (loading) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-text-muted)',
          fontSize: '1.1rem',
        }}
      >
        Loading dashboard...
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: 'var(--color-background)',
      }}
    >
      <Navbar
        editMode={editMode}
        onToggleEditMode={() => setEditMode((e) => !e)}
        onAddWidget={() => setShowAddWidget(true)}
        onOpenTheme={() => setShowThemeEditor(true)}
      />

      <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
        {widgets.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '60vh',
              gap: '1rem',
              color: 'var(--color-text-muted)',
            }}
          >
            <span style={{ fontSize: '3rem' }}>🧩</span>
            <p style={{ fontSize: '1.1rem' }}>Your dashboard is empty.</p>
            {editMode ? (
              <button
                onClick={() => setShowAddWidget(true)}
                style={{
                  padding: '0.65rem 1.25rem',
                  background: 'var(--color-primary)',
                  color: '#000',
                  border: '2px solid var(--color-primary)',
                  borderRadius: 0,
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  cursor: 'pointer',
                }}
              >
                + ADD WIDGET
              </button>
            ) : (
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                Enable edit mode to add widgets.
              </p>
            )}
          </div>
        ) : (
          <WidgetGrid
            widgets={widgets}
            layout={layout}
            editMode={editMode}
            onLayoutChange={handleLayoutChange}
            onRemoveWidget={handleRemoveWidget}
            onUpdateWidget={handleUpdateWidget}
          />
        )}
      </div>

      {showAddWidget && (
        <AddWidgetModal onAdd={handleAddWidget} onClose={() => setShowAddWidget(false)} />
      )}

      {showThemeEditor && <ThemeEditor onClose={() => setShowThemeEditor(false)} />}
      {showSpotlight && <SpotlightSearch onClose={() => setShowSpotlight(false)} />}
    </div>
  );
}
