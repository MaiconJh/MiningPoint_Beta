import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownBodyProps {
  content: string
  className?: string
  compact?: boolean
}

const PROSE_CLASSES = [
  'prose prose-sm max-w-none prose-invert',
  'prose-headings:text-[var(--text-primary)]',
  'prose-p:text-[var(--text-secondary)]',
  'prose-strong:text-[var(--text-primary)]',
  'prose-em:text-[var(--text-secondary)]',
  'prose-a:text-[var(--brand-primary)] hover:prose-a:text-[var(--brand-primary-hover)]',
  'prose-code:text-[var(--brand-primary)] prose-code:bg-[var(--bg-default)] prose-code:px-1 prose-code:rounded',
  'prose-pre:bg-[var(--bg-default)] prose-pre:border prose-pre:border-[var(--border-default)]',
  'prose-blockquote:border-l-[var(--brand-primary)] prose-blockquote:text-[var(--text-muted)]',
  'prose-hr:border-[var(--border-subtle)]',
  'prose-li:marker:text-[var(--brand-primary)]',
  'prose-ul:my-2 prose-ol:my-2',
].join(' ')

const COMPACT_CLASSES = [
  'max-w-none',
  '[&_p]:inline [&_p]:m-0',
  '[&_ul]:inline [&_ul]:m-0 [&_ul]:pl-0',
  '[&_ol]:inline [&_ol]:m-0 [&_ol]:pl-0',
  '[&_li]:inline [&_li]:m-0',
  '[&_strong]:font-bold',
  '[&_a]:[color:inherit] [&_a]:underline',
  '[&_code]:[color:inherit]',
].join(' ')

export const MarkdownBody: React.FC<MarkdownBodyProps> = ({
  content,
  className = '',
  compact = false,
}) => {
  const base = compact ? COMPACT_CLASSES : PROSE_CLASSES
  return (
    <div className={`${base} ${className}`.trim()}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ node: _node, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
