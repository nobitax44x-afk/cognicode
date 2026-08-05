import type { AIConfig } from '../types';

export interface StreamOptions {
  config: AIConfig;
  system: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  onToken: (delta: string) => void;
  signal?: AbortSignal;
}

export const DEFAULT_MODELS: Record<AIConfig['provider'], string> = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-5-haiku-latest',
  gemini: 'gemini-flash-latest',
};

export function defaultModelFor(provider: AIConfig['provider']): string {
  return DEFAULT_MODELS[provider];
}

async function readSSE(
  res: Response,
  onEvent: (data: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  if (!res.body) throw new Error('Empty response body');
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    if (signal?.aborted) break;
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (line.startsWith('data:')) {
        const data = line.slice(5).trim();
        if (data) onEvent(data);
      }
    }
  }
}

async function apiError(res: Response): Promise<Error> {
  let detail = '';
  try {
    const body = await res.json();
    detail = body?.error?.message ?? body?.message ?? JSON.stringify(body).slice(0, 300);
  } catch {
    detail = res.statusText;
  }
  return new Error(`Request failed (${res.status}): ${detail || 'unknown error'}`);
}

async function streamOpenAI(opts: StreamOptions): Promise<void> {
  const { config } = opts;
  const base = config.baseUrl?.replace(/\/$/, '') ?? 'https://api.openai.com/v1';
  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: 'system', content: opts.system }, ...opts.messages],
      stream: true,
      temperature: 0.6,
    }),
    signal: opts.signal,
  });
  if (!res.ok) throw await apiError(res);
  let full = '';
  await readSSE(
    res,
    (data) => {
      if (data === '[DONE]') return;
      try {
        const json = JSON.parse(data);
        const delta: string | undefined = json?.choices?.[0]?.delta?.content;
        if (delta) {
          full += delta;
          opts.onToken(delta);
        }
      } catch {
        /* ignore malformed chunk */
      }
    },
    opts.signal,
  );
}

async function streamAnthropic(opts: StreamOptions): Promise<void> {
  const { config } = opts;
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: config.model,
      system: opts.system,
      messages: opts.messages,
      max_tokens: 4096,
      stream: true,
    }),
    signal: opts.signal,
  });
  if (!res.ok) throw await apiError(res);
  await readSSE(
    res,
    (data) => {
      try {
        const json = JSON.parse(data);
        if (json?.type === 'content_block_delta' && json.delta?.text) {
          opts.onToken(json.delta.text);
        }
      } catch {
        /* ignore malformed chunk */
      }
    },
    opts.signal,
  );
}

async function streamGemini(opts: StreamOptions): Promise<void> {
  const { config } = opts;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    config.model,
  )}:streamGenerateContent?alt=sse&key=${encodeURIComponent(config.apiKey)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': config.apiKey,
    },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: opts.system }] },
      contents: opts.messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
    }),
    signal: opts.signal,
  });
  if (!res.ok) throw await apiError(res);
  await readSSE(
    res,
    (data) => {
      try {
        const json = JSON.parse(data);
        const parts = json?.candidates?.[0]?.content?.parts;
        if (Array.isArray(parts)) {
          for (const part of parts) {
            if (part?.text) opts.onToken(part.text);
          }
        }
      } catch {
        /* ignore malformed chunk */
      }
    },
    opts.signal,
  );
}

export async function streamChat(opts: StreamOptions): Promise<void> {
  switch (opts.config.provider) {
    case 'openai':
      return streamOpenAI(opts);
    case 'anthropic':
      return streamAnthropic(opts);
    case 'gemini':
      return streamGemini(opts);
  }
}
