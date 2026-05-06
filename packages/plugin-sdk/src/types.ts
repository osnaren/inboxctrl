import type { InboxCtrlFeatureId } from '@inboxctrl/core';

export interface InboxCtrlFeature {
  id: InboxCtrlFeatureId;
  name: string;
  description?: string;
  source: 'oss' | 'plugin';
}

export interface InboxCtrlNavItem {
  id: string;
  label: string;
  href: string;
  icon?: 'activity' | 'brain' | 'filter' | 'sparkles';
  featureId?: InboxCtrlFeatureId;
  order?: number;
}

export interface InboxCtrlEndpointContext {
  params?: Record<string, string>;
}

export type InboxCtrlEndpointHandler = (
  request: Request,
  context: InboxCtrlEndpointContext
) => Response | Promise<Response>;

export interface InboxCtrlPluginContext {
  registerFeature(feature: InboxCtrlFeature): void;
  registerNavItem(item: InboxCtrlNavItem): void;
  registerEndpoint(endpointId: string, handler: InboxCtrlEndpointHandler): void;
}

export interface InboxCtrlPlugin {
  id: string;
  name: string;
  version?: string;
  register(ctx: InboxCtrlPluginContext): void | Promise<void>;
}
