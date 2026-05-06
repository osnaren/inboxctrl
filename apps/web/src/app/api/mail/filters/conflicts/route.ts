import { NextRequest } from 'next/server';

import { runOptionalPluginEndpoint } from '@/lib/extension-feature';

export async function POST(request: NextRequest) {
  return runOptionalPluginEndpoint({
    request,
    featureId: 'extension.advanced-rule-conflicts',
    endpointId: 'mail.filters.conflicts.POST',
  });
}
