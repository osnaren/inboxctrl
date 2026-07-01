import { Download, Cpu, Play } from 'lucide-react';

import { ScrollReveal } from '@/components/scroll-reveal';

const steps = [
  {
    title: 'Sync metadata locally',
    desc: 'InboxCtrl pulls thread metadata via Gmail API. It never stores message bodies in the database.',
    icon: Download,
  },
  {
    title: 'Run rules & AI filters',
    desc: 'Matches rules against metadata. For AI, it securely passes snippets to your configured provider.',
    icon: Cpu,
  },
  {
    title: 'Stage actions for review',
    desc: 'All actions (archive, label, trash) are staged locally. Review and approve before modifying Gmail.',
    icon: Play,
  },
];

export function WorkflowSection() {
  return (
    <section className="section" id="workflow">
      <ScrollReveal className="section-inner">
        <div className="section-label">
          <Cpu /> How it works
        </div>
        <div className="section-heading">
          <h2>Local-first Gmail automation.</h2>
          <p>
            InboxCtrl acts as a safe middleware between you and Gmail. It evaluates rules locally and explicitly stages
            destructive actions.
          </p>
        </div>

        <ScrollReveal as="div" className="workflow-grid" stagger={0.15} staggerSelector=".workflow-step" delay={0.2}>
          {steps.map((step, i) => (
            <div key={i} className="workflow-step">
              <div className="workflow-step-number">{i + 1}</div>
              <div className="workflow-step-icon">
                <step.icon />
              </div>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </div>
          ))}
        </ScrollReveal>
      </ScrollReveal>
    </section>
  );
}
