#!/usr/bin/env tsx

import { generateObject, generateText } from 'ai';
import { litellm } from './lib/litellm-provider';
import { z } from 'zod';
import { config } from 'dotenv';

// Load environment variables
config();

// Test schema
const TestSchema = z.object({
  command: z.enum(['CREATE_ISSUE', 'UPDATE_STATUS', 'QUERY_DATABASE', 'NONE']),
  confidence: z.number().min(0).max(1),
});

async function testStructuredOutputSupport() {
  console.log('🔍 Testing LiteLLM Structured Output Support\n');
  console.log('Base URL:', process.env.LITELLM_BASE_URL || 'https://llm-proxy.dev-tools.tools.hioscar.com');
  console.log('=' .repeat(60) + '\n');

  const models = [
    'claude-3-7-sonnet',
    'claude-3-5-sonnet', 
    'claude-opus-4-1-vertex',
    'claude-3-5-haiku',
  ];

  for (const modelId of models) {
    console.log(`🧪 Testing model: ${modelId}`);
    
    // Test 1: Check if generateObject works with schema
    console.log('  📋 Test 1: generateObject with schema...');
    try {
      const { object } = await generateObject({
        model: litellm(modelId),
        schema: TestSchema,
        prompt: 'Extract command from: "Create an issue about login bug"',
        maxTokens: 100,
      });
      
      console.log('  ✅ generateObject SUCCESS:', object);
    } catch (error) {
      console.log('  ❌ generateObject FAILED:', (error as Error).message.split('\n')[0]);
    }

    // Test 2: Check response format support
    console.log('  🔧 Test 2: response_format support...');
    try {
      const response = await fetch(`${process.env.LITELLM_BASE_URL || 'https://llm-proxy.dev-tools.tools.hioscar.com'}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelId,
          messages: [{ role: 'user', content: 'Say hello' }],
          response_format: { type: 'json_object' },
          max_tokens: 50,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('  ✅ response_format SUPPORTED');
      } else {
        const error = await response.text();
        console.log('  ❌ response_format NOT SUPPORTED:', error.substring(0, 100));
      }
    } catch (error) {
      console.log('  ❌ response_format ERROR:', (error as Error).message);
    }

    // Test 3: Check model capabilities endpoint
    console.log('  📊 Test 3: Model capabilities...');
    try {
      const response = await fetch(`${process.env.LITELLM_BASE_URL || 'https://llm-proxy.dev-tools.tools.hioscar.com'}/models`);
      if (response.ok) {
        const data = await response.json();
        const model = data.data?.find((m: any) => m.id === modelId);
        if (model) {
          console.log('  ✅ Model found in /models endpoint');
          // Check if there are any capability indicators
          if (model.capabilities) {
            console.log('  📋 Capabilities:', model.capabilities);
          }
        } else {
          console.log('  ⚠️ Model not found in /models endpoint');
        }
      }
    } catch (error) {
      console.log('  ❌ Models endpoint ERROR:', (error as Error).message);
    }

    // Test 4: Check provider metadata
    console.log('  🔍 Test 4: Provider introspection...');
    try {
      const model = litellm(modelId);
      // Try to access internal properties to check capabilities
      console.log('  📝 Model provider:', (model as any).provider || 'unknown');
      console.log('  📝 Model config:', (model as any).modelId || modelId);
      
      // Check if the model instance has structured output support
      if ((model as any).supportsStructuredOutputs !== undefined) {
        console.log('  📋 supportsStructuredOutputs:', (model as any).supportsStructuredOutputs);
      } else {
        console.log('  ⚠️ supportsStructuredOutputs property not found');
      }
    } catch (error) {
      console.log('  ❌ Introspection ERROR:', (error as Error).message);
    }

    console.log();
  }
}

async function testAlternativeApproaches() {
  console.log('🔧 Testing Alternative Structured Output Approaches\n');
  
  // Test with different output strategies
  const strategies = [
    { name: 'no-schema', config: { output: 'no-schema' as const } },
    { name: 'enum', config: { output: 'enum' as const, enum: ['CREATE_ISSUE', 'UPDATE_STATUS', 'NONE'] } },
  ];

  for (const strategy of strategies) {
    console.log(`📋 Testing ${strategy.name} strategy...`);
    try {
      const { object } = await generateObject({
        model: litellm('claude-3-7-sonnet'),
        ...strategy.config,
        prompt: 'What command should be executed for: "Create a bug report"',
      } as any);
      
      console.log(`✅ ${strategy.name} SUCCESS:`, object);
    } catch (error) {
      console.log(`❌ ${strategy.name} FAILED:`, (error as Error).message.split('\n')[0]);
    }
  }
  console.log();
}

async function testProviderOptions() {
  console.log('🛠️ Testing Provider-Specific Options\n');
  
  try {
    const { text } = await generateText({
      model: litellm('claude-3-7-sonnet'),
      prompt: 'Say hello',
      providerOptions: {
        litellm: {
          response_format: { type: 'json_object' },
        },
      },
    });
    
    console.log('✅ Provider options SUCCESS:', text);
  } catch (error) {
    console.log('❌ Provider options FAILED:', (error as Error).message.split('\n')[0]);
  }
  console.log();
}

async function main() {
  console.log('🚀 LiteLLM Structured Output Capability Test\n');
  
  try {
    await testStructuredOutputSupport();
    await testAlternativeApproaches();
    await testProviderOptions();
    
    console.log('=' .repeat(60));
    console.log('📊 Summary:');
    console.log('  • Check the results above to see which approaches work');
    console.log('  • generateObject with schema may not be supported');
    console.log('  • response_format support varies by model');
    console.log('  • Alternative approaches like no-schema may work better');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

main().catch(console.error);