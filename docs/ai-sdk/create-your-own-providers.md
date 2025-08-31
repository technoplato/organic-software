AI SDK 5 is available now.

View Announcement
AI SDK Providers

AI Gateway
xAI Grok
Vercel
OpenAI
Azure OpenAI
Anthropic
Amazon Bedrock
Groq
Fal
DeepInfra
Google Generative AI
Google Vertex AI
Mistral AI
Together.ai
Cohere
Fireworks
DeepSeek
Cerebras
Replicate
Perplexity
Luma
ElevenLabs
AssemblyAI
Deepgram
Gladia
LMNT
Hume
Rev.ai
OpenAI Compatible Providers

Writing a Custom Provider
LM Studio
NVIDIA NIM
Baseten
Heroku
Community Providers

Automatic1111
Writing a Custom Provider
Qwen
Ollama
A2A
Requesty
FriendliAI
Portkey
Cloudflare Workers AI
Cloudflare AI Gateway
OpenRouter
Azure AI
SAP AI Core
Crosshatch
Mixedbread
Voyage AI
Jina AI
Mem0
Letta
Anthropic Vertex
Spark
Inflection AI
LangDB
Zhipu AI
SambaNova
Dify
Sarvam
AI/ML API
Claude Code
Built-in AI
Gemini CLI
Adapters

LangChain
LlamaIndex
Observability Integrations

Braintrust
Helicone
Laminar
Langfuse
LangSmith
LangWatch
Maxim
Patronus
Scorecard
SigNoz
Traceloop
Weave
OpenAI Compatible Providers
Writing a Custom Provider
Writing a Custom Provider
You can create your own provider package that leverages the AI SDK's OpenAI Compatible package. Publishing your provider package to npm can give users an easy way to use the provider's models and stay up to date with any changes you may have. Here's an example structure:

File Structure

packages/example/
├── src/
│   ├── example-chat-settings.ts       # Chat model types and settings
│   ├── example-completion-settings.ts # Completion model types and settings
│   ├── example-embedding-settings.ts  # Embedding model types and settings
│   ├── example-image-settings.ts      # Image model types and settings
│   ├── example-provider.ts            # Main provider implementation
│   ├── example-provider.test.ts       # Provider tests
│   └── index.ts                       # Public exports
├── package.json
├── tsconfig.json
├── tsup.config.ts                     # Build configuration
└── README.md
Key Files
example-chat-settings.ts - Define chat model IDs and settings:

export type ExampleChatModelId =
  | 'example/chat-model-1'
  | 'example/chat-model-2'
  | (string & {});
The completion, embedding, and image settings are implemented similarly to the chat settings.

example-provider.ts - Main provider implementation:

import { LanguageModelV1, EmbeddingModelV2 } from '@ai-sdk/provider';
import {
  OpenAICompatibleChatLanguageModel,
  OpenAICompatibleCompletionLanguageModel,
  OpenAICompatibleEmbeddingModel,
  OpenAICompatibleImageModel,
} from '@ai-sdk/openai-compatible';
import {
  FetchFunction,
  loadApiKey,
  withoutTrailingSlash,
} from '@ai-sdk/provider-utils';
// Import your model id and settings here.

export interface ExampleProviderSettings {
  /**
Example API key.
*/
  apiKey?: string;
  /**
Base URL for the API calls.
*/
  baseURL?: string;
  /**
Custom headers to include in the requests.
*/
  headers?: Record<string, string>;
  /**
Optional custom url query parameters to include in request urls.
*/
  queryParams?: Record<string, string>;
  /**
Custom fetch implementation. You can use it as a middleware to intercept requests,
or to provide a custom fetch implementation for e.g. testing.
*/
  fetch?: FetchFunction;
}

export interface ExampleProvider {
  /**
Creates a model for text generation.
*/
  (
    modelId: ExampleChatModelId,
    settings?: ExampleChatSettings,
  ): LanguageModelV1;

  /**
Creates a chat model for text generation.
*/
  chatModel(
    modelId: ExampleChatModelId,
    settings?: ExampleChatSettings,
  ): LanguageModelV1;

  /**
Creates a completion model for text generation.
*/
  completionModel(
    modelId: ExampleCompletionModelId,
    settings?: ExampleCompletionSettings,
  ): LanguageModelV1;

  /**
Creates a text embedding model for text generation.
*/
  textEmbeddingModel(
    modelId: ExampleEmbeddingModelId,
    settings?: ExampleEmbeddingSettings,
  ): EmbeddingModelV2<string>;

