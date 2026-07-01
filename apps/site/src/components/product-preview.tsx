import { Inbox, Tag, Filter, Sparkles, Zap } from 'lucide-react';

const sidebarItems = [
  { label: 'Inbox', icon: Inbox, active: true },
  { label: 'Labels', icon: Tag },
  { label: 'Filters', icon: Filter },
  { label: 'Rules', icon: Sparkles },
];

const emailRows = [
  { sender: 'Billing receipts', count: '184 matched', action: 'Dry-run ready', dotColor: 'blue' },
  { sender: 'GitHub notifications', count: '72 unread', action: 'Review labels', dotColor: 'cyan' },
  { sender: 'Travel updates', count: '16 upcoming', action: 'Archive later', dotColor: 'amber' },
  { sender: 'Newsletter digests', count: '48 weekly', action: 'Auto-label', dotColor: 'green' },
];

export function ProductPreview() {
  return (
    <div className="product-preview" aria-label="InboxCtrl dashboard preview">
      {/* Sidebar */}
      <div className="preview-sidebar">
        <div className="preview-sidebar-header">
          <span className="brand-dot" aria-hidden="true" />
          InboxCtrl
        </div>
        {sidebarItems.map((item, index) => (
          <div className={`preview-nav-item ${item.active ? 'active' : ''}`} key={index}>
            <item.icon size={14} />
            {item.label}
          </div>
        ))}
      </div>
      {/* Main Content */}
      <div className="preview-main">
        <div className="preview-toolbar">
          <span className="preview-toolbar-title">Local Gmail metadata</span>
          <span className="preview-toolbar-badge">
            <Zap size={12} /> Demo safe
          </span>
        </div>
        <div className="preview-stats">
          <div className="preview-stat">
            <span className="preview-stat-label">Reviewed</span>
            <span className="preview-stat-value">312</span>
          </div>
          <div className="preview-stat">
            <span className="preview-stat-label">Staged</span>
            <span className="preview-stat-value accent">48</span>
          </div>
          <div className="preview-stat">
            <span className="preview-stat-label">Real sends</span>
            <span className="preview-stat-value success">0</span>
          </div>
        </div>
        <div className="preview-table">
          {emailRows.map((row, index) => (
            <div className="preview-row" key={index}>
              <span className={`preview-row-dot ${row.dotColor}`} />
              <span className="preview-row-text">{row.sender}</span>
              <span className="preview-row-meta">{row.count}</span>
              <span className="preview-row-action">{row.action}</span>
            </div>
          ))}
        </div>
        <div className="preview-ai-panel">
          <div className="preview-ai-header">
            <Sparkles size={12} /> AI Suggestion
          </div>
          <p className="preview-ai-text">Apply &quot;billing&quot; label to 184 matching receipts from 12 senders.</p>
          <div className="preview-ai-actions">
            <button className="preview-ai-btn primary border-0">Preview matches</button>
            <button className="preview-ai-btn secondary cursor-pointer border-0 bg-transparent">Dismiss</button>
          </div>
        </div>
      </div>
    </div>
  );
}
