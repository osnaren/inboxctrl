'use client';
import { useState, useCallback } from 'react';

import { Copy, Check } from 'lucide-react';

type CodeBlockProps = {
  code: string;
  language?: string;
  filename?: string;
};

export function CodeBlock({ code, language = 'bash', filename }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  }, [code]);

  // Simple syntax highlighting for bash
  const highlightedLines = code.split('\n').map((line, i) => {
    if (line.trim().startsWith('#')) {
      return (
        <span key={i} className="code-comment">
          {line}
          {'\n'}
        </span>
      );
    }
    // Highlight commands (first word) and flags
    const parts = line.split(' ');
    return (
      <span key={i}>
        {parts.map((part, j) => {
          if (j === 0 && /^[a-z]/.test(part)) {
            return (
              <span key={j} className="code-command">
                {part}
              </span>
            );
          }
          if (part.startsWith('--') || part.startsWith('-')) {
            return (
              <span key={j}>
                {' '}
                <span className="code-flag">{part}</span>
              </span>
            );
          }
          if (part.startsWith('http') || part.startsWith('github') || part.startsWith("'") || part.startsWith('"')) {
            return (
              <span key={j}>
                {' '}
                <span className="code-string">{part}</span>
              </span>
            );
          }
          return (
            <span key={j}>
              {j > 0 ? ' ' : ''}
              {part}
            </span>
          );
        })}
        {'\n'}
      </span>
    );
  });

  return (
    <div className="code-block">
      <div className="code-block-header">
        <div className="code-block-dots">
          <span className="code-block-dot" />
          <span className="code-block-dot" />
          <span className="code-block-dot" />
        </div>
        <span className="code-block-lang">{filename || language}</span>
      </div>
      <button
        className={`code-block-copy ${copied ? 'copied' : ''}`}
        onClick={handleCopy}
        aria-label={copied ? 'Copied' : 'Copy code'}
        title={copied ? 'Copied!' : 'Copy to clipboard'}
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
      <pre className="code-block-body">
        <code>{highlightedLines}</code>
      </pre>
    </div>
  );
}
