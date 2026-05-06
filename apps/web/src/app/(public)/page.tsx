import Link from 'next/link';

import { SignInSection } from '@/components/auth/sign-in-section';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-16 items-center justify-between border-b px-6">
        <div className="text-xl font-bold tracking-tight">InboxCtrl</div>
        <nav className="flex items-center gap-4">
          <Link href="/docs" className="text-muted-foreground hover:text-foreground text-sm font-medium">
            Documentation
          </Link>
          <Button asChild variant="default">
            <Link href="/mail">Go to App</Link>
          </Button>
        </nav>
      </header>

      <main className="from-background to-muted/20 flex flex-1 flex-col items-center justify-center bg-linear-to-b p-6 text-center">
        <h1 className="mb-6 max-w-3xl text-5xl font-extrabold tracking-tight">Control your Gmail workflow locally</h1>
        <p className="text-muted-foreground mb-8 max-w-2xl text-xl">
          InboxCtrl is an open-source Gmail control plane for label sync, cached metadata, review-first actions, and
          AI-assisted filter drafts.
        </p>
        <div className="mb-8 w-full">
          <SignInSection />
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button asChild size="lg" variant="outline">
            <Link href="https://github.com/osnaren/inboxctrl" target="_blank" rel="noopener noreferrer">
              View on GitHub
            </Link>
          </Button>
        </div>
      </main>

      <footer className="text-muted-foreground flex h-16 items-center justify-center border-t text-sm">
        Open Source. Built with Next.js and Prisma.
      </footer>
    </div>
  );
}
