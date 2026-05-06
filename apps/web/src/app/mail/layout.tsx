import { Header } from '@/components/header';
import { Sidebar } from '@/components/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { getMailAutomationNavItems } from '@/plugin-loader/navigation';

export default async function MailLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const automationItems = await getMailAutomationNavItems();

  return (
    <TooltipProvider>
      <div className="bg-background flex min-h-screen">
        <Sidebar automationItems={automationItems} className="hidden w-64 shrink-0 md:block" />
        <div className="flex w-full flex-col">
          <Header />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}
