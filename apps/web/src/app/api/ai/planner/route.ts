import { NextRequest } from 'next/server';

import { runOptionalPluginEndpoint } from '@/lib/extension-feature';

export async function POST(request: NextRequest) {
  return runOptionalPluginEndpoint({
    request,
    featureId: 'extension.advanced-label-planner',
    endpointId: 'ai.planner.POST',
  });
}
