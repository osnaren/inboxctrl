import type { InboxCtrlEndpointHandler, InboxCtrlFeature, InboxCtrlNavItem, InboxCtrlPluginContext } from './types';

export class InboxCtrlPluginRegistry implements InboxCtrlPluginContext {
  private readonly features = new Map<string, InboxCtrlFeature>();
  private readonly navItems = new Map<string, InboxCtrlNavItem>();
  private readonly endpoints = new Map<string, InboxCtrlEndpointHandler>();

  registerFeature = (feature: InboxCtrlFeature): void => {
    this.features.set(feature.id, feature);
  };

  hasFeature = (featureId: string): boolean => this.features.has(featureId);

  getFeatures = (): InboxCtrlFeature[] => [...this.features.values()];

  registerNavItem = (item: InboxCtrlNavItem): void => {
    this.navItems.set(item.id, item);
  };

  getNavItems = (): InboxCtrlNavItem[] =>
    [...this.navItems.values()].sort((a, b) => (a.order ?? 100) - (b.order ?? 100));

  registerEndpoint = (endpointId: string, handler: InboxCtrlEndpointHandler): void => {
    this.endpoints.set(endpointId, handler);
  };

  getEndpoint = (endpointId: string): InboxCtrlEndpointHandler | undefined => this.endpoints.get(endpointId);
}

export const createInboxCtrlRegistry = (): InboxCtrlPluginRegistry => new InboxCtrlPluginRegistry();
