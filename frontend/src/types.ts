import React from 'react';

export interface User {
  id: string;
  username: string;
  created_at: string;
}

export interface Widget {
  id: string;
  user_id: string;
  type: string;
  config: Record<string, unknown>;
  created_at: string;
}

export interface LayoutItem {
  i: string; // widget id
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

export interface Theme {
  background: string;
  surface: string;
  surfaceHover: string;
  primary: string;
  primaryHover: string;
  text: string;
  textMuted: string;
  border: string;
  success: string;
  danger: string;
  widgetBackground: string;
  widgetBorder: string;
  fontFamily: string;
  fontWeight: string;
}

export interface WidgetProps {
  config: Record<string, unknown>;
  onConfigChange: (config: Record<string, unknown>) => void;
  editMode: boolean;
}

export interface WidgetConfigProps {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

export type WidgetCategory = 'Utilities' | 'Media' | 'Network' | 'Downloads & Containers' | 'Information';

export interface WidgetDefinition {
  type: string;
  name: string;
  description: string;
  icon: string;
  logoUrl?: string;
  category: WidgetCategory;
  defaultSize: { w: number; h: number; minW?: number; minH?: number };
  defaultConfig: Record<string, unknown>;
  component: React.ComponentType<WidgetProps>;
  configComponent?: React.ComponentType<WidgetConfigProps>;
}
