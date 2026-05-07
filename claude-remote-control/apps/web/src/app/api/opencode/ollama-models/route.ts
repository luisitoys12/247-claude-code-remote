import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/opencode/ollama-models
 * Proxies to Ollama's /api/tags to fetch locally installed models.
 * Query param: baseUrl (optional, default from OLLAMA_BASE_URL env)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const base =
    searchParams.get('baseUrl') ??
    process.env.OLLAMA_BASE_URL ??
    'http://localhost:11434'

  try {
    const res = await fetch(`${base}/api/tags`, {
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(4000),
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: `Ollama responded with ${res.status}`, models: [] },
        { status: res.status }
      )
    }

    const data = await res.json()
    const models = (data.models ?? []).map((m: { name: string }) => ({
      id: m.name,
      label: m.name,
    }))

    return NextResponse.json({ models })
  } catch (err) {
    return NextResponse.json(
      { error: 'Cannot reach Ollama — is it running?', models: [], details: String(err) },
      { status: 503 }
    )
  }
}
