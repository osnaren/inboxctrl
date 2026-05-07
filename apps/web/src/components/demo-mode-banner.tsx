import { isDemoMode } from '@/lib/demo-mode';

export function DemoModeBanner() {
  if (!isDemoMode()) return null;

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-6 py-2 text-sm font-medium text-amber-950">
      Demo Mode - no real Gmail account connected.
    </div>
  );
}
