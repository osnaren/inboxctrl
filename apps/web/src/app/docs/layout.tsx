import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-16 items-center justify-between border-b px-6">
        <Link href="/" className="text-xl font-bold tracking-tight">
          InboxCtrl Docs
        </Link>
        <Button asChild variant="outline" size="sm">
          <Link href="/">Back to Home</Link>
        </Button>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="bg-muted/20 w-64 border-r">
          <ScrollArea className="h-full px-4 py-6">
            <div className="space-y-4">
              <div>
                <h4 className="mb-2 font-semibold">Getting Started</h4>
                <div className="flex flex-col space-y-1 text-sm">
                  <Link href="/docs" className="text-muted-foreground hover:text-foreground">
                    Introduction
                  </Link>
                  <Link href="/docs/installation" className="text-muted-foreground hover:text-foreground">
                    Installation
                  </Link>
                  <Link href="/docs/env-vars" className="text-muted-foreground hover:text-foreground">
                    Environment Variables
                  </Link>
                </div>
              </div>
              <div>
                <h4 className="mb-2 font-semibold">Features</h4>
                <div className="flex flex-col space-y-1 text-sm">
                  <Link href="/docs/ai-triage" className="text-muted-foreground hover:text-foreground">
                    AI Triage
                  </Link>
                  <Link href="/docs/filters" className="text-muted-foreground hover:text-foreground">
                    Smart Filters
                  </Link>
                </div>
              </div>
            </div>
          </ScrollArea>
        </aside>
        <main className="flex-1 overflow-auto p-8">
          <div className="prose dark:prose-invert mx-auto max-w-3xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
