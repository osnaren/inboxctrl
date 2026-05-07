import { headers } from 'next/headers';

import { Badge } from '@inboxctrl/ui/components/badge';
import { AlertCircle, ShieldCheck } from 'lucide-react';

import { getGoogleAccountStatus } from '@/lib/accounts';
import { getCurrentUser } from '@/lib/session-user';
import { cn } from '@/lib/utils';

export async function AccountStatusPill() {
  const requestHeaders = await headers();
  const user = await getCurrentUser(requestHeaders);
  if (!user) return null;

  const status = await getGoogleAccountStatus(user, requestHeaders);
  const Icon = status.syncReady ? ShieldCheck : AlertCircle;
  const label = status.account?.permission.currentPermissionModeLabel ?? 'Disconnected';

  return (
    <div
      className={cn(
        'hidden max-w-72 items-center gap-2 rounded-md border px-3 py-1.5 text-xs md:flex',
        status.syncReady
          ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
          : 'border-amber-200 bg-amber-50 text-amber-950'
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{status.connectedEmail ?? 'No Google account'}</span>
      <Badge variant="outline" className="bg-background/70 shrink-0 text-[10px]">
        {label}
      </Badge>
    </div>
  );
}
