import { DetailGrid, PageIntro } from '@/components/content-blocks';

export const metadata = {
  title: 'Privacy',
};

const items = [
  {
    title: 'Metadata first',
    body: 'Mailbox lists are designed around cached metadata. Full message bodies are fetched on demand for workflows that explicitly need them.',
  },
  {
    title: 'Bring your own AI key',
    body: 'AI features are optional and should make provider/model selection and external processing implications visible to the user.',
  },
  {
    title: 'Self-host responsibility',
    body: 'Users control their deployment, secrets, database, backups, OAuth app, and network exposure when running InboxCtrl themselves.',
  },
];

export default function PrivacyPage() {
  return (
    <main className="page-content">
      <PageIntro
        title="Privacy"
        body="InboxCtrl is designed for local-first mailbox control, explicit Gmail permissions, and user-owned infrastructure."
      />
      <DetailGrid items={items} />
    </main>
  );
}
