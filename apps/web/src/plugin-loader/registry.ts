import { getConfiguredPluginNames } from '@inboxctrl/config';
import { isOssFeatureId, type InboxCtrlFeatureId } from '@inboxctrl/core';
import {
  createInboxCtrlRegistry,
  type InboxCtrlEndpointHandler,
  type InboxCtrlNavItem,
  type InboxCtrlPlugin,
  type InboxCtrlPluginRegistry,
} from '@inboxctrl/plugin-sdk';

const registry = createInboxCtrlRegistry();
let loadPromise: Promise<InboxCtrlPluginRegistry> | null = null;

const importOptionalPlugin = async (pluginName: string): Promise<unknown> => {
  const dynamicImport = new Function('specifier', 'return import(specifier)') as (
    specifier: string
  ) => Promise<unknown>;

  return dynamicImport(pluginName);
};

const resolvePlugin = (pluginModule: unknown): InboxCtrlPlugin | null => {
  if (!pluginModule || typeof pluginModule !== 'object') return null;

  const candidate = 'default' in pluginModule ? pluginModule.default : pluginModule;
  if (!candidate || typeof candidate !== 'object') return null;

  if ('register' in candidate && typeof candidate.register === 'function') {
    return candidate as InboxCtrlPlugin;
  }

  return null;
};

export const getPluginRegistry = async (): Promise<InboxCtrlPluginRegistry> => {
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    for (const pluginName of getConfiguredPluginNames(process.env)) {
      try {
        const pluginModule = await importOptionalPlugin(pluginName);
        const plugin = resolvePlugin(pluginModule);
        if (!plugin) {
          console.warn(`InboxCtrl plugin "${pluginName}" did not export a valid plugin.`);
          continue;
        }

        await plugin.register(registry);
      } catch (error) {
        console.warn(`InboxCtrl plugin "${pluginName}" could not be loaded.`, error);
      }
    }

    return registry;
  })();

  return loadPromise;
};

export const isFeatureEnabled = async (featureId: InboxCtrlFeatureId): Promise<boolean> => {
  if (isOssFeatureId(featureId)) return true;

  const loadedRegistry = await getPluginRegistry();
  return loadedRegistry.hasFeature(featureId);
};

export const getPluginNavItems = async (): Promise<InboxCtrlNavItem[]> => {
  const loadedRegistry = await getPluginRegistry();
  const items = loadedRegistry.getNavItems();
  const visibleItems = await Promise.all(
    items.map(async (item) => ({
      item,
      visible: item.featureId ? await isFeatureEnabled(item.featureId) : true,
    }))
  );

  return visibleItems.filter(({ visible }) => visible).map(({ item }) => item);
};

export const getPluginEndpoint = async (
  featureId: InboxCtrlFeatureId,
  endpointId: string
): Promise<InboxCtrlEndpointHandler | null> => {
  if (!(await isFeatureEnabled(featureId))) return null;

  const loadedRegistry = await getPluginRegistry();
  return loadedRegistry.getEndpoint(endpointId) ?? null;
};
