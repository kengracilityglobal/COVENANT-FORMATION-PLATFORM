// lib/ai/claude.ts
//
// The single, shared Claude API client for EIKON.
//
// Why this exists: every AI feature (assessment scoring, report portraits,
// journal companion, journal analyser, guide briefings) previously called
// api.anthropic.com directly WITHOUT the `x-api-key` and `anthropic-version`
// headers. The API rejects such requests with 401, and each call site swallowed
// the error, so the features silently degraded to fallbacks. All AI traffic now
// goes through here so authentication, timeouts, retries and JSON parsing are
// implemented (and tested) exactly once.
//
// Server-side only. Never import this into a client component.

export type ClaudeTier = 'primary' | 'light'

export interface ClaudeRequest {
  system: string
  user: string
  maxTokens: number
  /** 'primary' = highest-quality model (scoring, portraits). 'light' = cheaper, fast model (companion, analyser). */
  tier?: ClaudeTier
  /** Abort the request after this many ms (default 45 000). */
  timeoutMs?: number
  /** Extra attempts after the first for 429 / 5xx / network errors (default 1). */
  retries?: number
  temperature?: number
}

export class ClaudeError extends Error {
  status?: number
  retryable: boolean
  constructor(message: string, opts: { status?: number; retryable?: boolean } = {}) {
    super(message)
    this.name = 'ClaudeError'
    this.status = opts.status
    this.retryable = opts.retryable ?? false
  }
}

const API_URL = 'https://api.anthropic.com/v1/messages'
const API_VERSION = '2023-06-01'

// Model IDs are overridable so a model retirement never requires a code change.
// Set ANTHROPIC_MODEL / ANTHROPIC_MODEL_LIGHT in the environment to override.
const DEFAULT_PRIMARY_MODEL = 'claude-sonnet-5'
const DEFAULT_LIGHT_MODEL = 'claude-haiku-4-5-20251001'

export function getModel(tier: ClaudeTier = 'primary'): string {
  if (tier === 'light') return process.env.ANTHROPIC_MODEL_LIGHT || DEFAULT_LIGHT_MODEL
  return process.env.ANTHROPIC_MODEL || DEFAULT_PRIMARY_MODEL
}

export function isClaudeConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.trim())
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

/** Perform one request. Returns the concatenated text of the response. Throws ClaudeError. */
export async function callClaude(req: ClaudeRequest): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey || !apiKey.trim()) {
    throw new ClaudeError('ANTHROPIC_API_KEY is not set', { retryable: false })
  }

  const model = getModel(req.tier)
  const retries = req.retries ?? 1
  const timeoutMs = req.timeoutMs ?? 45_000
  let lastError: ClaudeError | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': API_VERSION,
        },
        body: JSON.stringify({
          model,
          max_tokens: req.maxTokens,
          ...(req.temperature !== undefined ? { temperature: req.temperature } : {}),
          system: req.system,
          messages: [{ role: 'user', content: req.user }],
        }),
      })

      if (!res.ok) {
        let detail = ''
        try { detail = (await res.text()).slice(0, 300) } catch { /* ignore */ }
        const retryable = res.status === 429 || res.status === 529 || res.status >= 500
        lastError = new ClaudeError(`Claude API ${res.status}: ${detail}`, { status: res.status, retryable })
        if (!retryable) throw lastError
        const retryAfter = Number(res.headers.get('retry-after'))
        if (attempt < retries) {
          await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter * 1000, 8000) : 600 * (attempt + 1))
          continue
        }
        throw lastError
      }

      const data = await res.json()
      const blocks: any[] = Array.isArray(data?.content) ? data.content : []
      const text = blocks.filter(b => b?.type === 'text').map(b => String(b.text ?? '')).join('')
      if (!text.trim()) throw new ClaudeError('Claude returned no text', { retryable: false })
      if (data?.stop_reason === 'max_tokens') {
        throw new ClaudeError('Claude response was cut off (max_tokens reached)', { retryable: false })
      }
      return text
    } catch (err: any) {
      if (err instanceof ClaudeError) {
        if (!err.retryable || attempt >= retries) throw err
        lastError = err
        continue
      }
      // Network failure or abort (timeout)
      const aborted = err?.name === 'AbortError'
      lastError = new ClaudeError(aborted ? `Claude request timed out after ${timeoutMs}ms` : `Claude request failed: ${err?.message ?? err}`, { retryable: true })
      if (attempt >= retries) throw lastError
      await sleep(600 * (attempt + 1))
    } finally {
      clearTimeout(timer)
    }
  }
  throw lastError ?? new ClaudeError('Claude request failed')
}

/**
 * Extract a JSON object from model text. Tolerates markdown fences and stray prose
 * before/after the object by locating the first balanced top-level {...}.
 */
export function extractJSON<T = any>(text: string): T {
  const cleaned = text.replace(/```(?:json)?/gi, '').trim()
  const start = cleaned.indexOf('{')
  if (start === -1) throw new ClaudeError('No JSON object found in model output')
  let depth = 0
  let inString = false
  let escaped = false
  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i]
    if (inString) {
      if (escaped) escaped = false
      else if (ch === '\\') escaped = true
      else if (ch === '"') inString = false
      continue
    }
    if (ch === '"') inString = true
    else if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) {
        try {
          return JSON.parse(cleaned.slice(start, i + 1)) as T
        } catch (e: any) {
          throw new ClaudeError(`Model returned malformed JSON: ${e?.message ?? e}`)
        }
      }
    }
  }
  throw new ClaudeError('Model JSON object was not terminated')
}

export async function callClaudeJSON<T = any>(req: ClaudeRequest): Promise<T> {
  const text = await callClaude(req)
  return extractJSON<T>(text)
}

/** Neutralise participant text before embedding it inside a prompt's tagged block. */
export function fenceUserText(text: string, maxChars: number): string {
  return String(text ?? '')
    .slice(0, maxChars)
    .replace(/</g, '‹')
    .replace(/>/g, '›')
}
