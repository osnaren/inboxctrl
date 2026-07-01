import type { ReactNode, ElementType } from 'react';

import { Info, AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react';

type CalloutProps = {
  children: ReactNode;
  title?: string;
  type?: 'info' | 'warning' | 'error' | 'success';
};

const iconMap: Record<string, ElementType> = {
  info: Info,
  warning: AlertTriangle,
  warn: AlertTriangle,
  error: XCircle,
  success: CheckCircle2,
};

export function Callout({ children, title, type = 'info' }: CalloutProps) {
  const Icon = iconMap[type] || Info;

  // Base styles matching command center theme
  let borderClass = '';
  let bgClass = '';
  let iconColor = '';

  switch (type) {
    case 'info':
      borderClass = 'border-l-[oklch(0.58_0.19_250)]';
      bgClass = 'bg-[oklch(0.58_0.19_250/0.05)]';
      iconColor = 'text-[oklch(0.58_0.19_250)]';
      break;
    case 'warning':
      borderClass = 'border-l-[oklch(0.75_0.18_70)]';
      bgClass = 'bg-[oklch(0.75_0.18_70/0.05)]';
      iconColor = 'text-[oklch(0.75_0.18_70)]';
      break;
    case 'error':
      borderClass = 'border-l-[#e54d4d]';
      bgClass = 'bg-[#e54d4d0a]';
      iconColor = 'text-[#e54d4d]';
      break;
    case 'success':
      borderClass = 'border-l-[oklch(0.72_0.14_185)]';
      bgClass = 'bg-[oklch(0.72_0.14_185/0.05)]';
      iconColor = 'text-[oklch(0.72_0.14_185)]';
      break;
  }

  return (
    <div
      className={`my-6 flex gap-3 rounded-r-lg border-l-4 p-4 ${borderClass} ${bgClass} border-t border-r border-b border-t-[var(--fd-border)] border-r-[var(--fd-border)] border-b-[var(--fd-border)]`}
    >
      <Icon className={`mt-0.5 shrink-0 ${iconColor}`} size={18} />
      <div className="w-full">
        {title && <h5 className="mb-2 font-semibold text-[var(--prose-heading)]">{title}</h5>}
        <div className="text-[14.5px] leading-relaxed text-[var(--prose-body)] [&>p]:m-0 [&>p:not(:last-child)]:mb-3">
          {children}
        </div>
      </div>
    </div>
  );
}
