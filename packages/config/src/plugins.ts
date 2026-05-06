const PLUGIN_NAME_PATTERN = /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/i;

export const parsePluginNames = (rawValue?: string): string[] => {
  if (!rawValue) return [];

  return rawValue
    .split(',')
    .map((name) => name.trim())
    .filter((name) => name.length > 0)
    .filter((name, index, names) => names.indexOf(name) === index)
    .filter((name) => PLUGIN_NAME_PATTERN.test(name));
};

export const getConfiguredPluginNames = (env: Record<string, string | undefined>): string[] =>
  parsePluginNames(env.INBOXCTRL_PLUGINS);
