Skip to content
Navigation Menu
vercel
ai

Type / to search
Code
Issues
575
Pull requests
177
Discussions
Actions
Security
Insights
Owner avatar
ai
Public
vercel/ai
Go to file
t
Name		
vercel-ai-sdk[bot]
vercel-ai-sdk[bot]
Version Packages (#8373)
1828e0d
 · 
17 hours ago
.changeset
Version Packages (#8373)
17 hours ago
.github
ci(assign-team-pull-request): ignore bots (#8304)
4 days ago
.vscode
chore (dependencies): update typescript to 5.6.3 (#3522)
9 months ago
assets
chore: update contents of readme (#2140)
last year
content
feat(xai): Add grok-code-fast-1 (#8370)
17 hours ago
contributing
chore (docs): add branches and add new model contributor docs (#7814)
last month
examples
feat(ai): log warnings (#8343)
2 days ago
packages
Version Packages (#8373)
17 hours ago
tools
test: explicitly import vitest functions (#8277)
3 days ago
.eslintrc.js
prettier: enforce semi colons, add trailingComma (#529)
2 years ago
.gitignore
chore: add .envrc to .gitignore (#6965)
2 months ago
.kodiak.toml
chore: disable optimistic kodiak merges
2 years ago
.npmrc
chore: upgrade to pnpm 10 (#6396)
3 months ago
.prettierignore
chore (ui/solid): remove solid js support (#5511)
5 months ago
CHANGELOG.md
feat (providers/gateway): initial gateway provider (#6513)
3 months ago
CODE_OF_CONDUCT.md
docs(CODE_OF_CONDUCT): Vercel Community Code of Conduct (#8077)
2 weeks ago
CONTRIBUTING.md
docs: add pkgs and architecture contributor docs (#7752)
last month
LICENSE
Rename to just ai (#49)
2 years ago
README.md
feat (provider/perplexity): add sonar-deep-research model (#5996) (#6022
4 months ago
package.json
pkg(prettier): fixed version (#6982)
2 months ago
pnpm-lock.yaml
docs(examples): remove zod-to-json-schema from dependencies, no lon…
4 days ago
pnpm-workspace.yaml
fix(#5542): fix release action with moved test dir (#5610)
4 months ago
socket.yaml
Add Socket config (#2668)
last year
tsconfig.json
Revert "feat(provider): add hugging face provider support" (#7793)
last month
tsconfig.with-examples.json
feat (angular): Add Angular support and example (#7211)
last month
turbo.json
Revert "feat(provider): add hugging face provider support" (#7793)
last month
Repository files navigation
README
Code of conduct
Contributing
License
Security
hero illustration

AI SDK
The AI SDK is a TypeScript toolkit designed to help you build AI-powered applications using popular frameworks like Next.js, React, Svelte, Vue and runtimes like Node.js.

To learn more about how to use the AI SDK, check out our API Reference and Documentation.

Installation
You will need Node.js 18+ and pnpm installed on your local development machine.

npm install ai
Usage
AI SDK Core
The AI SDK Core module provides a unified API to interact with model providers like OpenAI, Anthropic, Google, and more.

You will then install the model provider of your choice.

npm install @ai-sdk/openai
@/index.ts (Node.js Runtime)
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai'; // Ensure OPENAI_API_KEY environment variable is set

const { text } = await generateText({
  model: openai('gpt-4o'),
  system: 'You are a friendly assistant!',
  prompt: 'Why is the sky blue?',
});

console.log(text);
AI SDK UI
The AI SDK UI module provides a set of hooks that help you build chatbots and generative user interfaces. These hooks are framework agnostic, so they can be used in Next.js, React, Svelte, and Vue.

You need to install the package for your framework:

npm install @ai-sdk/react
@/app/page.tsx (Next.js App Router)
'use client';

import { useChat } from '@ai-sdk/react';

export default function Page() {
  const { messages, input, handleSubmit, handleInputChange, status } =
    useChat();

  return (
    <div>
      {messages.map(message => (
        <div key={message.id}>
          <strong>{`${message.role}: `}</strong>
          {message.parts.map((part, index) => {
            switch (part.type) {
              case 'text':
                return <span key={index}>{part.text}</span>;

              // other cases can handle images, tool calls, etc
            }
          })}
        </div>
      ))}

      <form onSubmit={handleSubmit}>
        <input
          value={input}
          placeholder="Send a message..."
          onChange={handleInputChange}
          disabled={status !== 'ready'}
        />
      </form>
    </div>
  );
}
@/app/api/chat/route.ts (Next.js App Router)
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai('gpt-4o'),
    system: 'You are a helpful assistant.',
    messages,
  });

  return result.toUIMessageStreamResponse();
}
Templates
We've built templates that include AI SDK integrations for different use cases, providers, and frameworks. You can use these templates to get started with your AI-powered application.

Community
The AI SDK community can be found on GitHub Discussions where you can ask questions, voice ideas, and share your projects with other people.

Contributing
Contributions to the AI SDK are welcome and highly appreciated. However, before you jump right into it, we would like you to review our Contribution Guidelines to make sure you have smooth experience contributing to AI SDK.

Authors
This library is created by Vercel and Next.js team members, with contributions from the Open Source Community.

About
The AI Toolkit for TypeScript. From the creators of Next.js, the AI SDK is a free open-source library for building AI-powered applications and agents

ai-sdk.dev
Topics
react javascript typescript vue nextjs svelte artificial-intelligence gemini openai language-model vercel llm generative-ai anthropic generative-ui
Resources
 Readme
License
 View license
Code of conduct
 Code of conduct
Contributing
 Contributing
Security policy
 Security policy
 Activity
 Custom properties
Stars
 17.2k stars
Watchers
 104 watching
Forks
 2.8k forks
Report repository
Releases 5,000+
@ai-sdk/xai@2.0.14
Latest
16 hours ago
+ 5,229 releases
Used by 79.6k
@thiagodebastos
@Light-houseAI
@OzCog
@rahulpuri02
@1qh
@vanshavenger
@juanpujol
@r-hsnin
+ 79,639
Contributors
492
@lgrammel
@github-actions[bot]
@nicoalbanese
@shaper
@MaxLeiter
@jaredpalmer
@dancer
@samdenty
@shuding
@jeremyphilemon
@dependabot[bot]
@gr2m
@iteratetograceness
@vercel-ai-sdk[bot]
+ 478 contributors
Deployments
500+
 Preview 16 hours ago
 Production 16 hours ago
+ more deployments
Languages
TypeScript
69.9%
 
MDX
29.7%
 
Other
0.4%
Footer
© 2025 GitHub, Inc.
Footer navigation
Terms
Privacy
Security
Status
Docs
Contact
Manage cookies
Do not share my personal information