  /**
Creates an image model for image generation.
*/
  imageModel(
    modelId: ExampleImageModelId,
    settings?: ExampleImageSettings,
  ): ImageModelV2;
}

export function createExample(
  options: ExampleProviderSettings = {},
): ExampleProvider {
  const baseURL = withoutTrailingSlash(
    options.baseURL ?? 'https://api.example.com/v1',
  );
  const getHeaders = () => ({
    Authorization: `Bearer ${loadApiKey({
      apiKey: options.apiKey,
      environmentVariableName: 'EXAMPLE_API_KEY',
      description: 'Example API key',
    })}`,
    ...options.headers,
  });

  interface CommonModelConfig {
    provider: string;
    url: ({ path }: { path: string }) => string;
    headers: () => Record<string, string>;
    fetch?: FetchFunction;
  }

  const getCommonModelConfig = (modelType: string): CommonModelConfig => ({
    provider: `example.${modelType}`,
    url: ({ path }) => {
      const url = new URL(`${baseURL}${path}`);
      if (options.queryParams) {
        url.search = new URLSearchParams(options.queryParams).toString();
      }
      return url.toString();
    },
    headers: getHeaders,
    fetch: options.fetch,
  });

  const createChatModel = (
    modelId: ExampleChatModelId,
    settings: ExampleChatSettings = {},
  ) => {
    return new OpenAICompatibleChatLanguageModel(
      modelId,
      settings,
      getCommonModelConfig('chat'),
    );
  };

  const createCompletionModel = (
    modelId: ExampleCompletionModelId,
    settings: ExampleCompletionSettings = {},
  ) =>
    new OpenAICompatibleCompletionLanguageModel(
      modelId,
      settings,
      getCommonModelConfig('completion'),
    );

  const createTextEmbeddingModel = (
    modelId: ExampleEmbeddingModelId,
    settings: ExampleEmbeddingSettings = {},
  ) =>
    new OpenAICompatibleEmbeddingModel(
      modelId,
      settings,
      getCommonModelConfig('embedding'),
    );

  const createImageModel = (
    modelId: ExampleImageModelId,
    settings: ExampleImageSettings = {},
  ) =>
    new OpenAICompatibleImageModel(
      modelId,
      settings,
      getCommonModelConfig('image'),
    );

  const provider = (
    modelId: ExampleChatModelId,
    settings?: ExampleChatSettings,
  ) => createChatModel(modelId, settings);

  provider.completionModel = createCompletionModel;
  provider.chatModel = createChatModel;
  provider.textEmbeddingModel = createTextEmbeddingModel;
  provider.imageModel = createImageModel;

  return provider;
}

// Export default instance
export const example = createExample();
index.ts - Public exports:

export { createExample, example } from './example-provider';
export type {
  ExampleProvider,
  ExampleProviderSettings,
} from './example-provider';
package.json - Package configuration:

{
  "name": "@company-name/example",
  "version": "0.0.1",
  "dependencies": {
    "@ai-sdk/openai-compatible": "^0.0.7",
    "@ai-sdk/provider": "^1.0.2",
    "@ai-sdk/provider-utils": "^2.0.4",
    // ...additional dependencies
  },
  // ...additional scripts and module build configuration
}
Usage
Once published, users can use your provider like this:


import { example } from '@company-name/example';
import { generateText } from 'ai';

const { text } = await generateText({
  model: example('example/chat-model-1'),
  prompt: 'Hello, how are you?',
});
This structure provides a clean, type-safe implementation that leverages the OpenAI Compatible package while maintaining consistency with the usage of other AI SDK providers.

Internal API
As you work on your provider you may need to use some of the internal API of the OpenAI Compatible package. You can import these from the @ai-sdk/openai-compatible/internal package, for example:


import { convertToOpenAICompatibleChatMessages } from '@ai-sdk/openai-compatible/internal';
You can see the latest available exports in the AI SDK GitHub repository.

Previous
OpenAI Compatible Providers
Next
LM Studio
On this page
Writing a Custom Provider
File Structure
Key Files
Usage
Internal API
Elevate your AI applications with Vercel.
Trusted by OpenAI, Replicate, Suno, Pinecone, and more.
Vercel provides tools and infrastructure to deploy AI apps and features at scale.
Resources
Docs
Cookbook
Providers
Showcase
GitHub
Discussions
More
Playground
Contact Sales
About Vercel
Next.js + Vercel
Open Source Software
GitHub
X
Legal
Privacy Policy
© 2025 Vercel, Inc.





OpenAI Compatible Providers: Writing a Custom Provider