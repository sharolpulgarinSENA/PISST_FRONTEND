import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'

const components = {
  p: ({ children }) => <p style={{ margin: 0 }}>{children}</p>,
  ul: ({ children }) => <ul style={{ margin: '4px 0', paddingLeft: 20 }}>{children}</ul>,
  ol: ({ children }) => <ol style={{ margin: '4px 0', paddingLeft: 20 }}>{children}</ol>,
  li: ({ children }) => <li style={{ margin: '2px 0' }}>{children}</li>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: '#818CF8', textDecoration: 'underline' }}>
      {children}
    </a>
  ),
  code: ({ children }) => (
    <code style={{ background: 'rgba(99,102,241,0.12)', padding: '1px 5px', borderRadius: 4, fontSize: '0.9em' }}>
      {children}
    </code>
  ),
}

export default function MarkdownMessage({ text }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkBreaks]} components={components}>
      {text}
    </ReactMarkdown>
  )
}
