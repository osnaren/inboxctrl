import Link from 'next/link';

import { Button } from '@inboxctrl/ui/components/button';
import { Input } from '@inboxctrl/ui/components/input';
import { GitBranch, Search, Settings, UserCircle } from 'lucide-react';

import { AccountStatusPill } from '@/components/account-status-pill';

export function Header() {
  return (
    <header className="bg-background sticky top-0 z-50 flex h-16 items-center gap-4 border-b px-6">
      <div className="flex flex-1 items-center gap-4">
        <div className="relative w-full max-w-2xl">
          <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
          <Input
            type="search"
            placeholder="Search mail, labels, filters..."
            className="bg-background w-full pl-8 md:w-2/3 lg:w-full"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <AccountStatusPill />
        <Button asChild variant="ghost" size="icon">
          <Link href="https://github.com/osnaren/inboxctrl" target="_blank" rel="noopener noreferrer">
            <GitBranch className="h-5 w-5" />
            <span className="sr-only">Source code</span>
          </Link>
        </Button>
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
          <span className="sr-only">Settings</span>
        </Button>
        <Button variant="ghost" size="icon">
          <UserCircle className="h-6 w-6" />
          <span className="sr-only">Account</span>
        </Button>
      </div>
    </header>
  );
}
