import { useMemo } from 'react';
import GridLayout, { WidthProvider } from 'react-grid-layout';
import type { Layout } from 'react-grid-layout';
import type { Widget, LayoutItem } from '../types';
import { getWidgetDef } from '../widgets/registry';
import WidgetWrapper from './WidgetWrapper';

const ResponsiveGrid = WidthProvider(GridLayout);

interface WidgetGridProps {
  widgets: Widget[];
  layout: LayoutItem[];
  editMode: boolean;
  onLayoutChange: (layout: LayoutItem[]) => void;
  onRemoveWidget: (id: string) => void;
  onUpdateWidget: (id: string, config: Record<string, unknown>) => void;
}

export default function WidgetGrid({
  widgets,
  layout,
  editMode,
  onLayoutChange,
  onRemoveWidget,
  onUpdateWidget,
}: WidgetGridProps) {
  const widgetMap = useMemo(
    () => new Map(widgets.map((w) => [w.id, w])),
    [widgets]
  );

  function handleLayoutChange(newLayout: Layout[]) {
    const mapped: LayoutItem[] = newLayout.map((item) => ({
      i: item.i,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
      minW: item.minW,
      minH: item.minH,
    }));
    onLayoutChange(mapped);
  }

  const validLayout = layout.filter((l) => widgetMap.has(l.i));

  return (
    <ResponsiveGrid
      layout={validLayout}
      cols={12}
      rowHeight={60}
      onLayoutChange={handleLayoutChange}
      draggableHandle=".widget-drag-handle"
      isResizable={editMode}
      isDraggable={editMode}
      margin={[12, 12]}
      containerPadding={[0, 0]}
    >
      {validLayout.map((item) => {
        const widget = widgetMap.get(item.i)!;
        const def = getWidgetDef(widget.type);
        if (!def) return null;

        const WidgetComponent = def.component;

        return (
          <div key={item.i} style={{ width: '100%', height: '100%', position: 'relative' }}>
            <WidgetWrapper
              widgetId={item.i}
              widgetName={def.name}
              editMode={editMode}
              onRemove={() => onRemoveWidget(item.i)}
              configComponent={def.configComponent}
              config={widget.config}
              onConfigChange={(config) => onUpdateWidget(item.i, config)}
            >
              <WidgetComponent
                config={widget.config}
                editMode={editMode}
                onConfigChange={(config) => onUpdateWidget(item.i, config)}
              />
            </WidgetWrapper>
          </div>
        );
      })}
    </ResponsiveGrid>
  );
}
