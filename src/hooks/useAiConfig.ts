import { useCallback, useEffect, useState } from 'react';
import type { AIConfig } from '../types';
import { defaultModelFor } from '../lib/ai';

const STORAGE_KEY = 'cognicode-ai-config';

const ENV_PROVIDER: string | undefined = import.meta.env.VITE_AI_PROVIDER as
  | string
  | undefined;
const ENV_MODEL: string | undefined = import.meta.env.VITE_AI_MODEL as
  | string
  | undefined;
const ENV_API_KEY: string | undefined = import.meta.env.VITE_AI_API_KEY as
  | string
  | undefined;
const ENV_BASE_URL: string | undefined = import.meta.env.VITE_AI_BASE_URL as
  | string
  | undefined;
const ENV_GEMINI_KEY: string | undefined = import.meta.env
  .VITE_GEMINI_API_KEY as string | undefined;

function envDefaultConfig(): AIConfig | null {
  const key = ENV_API_KEY?.trim();
  if (key) {
    const provider = (ENV_PROVIDER as AIConfig['provider'] | undefined) ?? 'openai';
    return {
      provider,
      model: ENV_MODEL?.trim() || defaultModelFor(provider),
      apiKey: key,
      baseUrl: ENV_BASE_URL?.trim() || undefined,
    };
  }
  if (ENV_GEMINI_KEY?.trim()) {
    return {
      provider: 'gemini',
      model: 'gemini-flash-latest',
      apiKey: ENV_GEMINI_KEY.trim(),
    };
  }
  return null;
}

export function useAiConfig() {
  const [config, setConfig] = useState<AIConfig | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as AIConfig;
    } catch {
      /* ignore corrupt stored config */
    }
    return envDefaultConfig();
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  const save = useCallback((cfg: AIConfig) => {
    setConfig(cfg);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
    } catch {
      /* storage may be unavailable */
    }
  }, []);

  const clear = useCallback(() => {
    setConfig(envDefaultConfig());
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  return { config, loaded, save, clear };
}
