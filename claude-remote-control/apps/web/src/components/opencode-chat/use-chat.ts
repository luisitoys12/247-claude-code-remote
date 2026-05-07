'use client'

import { useState, useCallback, useRef } from 'react'
import type { ChatMessage, ChatSettings } from './types'

function generateId() {
  return Math.random().toString(36).slice(2, 10)
}

export function useOpenCodeChat(settings: ChatSettings) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(
    async (userText: string) => {
      if (!userText.trim() || isStreaming) return

      setError(null)

      const userMsg: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: userText.trim(),
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMsg])

      const assistantId = generateId()
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        provider: settings.provider,
        model: settings.model,
      }
      setMessages((prev) => [...prev, assistantMsg])

      setIsStreaming(true)
      abortRef.current = new AbortController()

      try {
        const history = [
          ...(settings.systemPrompt
            ? [{ role: 'system' as const, content: settings.systemPrompt }]
            : []),
          ...messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
          { role: 'user' as const, content: userText.trim() },
        ]

        const res = await fetch('/api/opencode/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: abortRef.current.signal,
          body: JSON.stringify({
            provider: settings.provider,
            model: settings.model,
            messages: history,
            ollamaBaseUrl: settings.ollamaBaseUrl,
            stream: true,
          }),
        })

        if (!res.ok) {
          const errData = await res.json().catch(() => ({ error: res.statusText }))
          throw new Error(errData.error ?? res.statusText)
        }

        const reader = res.body!.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const data = line.slice(6)
            if (data === '[DONE]') break
            try {
              const chunk = JSON.parse(data)
              const delta = chunk.choices?.[0]?.delta?.content ?? ''
              if (delta) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, content: m.content + delta } : m
                  )
                )
              }
            } catch {
              // skip bad chunk
            }
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return
        const msg = err instanceof Error ? err.message : 'Unknown error'
        setError(msg)
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: `❌ Error: ${msg}`, error: true }
              : m
          )
        )
      } finally {
        setIsStreaming(false)
        abortRef.current = null
      }
    },
    [messages, settings, isStreaming]
  )

  const stopStream = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const clearChat = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  return { messages, isStreaming, error, sendMessage, stopStream, clearChat }
}
