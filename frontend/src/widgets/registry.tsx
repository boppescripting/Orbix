import type { WidgetDefinition } from '../types';
import ClockWidget, { ClockConfig } from './ClockWidget';
import NotesWidget, { NotesConfig } from './NotesWidget';
import BookmarksWidget from './BookmarksWidget';
import SearchWidget, { SearchConfig } from './SearchWidget';
import IframeWidget, { IframeConfig } from './IframeWidget';
import AdGuardWidget, { AdGuardConfig } from './AdGuardWidget';
import JellyfinWidget, { JellyfinConfig } from './JellyfinWidget';
import JellyseerrWidget, { JellyseerrConfig } from './JellyseerrWidget';
import GluetunWidget, { GluetunConfig } from './GluetunWidget';
import WeatherWidget, { WeatherConfig } from './WeatherWidget';
import CloudflareTunnelsWidget, { CloudflareTunnelsConfig } from './CloudflareTunnelsWidget';
import QbittorrentWidget, { QbittorrentConfig } from './QbittorrentWidget';
import WhatsUpDockerWidget, { WhatsUpDockerConfig } from './WhatsUpDockerWidget';

export const widgetRegistry: WidgetDefinition[] = [
  {
    type: 'clock',
    name: 'Clock',
    description: 'Display current time and date',
    icon: '🕐',
    defaultSize: { w: 3, h: 2, minW: 2, minH: 2 },
    defaultConfig: { timezone: 'local', format: '24h', showDate: true, showTimezone: true },
    component: ClockWidget,
    configComponent: ClockConfig,
  },
  {
    type: 'notes',
    name: 'Notes',
    description: 'Quick sticky notes',
    icon: '📝',
    defaultSize: { w: 3, h: 4, minW: 2, minH: 3 },
    defaultConfig: { content: '', title: 'Notes', fontSize: '14px' },
    component: NotesWidget,
    configComponent: NotesConfig,
  },
  {
    type: 'bookmarks',
    name: 'Bookmarks',
    description: 'Quick access links',
    icon: '🔖',
    defaultSize: { w: 3, h: 4, minW: 2, minH: 2 },
    defaultConfig: { title: 'Bookmarks', links: [] },
    component: BookmarksWidget,
  },
  {
    type: 'search',
    name: 'Search',
    description: 'Web search bar',
    icon: '🔍',
    defaultSize: { w: 6, h: 2, minW: 3, minH: 2 },
    defaultConfig: { engine: 'google', placeholder: 'Search the web...' },
    component: SearchWidget,
    configComponent: SearchConfig,
  },
  {
    type: 'iframe',
    name: 'Web Embed',
    description: 'Embed any webpage',
    icon: '🌐',
    defaultSize: { w: 6, h: 6, minW: 3, minH: 4 },
    defaultConfig: { url: 'https://example.com', title: 'Web Embed' },
    component: IframeWidget,
    configComponent: IframeConfig,
  },
  {
    type: 'gluetun',
    name: 'Gluetun',
    description: 'VPN status and public IP info',
    icon: '🔒',
    logoUrl: 'https://cdn.simpleicons.org/openvpn/ffffff',
    defaultSize: { w: 3, h: 4, minW: 2, minH: 3 },
    defaultConfig: { url: '', refreshInterval: '30' },
    component: GluetunWidget,
    configComponent: GluetunConfig,
  },
  {
    type: 'jellyseerr',
    name: 'Jellyseerr',
    description: 'Media request tracking',
    icon: '🎟️',
    defaultSize: { w: 4, h: 5, minW: 3, minH: 3 },
    defaultConfig: { url: '', apiKey: '', refreshInterval: '60' },
    component: JellyseerrWidget,
    configComponent: JellyseerrConfig,
  },
  {
    type: 'jellyfin',
    name: 'Jellyfin',
    description: 'Active streams and recently added media',
    icon: '🎬',
    logoUrl: 'https://cdn.simpleicons.org/jellyfin/ffffff',
    defaultSize: { w: 4, h: 5, minW: 3, minH: 3 },
    defaultConfig: { url: '', apiKey: '', refreshInterval: '30', showRecent: true, maxRecent: '5' },
    component: JellyfinWidget,
    configComponent: JellyfinConfig,
  },
  {
    type: 'whatsupdocker',
    name: "What's Up Docker",
    description: 'Monitor containers for image updates',
    icon: '🐳',
    logoUrl: 'https://cdn.simpleicons.org/docker/ffffff',
    defaultSize: { w: 3, h: 5, minW: 2, minH: 3 },
    defaultConfig: { url: '', username: '', password: '', refreshInterval: '300' },
    component: WhatsUpDockerWidget,
    configComponent: WhatsUpDockerConfig,
  },
  {
    type: 'qbittorrent',
    name: 'qBittorrent',
    description: 'Torrent download and seed status',
    icon: '🌊',
    logoUrl: 'https://cdn.simpleicons.org/qbittorrent/ffffff',
    defaultSize: { w: 3, h: 5, minW: 2, minH: 3 },
    defaultConfig: { url: '', username: '', password: '', refreshInterval: '10', showLeechList: true, showLeechSize: false },
    component: QbittorrentWidget,
    configComponent: QbittorrentConfig,
  },
  {
    type: 'cloudflaretunnels',
    name: 'Cloudflare Tunnels',
    description: 'Monitor Cloudflare tunnel health',
    icon: '🌐',
    logoUrl: 'https://cdn.simpleicons.org/cloudflare/ffffff',
    defaultSize: { w: 3, h: 4, minW: 2, minH: 3 },
    defaultConfig: { accountId: '', apiToken: '', refreshInterval: '60' },
    component: CloudflareTunnelsWidget,
    configComponent: CloudflareTunnelsConfig,
  },
  {
    type: 'weather',
    name: 'Weather',
    description: 'Current weather for any city',
    icon: '🌤️',
    defaultSize: { w: 3, h: 4, minW: 2, minH: 3 },
    defaultConfig: { city: '', unit: 'celsius', refreshInterval: '900' },
    component: WeatherWidget,
    configComponent: WeatherConfig,
  },
  {
    type: 'adguard',
    name: 'AdGuard Home',
    description: 'DNS stats from your AdGuard Home instance',
    icon: '🛡️',
    logoUrl: 'https://cdn.simpleicons.org/adguard/ffffff',
    defaultSize: { w: 4, h: 4, minW: 3, minH: 3 },
    defaultConfig: { url: '', username: '', password: '', refreshInterval: '30' },
    component: AdGuardWidget,
    configComponent: AdGuardConfig,
  },
];

export function getWidgetDef(type: string): WidgetDefinition | undefined {
  return widgetRegistry.find((w) => w.type === type);
}
