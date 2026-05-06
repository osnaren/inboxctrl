export default function DocsPage() {
  return (
    <>
      <h1>InboxCtrl Documentation</h1>
      <p className="lead">
        InboxCtrl is an open-source Gmail control plane for local label sync, cached mailbox metadata, safe manual
        actions, and AI-assisted filter drafts.
      </p>

      <h2>Local-first mailbox control</h2>
      <p>
        The app runs as a self-hosted Next.js project. You bring your own Google OAuth credentials, choose where the
        database lives, and control any AI provider keys you configure.
      </p>

      <h3>Key Features</h3>
      <ul>
        <li>
          <strong>Local metadata cache</strong>: InboxCtrl stores Gmail metadata and snippets locally so mailbox views
          can be served without calling Gmail for every screen.
        </li>
        <li>
          <strong>Label and action workflows</strong>: Sync labels, create labels, and run supported manual actions with
          activity logging.
        </li>
        <li>
          <strong>Natural-language filters</strong>: Draft Gmail filters from plain English and run them against the
          local cache before creating the rule.
        </li>
      </ul>

      <p>Start with the repository README for local setup, OAuth configuration, and validation commands.</p>
    </>
  );
}
