import { NextRequest } from 'next/server'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY ?? ''
const OLLAMA_BASE_URL    = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { provider, model, messages, stream = true } = await req.json()

  if (provider === 'openrouter') {
    if (!OPENROUTER_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'OPENROUTER_API_KEY no configurado. Agrega el secret en Fly.io:\n  fly secrets set OPENROUTER_API_KEY=sk-or-xxx' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type':  'application/json',
        'HTTP-Referer':  'https://247-claude-code-remote.fly.dev',
        'X-Title':       '247 Code Remote',
      },
      body: JSON.stringify({ model, messages, stream }),
    })

    if (!upstream.ok) {
      const err = await upstream.text()
      return new Response(JSON.stringify({ error: err }), {
        status: upstream.status,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(upstream.body, {
      headers: {
        'Content-Type':  'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection':    'keep-alive',
      },
    })
  }

  if (provider === 'ollama') {
    if (!OLLAMA_BASE_URL) {
      return new Response(
        JSON.stringify({ error: 'OLLAMA_BASE_URL no configurado. Agrega el secret en Fly.io:\n  fly secrets set OLLAMA_BASE_URL=http://mi-servidor:11434' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Ollama usa formato /api/chat con messages igual a OpenAI
    const upstream = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
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
      return new Response(JSON.stringify({ error: `Ollama error: ${err}` }), {
        status: upstream.status,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Convierte el stream NDJSON de Ollama a SSE compatible con el cliente
    const encoder = new TextEncoder()
    const { readable, writable } = new TransformStream()
    const writer = writable.getWriter()

    ;(async () => {
      const reader = upstream.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.trim()) continue
            try {
              const parsed = JSON.parse(line)
              if (parsed.message?.content) {
                const chunk = {
                  choices: [{ delta: { content: parsed.message.content }, finish_reason: parsed.done ? 'stop' : null }]
                }
                await writer.write(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`))
              }
              if (parsed.done) {
                await writer.write(encoder.encode('data: [DONE]\n\n'))
              }
            } catch {
              // line no es JSON válido, ignorar
            }
          }
        }
      } finally {
        await writer.close()
      }
    })()

    return new Response(readable, {
      headers: {
        'Content-Type':  'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection':    'keep-alive',
      },
    })
  }

  return new Response(JSON.stringify({ error: `Provider desconocido: ${provider}. Usa 'openrouter' o 'ollama'` }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  })
}
