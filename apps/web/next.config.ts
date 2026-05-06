import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: [
    '@inboxctrl/ai',
    '@inboxctrl/config',
    '@inboxctrl/core',
    '@inboxctrl/db',
    '@inboxctrl/gmail',
    '@inboxctrl/licensing',
    '@inboxctrl/plugin-sdk',
    '@inboxctrl/rule-engine',
    '@inboxctrl/sync-engine',
    '@inboxctrl/ui',
  ],
};

export default nextConfig;
