import { NextResponse, type NextRequest } from 'next/server';

import { apiFailure } from '@/lib/api/contracts';
import { getPluginEndpoint, isFeatureEnabled } from '@/plugin-loader/registry';

import type { InboxCtrlFeatureId } from '@inboxctrl/core';

interface RunPluginEndpointOptions {
  request: NextRequest;
  featureId: InboxCtrlFeatureId;
  endpointId: string;
  params?: Record<string, string>;
}

export const extensionFeatureUnavailable = (featureId: InboxCtrlFeatureId, featureName: string) =>
  NextResponse.json(
    apiFailure('EXTENSION_FEATURE_UNAVAILABLE', 'Extension feature unavailable', {
      featureId,
      message: `${featureName} is implemented by an optional extension and is not included in the default OSS build.`,
    }),
    { status: 402 }
  );

export const runOptionalPluginEndpoint = async ({
  request,
  featureId,
  endpointId,
  params,
}: RunPluginEndpointOptions): Promise<Response> => {
  if (!(await isFeatureEnabled(featureId))) {
    return extensionFeatureUnavailable(featureId, endpointId);
  }

  const handler = await getPluginEndpoint(featureId, endpointId);
  if (!handler) {
    return NextResponse.json(
      apiFailure('PLUGIN_ENDPOINT_NOT_REGISTERED', 'Plugin endpoint not registered', {
        endpointId,
        message: 'A plugin enabled this feature but did not register the requested endpoint.',
      }),
      { status: 501 }
    );
  }

  return handler(request, { params });
};
