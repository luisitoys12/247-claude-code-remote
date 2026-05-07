import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ──────────────────────────────────────────────
// Supported models per provider
// ──────────────────────────────────────────────
export const OPENROUTER_MODELS = [
  { id: 'qwen/qwen3-235b-a22b:free',            label: 'Qwen3 235B (free)' },
  { id: 'qwen/qwen3-30b-a3b:free',              label: 'Qwen3 30B (free)' },
  { id: 'qwen/qwen-2.5-coder-32b-instruct',     label: 'Qwen2.5 Coder 32B' },
  { id: 'deepseek/deepseek-r1:free',            label: 'DeepSeek R1 (free)' },
  { id: 'deepseek/deepseek-chat-v3-0324:free',  label: 'DeepSeek V3 (free)' },
  { id: 'nvidia/llama-3.1-nemotron-70b-instruct:free', label: 'Nemotron 70B (free)' },
  { id: 'meta-llama/llama-4-scout:free',        label: 'Llama 4 Scout (free)' },
  { id: 'meta-llama/llama-4-maverick:free',     label: 'Llama 4 Maverick (free)' },
  { id: 'google/gemma-3-27b-it:free',           label: 'Gemma 3 27B (free)' },
  { id: 'mistralai/mistral-small-3.2-24b-instruct:free', label: 'Mistral Small 3.2 (free)' },
  { id: 'anthropic/claude-sonnet-4-5',          label: 'Claude Sonnet 4.5' },
]

export const OLLAMA_MODELS = [
  { id: 'qwen2.5-coder:7b',   label: 'Qwen2.5 Coder 7B' },
  { id: 'qwen2.5:14b',        label: 'Qwen2.5 14B' },
  { id: 'deepseek-r1:7b',     label: 'DeepSeek R1 7B' },
  { id: 'deepseek-r1:14b',    label: 'DeepSeek R1 14B' },
  { id: 'llama3.2:3b',        label: 'Llama 3.2 3B' },
  { id: 'llama3.1:8b',        label: 'Llama 3.1 8B' },
  { id: 'mistral:7b',         label: 'Mistral 7B' },
  { id: 'phi4:14b',           label: 'Phi-4 14B' },
  { id: 'gemma3:9b',          label: 'Gemma 3 9B' },
  { id: 'codellama:13b',      label: 'CodeLlama 13B' },
]

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ChatRequest {
  provider: 'openrouter' | 'ollama'
  model: string
  messages: ChatMessage[]
  ollamaBaseUrl?: string
  stream?: boolean
}

// ──────────────────────────────────────────────
// POST /api/opencode/chat
// ──────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json()
    const { provider, model, messages, ollamaBaseUrl, stream = true } = body

    if (!provider || !model || !messages?.length) {
      return NextResponse.json(
        { error: 'Missing required fields: provider, model, messages' },
        { status: 400 }
      )
    }

    // ── OpenRouter ──────────────────────────────
    if (provider === 'openrouter') {
      const apiKey = process.env.OPENROUTER_API_KEY
      if (!apiKey) {
        return NextResponse.json(
          { error: 'OPENROUTER_API_KEY not configured on server' },
          { status: 500 }
        )
      }

      const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
          'X-Title': '247-claude-code-remote',
        },
        body: JSON.stringify({ model, messages, stream }),
      })

      if (!upstream.ok) {
        const err = await upstream.text()
        return NextResponse.json({ error: err }, { status: upstream.status })
      }

      // Stream passthrough
      return new NextResponse(upstream.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      })
    }

    // ── Ollama ──────────────────────────────────
    if (provider === 'ollama') {
      const base =
        ollamaBaseUrl ??
        process.env.OLLAMA_BASE_URL ??
        'http://localhost:11434'

      const upstream = await fetch(`${base}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages,
          stream,
          options: { num_ctx: 8192 },
        }),
      })

      if (!upstream.ok) {
        const err = await upstream.text()
        return NextResponse.json({ error: err }, { status: upstream.status })
      }

      // Ollama streams NDJSON — convert to SSE for unified client handling
      const encoder = new TextEncoder()
      const readable = new ReadableStream({
        async start(controller) {
          const reader = upstream.body!.getReader()
          const decoder = new TextDecoder()
          let buffer = ''

          while (true) {
            const { done, value } = await reader.read()
            if (done) {
              controller.enqueue(encoder.encode('data: [DONE]\n\n'))
              controller.close()
              break
            }
            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() ?? ''

            for (const line of lines) {
              if (!line.trim()) continue
              try {
                const json = JSON.parse(line)
                // Convert Ollama format → OpenAI-compatible SSE chunk
                const chunk = {
                  choices: [
                    {
                      delta: { content: json.message?.content ?? '' },
                      finish_reason: json.done ? 'stop' : null,
                    },
                  ],
                }
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`)
                )
              } catch {
                // skip malformed line
              }
            }
          }
        },
      })

      return new NextResponse(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      })
    }

    return NextResponse.json({ error: 'Unknown provider' }, { status: 400 })
  } catch (err) {
    console.error('[opencode/chat]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/opencode/chat — return available models
export async function GET() {
  return NextResponse.json({
    openrouter: OPENROUTER_MODELS,
    ollama: OLLAMA_MODELS,
  })
}
