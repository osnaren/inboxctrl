import Link from 'next/link';

import { Inbox, FileText, Send, Star, Archive, Trash2, Tag, Plus, BrainCircuit, Activity, Filter } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

import type { InboxCtrlNavItem } from '@inboxctrl/plugin-sdk';

const automationIconMap = {
  activity: Activity,
  brain: BrainCircuit,
  filter: Filter,
  sparkles: BrainCircuit,
} as const;

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  automationItems: InboxCtrlNavItem[];
}

export function Sidebar({ automationItems, className }: SidebarProps) {
  return (
    <div className={cn('h-screen border-r pb-12', className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">Mail</h2>
          <div className="space-y-1">
            <Button variant="secondary" className="w-full justify-start">
              <Inbox className="mr-2 h-4 w-4" />
              Inbox
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <Star className="mr-2 h-4 w-4" />
              Starred
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <FileText className="mr-2 h-4 w-4" />
              Drafts
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <Send className="mr-2 h-4 w-4" />
              Sent
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <Archive className="mr-2 h-4 w-4" />
              Archive
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <Trash2 className="mr-2 h-4 w-4" />
              Trash
            </Button>
          </div>
        </div>
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">Automation</h2>
          <div className="space-y-1">
            {automationItems.map((item) => {
              const Icon = item.icon ? automationIconMap[item.icon] : Filter;

              return (
                <Button key={item.id} asChild variant="ghost" className="w-full justify-start">
                  <Link href={item.href}>
                    <Icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Link>
                </Button>
              );
            })}
          </div>
        </div>
        <div className="py-2">
          <h2 className="relative px-7 text-lg font-semibold tracking-tight">
            Labels
            <Button variant="ghost" size="icon" className="absolute -top-1 right-3 h-6 w-6">
              <Plus className="h-4 w-4" />
            </Button>
          </h2>
          <ScrollArea className="h-75 px-1">
            <div className="space-y-1 p-2">
              {['Work', 'Personal', 'Receipts', 'Newsletters'].map((label) => (
                <Button key={label} variant="ghost" className="w-full justify-start font-normal">
                  <Tag className="mr-2 h-4 w-4" />
                  {label}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
