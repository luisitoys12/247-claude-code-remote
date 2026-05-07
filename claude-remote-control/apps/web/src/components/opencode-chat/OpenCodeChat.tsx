'use client'

import { useState, useRef, useEffect } from 'react'
import { useOpenCodeChat } from './use-chat'
import { ModelSelector } from './ModelSelector'
import { ChatMessageItem } from './ChatMessage'
import { DEFAULT_SETTINGS } from './types'
import type { ChatSettings } from './types'

export function OpenCodeChat() {
  const [settings, setSettings] = useState<ChatSettings>(DEFAULT_SETTINGS)
  const [input, setInput] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const { messages, isStreaming, error, sendMessage, stopStream, clearChat } =
    useOpenCodeChat(settings)

  const patchSettings = (patch: Partial<ChatSettings>) =>
    setSettings((prev) => ({ ...prev, ...patch }))

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!input.trim() || isStreaming) return
    sendMessage(input)
    setInput('')
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">OC</span>
          </div>
          <span className="font-semibold text-sm text-zinc-800 dark:text-zinc-100">
            OpenCode Chat
          </span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
              settings.provider === 'openrouter'
                ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300'
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
            }`}
          >
            {settings.provider === 'openrouter' ? 'OpenRouter' : 'Ollama'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              title="Clear chat"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-xs"
            >
              🗑
            </button>
          )}
          <button
            onClick={() => setShowSettings((v) => !v)}
            title="Settings"
            className={`p-1.5 rounded-lg transition-colors text-xs ${
              showSettings
                ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300'
                : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            ⚙
          </button>
        </div>
      </div>

      {/* ── Model Selector (collapsible) ── */}
      {showSettings && (
        <ModelSelector settings={settings} onChange={patchSettings} />
      )}

      {/* ── System Prompt (only when settings open) ── */}
      {showSettings && (
        <div className="px-3 py-2 border-b border-zinc-200 dark:border-zinc-700">
          <label className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium block mb-1">
            System Prompt
          </label>
          <textarea
            rows={3}
            value={settings.systemPrompt}
            onChange={(e) => patchSettings({ systemPrompt: e.target.value })}
            className="w-full text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-violet-500 font-mono"
          />
        </div>
      )}

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-12">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
              <span className="text-white text-lg">💬</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                OpenCode Multi-Model Chat
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                Qwen · DeepSeek · Nemotron · Llama · Gemma · Mistral y más
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {[
                '¿Cómo optimizar este código?',
                'Explica este error',
                'Escribe tests para esta función',
                '¿Qué arquitectura usar?',
              ].map((s) => (
                <button
                  key={s}
                  onClick={() => { setInput(s); inputRef.current?.focus() }}
                  className="text-xs px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-violet-100 dark:hover:bg-violet-900/30 hover:text-violet-700 dark:hover:text-violet-300 transition-colors border border-zinc-200 dark:border-zinc-700"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <ChatMessageItem key={msg.id} message={msg} />
        ))}

        {/* Streaming indicator */}
        {isStreaming && (
          <div className="flex gap-2 items-center">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              AI
            </div>
            <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl rounded-bl-sm px-4 py-2.5">
              <div className="flex gap-1 items-center h-4">
                <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" />
              </div>
            </div>
          </div>
        )}

        {error && (
          <p className="text-xs text-red-500 text-center">{error}</p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div className="px-3 py-3 border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder={`Pregunta a ${settings.model.split('/').pop()?.replace(':free', '')}…`}
            disabled={isStreaming}
            className="flex-1 resize-none bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:focus:ring-violet-400 placeholder-zinc-400 disabled:opacity-50 max-h-32 overflow-y-auto"
            style={{ minHeight: '42px' }}
          />
          {isStreaming ? (
            <button
              onClick={stopStream}
              className="px-3 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-colors shrink-0"
            >
              ⏹ Stop
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="px-3 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors shrink-0"
            >
              ↑ Send
            </button>
          )}
        </div>
        <p className="text-[10px] text-zinc-400 mt-1.5 text-center">
          Enter para enviar · Shift+Enter para nueva línea
        </p>
      </div>
    </div>
  )
}
