'use client';

import { useState } from 'react';

import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';
import { GmailPermissionModeSelect, type GmailPermissionModeId } from '@/components/gmail-permission-mode-select';

export function SignInSection() {
  const [permissionMode, setPermissionMode] = useState<GmailPermissionModeId>('read-only-audit');

  return (
    <div className="bg-card mx-auto flex w-full max-w-md flex-col gap-6 rounded-xl border p-6 text-left shadow-sm">
      <GmailPermissionModeSelect defaultMode={permissionMode} onModeSelect={setPermissionMode} />
      <GoogleSignInButton permissionMode={permissionMode} className="w-full" />
    </div>
  );
}
