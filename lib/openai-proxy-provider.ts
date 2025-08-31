/// @see /Users/mlustig/dev/work/sources/.docs/dev-qol/openai model access.md
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import fs from "fs";

// Define available OpenAI model IDs
export type OpenAIProxyModelIds =
  | "gpt-4o"
  | "gpt-4o-mini"
  | "gpt-4o-2024-05-13"
  | "gpt-4o-2024-08-06"
  | "gpt-4o-mini-2024-07-18"
  | "chatgpt-4o-latest"
  | "gpt-4o-realtime-preview-2024-10-01"
  | "tts-1"
  | "tts-1-hd"
  | "tts-1-1106"
  | "tts-1-hd-1106"
  | (string & {}); // Allow any string but provide autocomplete for known models

export interface OpenAIProxyProviderSettings {
  /**
   * Base URL for the OpenAI proxy
   * Defaults to https://openai-proxy.air.dev.hioscar.com/v1
   */
  baseURL?: string;

  /**
   * API key for authentication (JSON blob from generate_openai_proxy_api_key)
   * Can be a string (JSON) or path to JSON file
   */
  apiKey?: string;

  /**
   * Custom headers to include in requests
   */
  headers?: Record<string, string>;
}

/**
 * Load API key from file or return as-is if it's already a JSON string
 */
function loadApiKey(apiKey?: string): string {
  if (!apiKey) {
    // Try to load from default file
    try {
      return fs.readFileSync("./openai_proxy_api_key.json", "utf8");
    } catch {
      throw new Error(
        "No API key provided and openai_proxy_api_key.json not found",
      );
    }
  }

  // If it looks like a file path, read it
  if (apiKey.endsWith(".json") && !apiKey.startsWith("{")) {
    try {
      return fs.readFileSync(apiKey, "utf8");
    } catch {
      throw new Error(`Could not read API key file: ${apiKey}`);
    }
  }

  // Otherwise assume it's the JSON string itself
  return apiKey;
}

/**
 * Create an OpenAI proxy provider instance for use with Vercel AI SDK
 */
export function createOpenAIProxy(options: OpenAIProxyProviderSettings = {}) {
  const baseURL =
    options.baseURL || "https://openai-proxy.air.dev.hioscar.com/v1";
  const apiKey = loadApiKey(options.apiKey);

  return createOpenAICompatible<OpenAIProxyModelIds>({
    name: "openai-proxy",
    baseURL,
    apiKey,
    headers: options.headers,
    // Let AI SDK auto-detect structured output capabilities
  });
}

// Export a default instance
export const openaiProxy = createOpenAIProxy();
