import { Hero } from '@/components/hero';
import { FinalCtaSection } from '@/components/sections/final-cta';
import { OssDevSection } from '@/components/sections/oss-dev';
import { PrivacySection } from '@/components/sections/privacy';
import { ProFutureSection } from '@/components/sections/pro-future';
import { WorkflowSection } from '@/components/sections/workflow';

export default function HomePage() {
  return (
    <main>
      <Hero />
      <WorkflowSection />
      <PrivacySection />
      <OssDevSection />
      <ProFutureSection />
      <FinalCtaSection />
    </main>
  );
}
