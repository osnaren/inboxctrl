import { NextRequest } from 'next/server';

import { runOptionalPluginEndpoint } from '@/lib/extension-feature';

export async function GET(request: NextRequest) {
  return runOptionalPluginEndpoint({
    request,
    featureId: 'extension.sender-intelligence',
    endpointId: 'mail.intel.GET',
  });
}
