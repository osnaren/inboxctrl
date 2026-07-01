import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

export default function MarketingLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="site-shell">
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}
