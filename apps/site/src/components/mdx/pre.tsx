'use client';
import { useState, useCallback, isValidElement } from 'react';
import type { ReactNode, ComponentProps } from 'react';

import { Copy, Check } from 'lucide-react';

type PreProps = ComponentProps<'pre'> & {
  filename?: string;
};

// Extracts text content from React children (useful if the code is deeply nested in spans from syntax highlighting)
function extractText(node: ReactNode): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return node.toString();
  if (node instanceof Array) return node.map(extractText).join('');
  if (isValidElement(node)) {
    const element = node as React.ReactElement<{ children?: ReactNode }>;
    return extractText(element.props.children);
  }
  return '';
}

export function Pre({ children, className, filename, ...props }: PreProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      const text = extractText(children);
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  }, [children]);

  return (
    <div className="code-block my-6">
      <div className="code-block-header">
        <div className="code-block-dots">
          <span className="code-block-dot" />
          <span className="code-block-dot" />
          <span className="code-block-dot" />
        </div>
        {filename && <span className="code-block-lang">{filename}</span>}
      </div>

      <button
        className={`code-block-copy ${copied ? 'copied' : ''}`}
        onClick={handleCopy}
        aria-label={copied ? 'Copied' : 'Copy code'}
        title={copied ? 'Copied!' : 'Copy to clipboard'}
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>

      {/* 
        Fumadocs usually passes a <code> element as children. 
        We use our code-block-body class for styling the pre tag.
      */}
      <pre className={`code-block-body ${className || ''}`} {...props}>
        {children}
      </pre>
    </div>
  );
}
