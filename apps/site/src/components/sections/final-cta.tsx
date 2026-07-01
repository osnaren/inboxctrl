import Link from 'next/link';

import { ArrowRight } from 'lucide-react';

import { GithubIcon } from '@/components/github-icon';
import { ScrollReveal } from '@/components/scroll-reveal';
import { siteConfig } from '@/config/site.config';

export function FinalCtaSection() {
  return (
    <section className="cta-section">
      <ScrollReveal className="cta-inner">
        <h2>Ready to regain control?</h2>
        <p>
          Deploy InboxCtrl on your own infrastructure today. It takes less than 5 minutes to set up the local engine and
          connect your Google account.
        </p>
        <div className="cta-actions">
          <Link href="/docs/getting-started" className="btn-glow">
            Start Self-Hosting <ArrowRight size={16} />
          </Link>
          <Link href={siteConfig.githubUrl} target="_blank" rel="noopener noreferrer" className="btn-outline">
            <GithubIcon size={16} /> Star on GitHub
          </Link>
        </div>
      </ScrollReveal>
    </section>
  );
}
