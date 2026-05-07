const mailboxRows = [
  ['Billing receipts', '184 matched', 'Dry-run ready'],
  ['GitHub notifications', '72 unread', 'Review labels'],
  ['Travel updates', '16 upcoming', 'Archive later'],
] as const;

export function ProductPreview() {
  return (
    <div className="product-preview" aria-label="InboxCtrl product preview">
      <div className="preview-sidebar">
        <div className="preview-control" />
        <div className="preview-control short" />
        <div className="preview-label active">Inbox</div>
        <div className="preview-label">Receipts</div>
        <div className="preview-label">Projects</div>
        <div className="preview-label">Travel</div>
      </div>
      <div className="preview-main">
        <div className="preview-toolbar">
          <span>Local Gmail metadata</span>
          <strong>Demo safe</strong>
        </div>
        <div className="preview-summary">
          <div>
            <span>Messages reviewed</span>
            <strong>312</strong>
          </div>
          <div>
            <span>Actions staged</span>
            <strong>48</strong>
          </div>
          <div>
            <span>Real sends</span>
            <strong>0</strong>
          </div>
        </div>
        <div className="preview-table">
          {mailboxRows.map(([name, count, action]) => (
            <div className="preview-row" key={name}>
              <span>{name}</span>
              <span>{count}</span>
              <strong>{action}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
