'use client';

import { useState } from 'react';

import { AlertTriangle, Check, Info, Shield, ShieldCheck, ShieldQuestion, Loader2 } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type GmailPermissionModeId = 'read-only-audit' | 'organizer' | 'settings-filter';

interface PermissionModeInfo {
  id: GmailPermissionModeId;
  label: string;
  purpose: string;
  scopes: string[];
  workflows: string[];
}

const PERMISSION_MODES: PermissionModeInfo[] = [
  {
    id: 'read-only-audit',
    label: 'Read-only audit',
    purpose: 'Inspect mailbox structure and cached metadata without Gmail mutations.',
    scopes: ['gmail.metadata', 'gmail.labels'],
    workflows: ['Label sync', 'Mailbox metadata', 'AI label suggestions', 'Filter preview'],
  },
  {
    id: 'organizer',
    label: 'Organizer',
    purpose: 'Apply labels, archive, star, mark read/unread, and trash without settings access.',
    scopes: ['gmail.modify', 'gmail.labels'],
    workflows: [
      'All read-only features',
      'Label create/update/delete',
      'Archive and trash',
      'Mark read/unread',
      'Star/unstar',
    ],
  },
  {
    id: 'settings-filter',
    label: 'Settings and filters',
    purpose: 'Create and manage Gmail filters after review.',
    scopes: ['gmail.settings.basic', 'gmail.labels'],
    workflows: ['Label management', 'Create/delete filters'],
  },
];

interface GmailPermissionModeSelectProps {
  onModeSelect?: (mode: GmailPermissionModeId) => void;
  defaultMode?: GmailPermissionModeId;
  className?: string;
}

export function GmailPermissionModeSelect({
  onModeSelect,
  defaultMode = 'read-only-audit',
  className,
}: GmailPermissionModeSelectProps) {
  const [selectedMode, setSelectedMode] = useState<GmailPermissionModeId>(defaultMode);

  const handleModeChange = (mode: GmailPermissionModeId) => {
    setSelectedMode(mode);
    onModeSelect?.(mode);
  };

  const selected = PERMISSION_MODES.find((m) => m.id === selectedMode);

  return (
    <div className={cn('space-y-4', className)}>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Choose Gmail permission mode</h3>
        <p className="text-muted-foreground text-sm">
          Select the level of access InboxCtrl needs. You can upgrade later.
        </p>
      </div>

      <div className="space-y-3">
        {PERMISSION_MODES.map((mode) => (
          <button
            key={mode.id}
            type="button"
            onClick={() => handleModeChange(mode.id)}
            className={cn(
              'hover:bg-muted/50 relative flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors',
              selectedMode === mode.id ? 'border-primary bg-primary/5' : 'border-input'
            )}
          >
            <input
              type="radio"
              name="permission-mode"
              value={mode.id}
              checked={selectedMode === mode.id}
              onChange={() => handleModeChange(mode.id)}
              className="mt-0.5 shrink-0"
            />
            <div className="flex-1 space-y-2">
              <div className="font-medium">{mode.label}</div>
              <div className="text-muted-foreground text-sm">{mode.purpose}</div>
              {selectedMode === mode.id && (
                <div className="mt-2 space-y-1.5 text-xs">
                  <div className="text-muted-foreground flex items-center gap-1.5">
                    <Info className="h-3 w-3" />
                    <span className="font-medium">Scopes:</span>
                    <span>{mode.scopes.join(', ')}</span>
                  </div>
                  <div className="text-muted-foreground flex items-center gap-1.5">
                    <Shield className="h-3 w-3" />
                    <span className="font-medium">Enables:</span>
                    <span>{mode.workflows.join(', ')}</span>
                  </div>
                </div>
              )}
            </div>
            {selectedMode === mode.id && <Check className="text-primary mt-1 h-4 w-4 shrink-0" />}
          </button>
        ))}
      </div>

      {selected && (
        <Alert variant="default" className="bg-muted/50">
          <ShieldCheck className="h-4 w-4" />
          <AlertTitle className="text-sm">About {selected.label}</AlertTitle>
          <AlertDescription className="text-xs">
            Google classifies some of these scopes as restricted. You may see an unverified app warning during sign-in
            until the app completes Google verification. Settings and filter access lets InboxCtrl create Gmail filters,
            but it will always ask before making changes.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

interface PermissionUpgradePromptProps {
  requiredMode: GmailPermissionModeId;
  requiredModeLabel: string;
  currentMode: GmailPermissionModeId | null;
  currentModeLabel: string | null;
  missingScopes: string[];
  onUpgrade?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function PermissionUpgradePrompt({
  requiredMode,
  requiredModeLabel,
  currentModeLabel,
  missingScopes,
  onUpgrade,
  onDismiss,
  className,
}: PermissionUpgradePromptProps) {
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleUpgrade = async () => {
    if (onUpgrade) {
      onUpgrade();
      return;
    }

    setIsUpgrading(true);
    try {
      const res = await fetch('/api/accounts/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mode: requiredMode }),
      });

      const data = await res.json();
      if (data.upgradeUrl) {
        window.location.href = data.upgradeUrl;
      }
    } catch (e) {
      console.error('Failed to get upgrade URL', e);
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <Alert variant="warning" className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-start gap-3">
        <ShieldQuestion className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="flex-1 space-y-1">
          <AlertTitle>Permission upgrade required</AlertTitle>
          <AlertDescription className="text-sm">
            The &quot;{requiredModeLabel}&quot; feature requires more access than your current &quot;
            {currentModeLabel || 'account'}&quot; mode provides.
          </AlertDescription>
        </div>
      </div>

      <div className="bg-background/50 rounded-md p-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-medium">Current:</span>
          <span>{currentModeLabel || 'Not connected'}</span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className="font-medium">Needed:</span>
          <span>{requiredModeLabel}</span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className="font-medium">Missing scopes:</span>
          <span className="font-mono">{missingScopes.join(', ')}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" onClick={handleUpgrade} disabled={isUpgrading}>
          {isUpgrading ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
          Upgrade access
        </Button>
        {onDismiss && (
          <Button size="sm" variant="ghost" onClick={onDismiss} disabled={isUpgrading}>
            Cancel
          </Button>
        )}
      </div>
    </Alert>
  );
}

interface PermissionModeBadgeProps {
  mode: GmailPermissionModeId | null;
  syncReady?: boolean;
  className?: string;
}

export function PermissionModeBadge({ mode, syncReady = false, className }: PermissionModeBadgeProps) {
  if (!mode) {
    return (
      <span
        className={cn(
          'border-destructive/20 bg-destructive/5 text-destructive inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs',
          className
        )}
      >
        <AlertTriangle className="h-3 w-3" />
        No access
      </span>
    );
  }

  const modeInfo = PERMISSION_MODES.find((m) => m.id === mode);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs',
        syncReady ? 'border-emerald-200 bg-emerald-50 text-emerald-950' : 'border-amber-200 bg-amber-50 text-amber-950',
        className
      )}
    >
      {syncReady ? <ShieldCheck className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
      {modeInfo?.label ?? mode}
    </span>
  );
}

export { PERMISSION_MODES };
