import type { ReactNode } from 'react';

export function Steps({ children }: { children: ReactNode }) {
  return <div className="my-6 ml-4 border-l border-[var(--fd-border)] pl-6 [counter-reset:step]">{children}</div>;
}

export function Step({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <div className="relative pb-10 last:pb-2">
      {/* Node circle */}
      <div className="absolute top-1 -left-[35px] flex h-[18px] w-[18px] items-center justify-center rounded-full border border-[oklch(0.58_0.19_250/0.5)] bg-[var(--fd-background)] shadow-[0_0_12px_oklch(0.58_0.19_250/0.15)]">
        <div className="h-[6px] w-[6px] rounded-full bg-[var(--primary-light)]"></div>
      </div>

      {title && <h3 className="mt-0 mb-3 text-[18px] font-semibold text-[var(--prose-heading)]">{title}</h3>}
      <div className="text-[15px] text-[var(--prose-body)] [&>p:last-child]:mb-0 [&>pre]:mt-4">{children}</div>
    </div>
  );
}
