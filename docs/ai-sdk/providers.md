AI SDK 5 is available now.

View Announcement
AI SDK by Vercel
Foundations

Overview
Providers and Models
Prompts
Tools
Streaming
Agents
Getting Started

Navigating the Library
Next.js App Router
Next.js Pages Router
Svelte
Vue.js (Nuxt)
Node.js
Expo
AI SDK Core

Overview
Generating Text
Generating Structured Data
Tool Calling
Prompt Engineering
Settings
Embeddings
Image Generation
Transcription
Speech
Language Model Middleware
Provider & Model Management
Error Handling
Testing
Telemetry
AI SDK UI

Overview
Chatbot
Chatbot Message Persistence
Chatbot Resume Streams
Chatbot Tool Usage
Generative User Interfaces
Completion
Object Generation
Streaming Custom Data
Error Handling
Transport
Reading UIMessage Streams
Message Metadata
Stream Protocols
AI SDK RSC

Advanced

Reference

AI SDK Core

AI SDK UI

AI SDK RSC

Stream Helpers

AI SDK Errors

Migration Guides

Troubleshooting

Foundations
Providers and Models
Providers and Models
Companies such as OpenAI and Anthropic (providers) offer access to a range of large language models (LLMs) with differing strengths and capabilities through their own APIs.

Each provider typically has its own unique method for interfacing with their models, complicating the process of switching providers and increasing the risk of vendor lock-in.

To solve these challenges, AI SDK Core offers a standardized approach to interacting with LLMs through a language model specification that abstracts differences between providers. This unified interface allows you to switch between providers with ease while using the same API for all providers.

Here is an overview of the AI SDK Provider Architecture:


AI SDK Providers
The AI SDK comes with a wide range of providers that you can use to interact with different language models:

xAI Grok Provider (@ai-sdk/xai)
OpenAI Provider (@ai-sdk/openai)
Azure OpenAI Provider (@ai-sdk/azure)
Anthropic Provider (@ai-sdk/anthropic)
Amazon Bedrock Provider (@ai-sdk/amazon-bedrock)
Google Generative AI Provider (@ai-sdk/google)
Google Vertex Provider (@ai-sdk/google-vertex)
Mistral Provider (@ai-sdk/mistral)
Together.ai Provider (@ai-sdk/togetherai)
Cohere Provider (@ai-sdk/cohere)
Fireworks Provider (@ai-sdk/fireworks)
DeepInfra Provider (@ai-sdk/deepinfra)
DeepSeek Provider (@ai-sdk/deepseek)
Cerebras Provider (@ai-sdk/cerebras)
Groq Provider (@ai-sdk/groq)
Perplexity Provider (@ai-sdk/perplexity)
ElevenLabs Provider (@ai-sdk/elevenlabs)
LMNT Provider (@ai-sdk/lmnt)
Hume Provider (@ai-sdk/hume)
Rev.ai Provider (@ai-sdk/revai)
Deepgram Provider (@ai-sdk/deepgram)
Gladia Provider (@ai-sdk/gladia)
LMNT Provider (@ai-sdk/lmnt)
AssemblyAI Provider (@ai-sdk/assemblyai)
You can also use the OpenAI Compatible provider with OpenAI-compatible APIs:

LM Studio
Baseten
Heroku
Our language model specification is published as an open-source package, which you can use to create custom providers.

The open-source community has created the following providers:

Ollama Provider (ollama-ai-provider)
FriendliAI Provider (@friendliai/ai-provider)
Portkey Provider (@portkey-ai/vercel-provider)
Cloudflare Workers AI Provider (workers-ai-provider)
OpenRouter Provider (@openrouter/ai-sdk-provider)
Requesty Provider (@requesty/ai-sdk)
Crosshatch Provider (@crosshatch/ai-provider)
Mixedbread Provider (mixedbread-ai-provider)
Voyage AI Provider (voyage-ai-provider)
Mem0 Provider(@mem0/vercel-ai-provider)
Letta Provider(@letta-ai/vercel-ai-sdk-provider)
Spark Provider (spark-ai-provider)
AnthropicVertex Provider (anthropic-vertex-ai)
LangDB Provider (@langdb/vercel-provider)
Dify Provider (dify-ai-provider)
Sarvam Provider (sarvam-ai-provider)
Claude Code Provider (ai-sdk-provider-claude-code)
Built-in AI Provider (built-in-ai)
Gemini CLI Provider (ai-sdk-provider-gemini-cli)
A2A Provider (a2a-ai-provider)
SAP-AI Provider (@mymediset/sap-ai-provider)
AI/ML API Provider (@ai-ml.api/aimlapi-vercel-ai)
Self-Hosted Models
You can access self-hosted models with the following providers:

Ollama Provider
LM Studio
Baseten
Built-in AI
Additionally, any self-hosted provider that supports the OpenAI specification can be used with the OpenAI Compatible Provider.

Model Capabilities
The AI providers support different language models with various capabilities. Here are the capabilities of popular models:

Provider	Model	Image Input	Object Generation	Tool Usage	Tool Streaming
xAI Grok	grok-4				
xAI Grok	grok-3				
xAI Grok	grok-3-fast				
xAI Grok	grok-3-mini				
xAI Grok	grok-3-mini-fast				
xAI Grok	grok-2-1212				
xAI Grok	grok-2-vision-1212				
xAI Grok	grok-beta				
xAI Grok	grok-vision-beta				
Vercel	v0-1.0-md				
OpenAI	gpt-5				
OpenAI	gpt-5-mini				
OpenAI	gpt-5-nano				
OpenAI	gpt-5-chat-latest				
Anthropic	claude-opus-4-latest				
Anthropic	claude-sonnet-4-latest				
Anthropic	claude-3-7-sonnet-latest				
Anthropic	claude-3-5-sonnet-latest				
Anthropic	claude-3-5-sonnet-latest				
Anthropic	claude-3-5-haiku-latest				
Mistral	pixtral-large-latest				
Mistral	mistral-large-latest				
Mistral	mistral-medium-latest				
Mistral	mistral-medium-2505				
Mistral	mistral-small-latest				
Mistral	pixtral-12b-2409				
Google Generative AI	gemini-2.0-flash-exp				
Google Generative AI	gemini-1.5-flash				
Google Generative AI	gemini-1.5-pro				
Google Vertex	gemini-2.0-flash-exp				
Google Vertex	gemini-1.5-flash				
Google Vertex	gemini-1.5-pro				
DeepSeek	deepseek-chat				
DeepSeek	deepseek-reasoner				
Cerebras	llama3.1-8b				
Cerebras	llama3.1-70b				
Cerebras	llama3.3-70b				
Groq	meta-llama/llama-4-scout-17b-16e-instruct				
Groq	llama-3.3-70b-versatile				
Groq	llama-3.1-8b-instant				
Groq	mixtral-8x7b-32768				
Groq	gemma2-9b-it				
This table is not exhaustive. Additional models can be found in the provider documentation pages and on the provider websites.

Previous
Overview
Next
Prompts
On this page
Providers and Models
AI SDK Providers
Self-Hosted Models
Model Capabilities
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




Foundations: Providers and Models
