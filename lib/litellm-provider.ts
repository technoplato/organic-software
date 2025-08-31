import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

// Define available model IDs for auto-completion
export type LiteLLMChatModelIds =
  | 'claude-3-7-sonnet'
  | 'claude-sonnet-4-vertex'
  | 'claude-sonnet-4'
  | 'claude-3-5-sonnet'
  | 'claude-opus-4-vertex'
  | 'claude-opus-4'
  | 'claude-opus-4-1-vertex'
  | 'claude-3-5-haiku-vertex'
  | 'claude-opus-4-1'
  | (string & {}); // Allow any string but provide autocomplete for known models

export interface LiteLLMProviderSettings {
  /**
   * Base URL for the LiteLLM proxy
   * Defaults to the value from environment variable LITELLM_BASE_URL
   */
  baseURL?: string;
  
  /**
   * API key for authentication (if required)
   * Defaults to the value from environment variable LITELLM_API_KEY
   */
  apiKey?: string;
  
  /**
   * Custom headers to include in requests
   */
  headers?: Record<string, string>;
}

/**
 * Create a LiteLLM provider instance for use with Vercel AI SDK
 */
export function createLiteLLM(options: LiteLLMProviderSettings = {}) {
  const baseURL = options.baseURL || 
    process.env.LITELLM_BASE_URL || 
    'https://llm-proxy.dev-tools.tools.hioscar.com';
  
  const apiKey = options.apiKey || process.env.LITELLM_API_KEY;
  
  return createOpenAICompatible({
    name: 'litellm',
    baseURL,
    // Only include apiKey if it's provided (your proxy doesn't require auth)
    ...(apiKey ? { apiKey } : {}),
    headers: options.headers,
    // Let AI SDK auto-detect structured output capabilities
  });
}

// Export a default instance
export const litellm = createLiteLLM();