import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AssistantMarkdownProps {
  content: string;
}

const markdownComponents: Components = {
  a: ({ children, href }) => (
    <a
      className="font-medium text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-3 border-primary/50 bg-primary/5 py-2 pr-3 pl-4 text-muted-foreground">
      {children}
    </blockquote>
  ),
  code: ({ children, className }) => (
    <code className={className || 'rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] font-medium text-foreground'}>
      {children}
    </code>
  ),
  h1: ({ children }) => <h1 className="mt-1 mb-3 text-lg font-bold text-foreground">{children}</h1>,
  h2: ({ children }) => (
    <h2 className="mt-5 mb-2 border-b pb-2 text-base font-semibold text-foreground first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => <h3 className="mt-4 mb-2 font-semibold text-foreground">{children}</h3>,
  hr: () => <hr className="my-4 border-border" />,
  li: ({ children }) => <li className="pl-1 leading-6 marker:font-semibold marker:text-primary">{children}</li>,
  ol: ({ children }) => <ol className="my-3 list-decimal space-y-2.5 pl-6">{children}</ol>,
  p: ({ children }) => <p className="my-2 leading-6 first:mt-0 last:mb-0">{children}</p>,
  pre: ({ children }) => (
    <pre className="my-3 overflow-x-auto rounded-lg bg-foreground p-3 font-mono text-xs leading-5 text-background">
      {children}
    </pre>
  ),
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded-lg border">
      <table className="w-full border-collapse text-left text-xs">{children}</table>
    </div>
  ),
  tbody: ({ children }) => <tbody className="divide-y divide-border">{children}</tbody>,
  td: ({ children }) => <td className="px-3 py-2 align-top leading-5">{children}</td>,
  th: ({ children }) => <th className="bg-muted px-3 py-2 font-semibold text-foreground">{children}</th>,
  ul: ({ children }) => <ul className="my-3 list-disc space-y-2 pl-6">{children}</ul>
};

export function AssistantMarkdown({ content }: AssistantMarkdownProps) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml components={markdownComponents}>
      {content}
    </ReactMarkdown>
  );
}
