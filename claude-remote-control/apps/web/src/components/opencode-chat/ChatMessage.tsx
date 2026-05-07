'use client'

import { memo } from 'react'
import type { ChatMessage } from './types'

interface Props {
  message: ChatMessage
}

// Very lightweight Markdown → HTML renderer (no extra dep needed)
function renderMarkdown(text: string): string {
  return text
    // Code blocks
    .replace(
      /```([\w]*)\n([\s\S]*?)```/g,
      '<pre class="bg-zinc-900 text-zinc-100 rounded-lg p-3 my-2 overflow-x-auto text-sm"><code class="language-$1">$2</code></pre>'
    )
    // Inline code
    .replace(
      /`([^`]+)`/g,
      '<code class="bg-zinc-200 dark:bg-zinc-700 rounded px-1 text-sm font-mono">$1</code>'
    )
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="font-semibold mt-3 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="font-bold text-lg mt-4 mb-1">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="font-bold text-xl mt-4 mb-2">$1</h1>')
    // Bullet lists
    .replace(/^[-*] (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    // Line breaks
    .replace(/\n/g, '<br />')
}

export const ChatMessageItem = memo(function ChatMessageItem({ message }: Props) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-1">
          AI
        </div>
      )}

      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-sm'
            : message.error
            ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-bl-sm'
            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-bl-sm'
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div
            className="prose prose-sm dark:prose-invert max-w-none"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
          />
        )}

        {message.model && !isUser && (
          <p className="text-[10px] mt-1 opacity-50 font-mono">
            {message.provider} · {message.model.split('/').pop()}
          </p>
        )}
      </div>

      {isUser && (
        <div className="w-7 h-7 rounded-full bg-zinc-300 dark:bg-zinc-600 flex items-center justify-center text-zinc-700 dark:text-zinc-200 text-xs font-bold shrink-0 mt-1">
          U
        </div>
      )}
    </div>
  )
})
