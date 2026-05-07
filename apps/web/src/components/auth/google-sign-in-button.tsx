'use client';

import { useState } from 'react';

import Link from 'next/link';

import { getScopesWithSignInForPermissionMode } from '@inboxctrl/core';
import { Button } from '@inboxctrl/ui/components/button';
import { Loader2, Mail } from 'lucide-react';

import type { GmailPermissionModeId } from '@/components/gmail-permission-mode-select';
import { authClient } from '@/lib/auth-client';

interface GoogleSignInButtonProps {
  permissionMode?: GmailPermissionModeId;
  callbackURL?: string;
  className?: string;
}

export function GoogleSignInButton({ permissionMode, callbackURL = '/mail', className }: GoogleSignInButtonProps) {
  const { data: session, isPending } = authClient.useSession();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMessage(null);

    try {
      const scopes = permissionMode ? getScopesWithSignInForPermissionMode(permissionMode) : undefined;

      const { error } = await authClient.signIn.social({
        provider: 'google',
        callbackURL,
        ...(scopes && { scopes: scopes as string[] }),
        ...(permissionMode && { extraParams: { prompt: 'consent' } }),
      });

      if (error) {
        setErrorMessage(error.message ?? 'Google sign-in could not start.');
        setIsSigningIn(false);
      }
    } catch {
      setErrorMessage('Google sign-in could not start.');
      setIsSigningIn(false);
    }
  };

  if (!isPending && session) {
    return (
      <Button asChild size="lg" className={className}>
        <Link href="/mail">Open Inbox</Link>
      </Button>
    );
  }

  const isDisabled = isPending || isSigningIn;

  return (
    <div className="flex flex-col items-center gap-3">
      <Button size="lg" onClick={handleSignIn} disabled={isDisabled} className={className}>
        {isSigningIn ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
        {isSigningIn ? 'Connecting...' : 'Continue with Google'}
      </Button>
      {errorMessage ? <p className="text-destructive text-sm">{errorMessage}</p> : null}
    </div>
  );
}
