import { NextRequest } from 'next/server';

import { runOptionalPluginEndpoint } from '@/lib/extension-feature';

export async function GET(request: NextRequest) {
  return runOptionalPluginEndpoint({
    request,
    featureId: 'extension.automation-recipes',
    endpointId: 'mail.filters.recipes.GET',
  });
}
