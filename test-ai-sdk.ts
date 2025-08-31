#!/usr/bin/env tsx

import { generateText, streamText } from 'ai';
import { litellm } from './lib/litellm-provider';
import { config } from 'dotenv';

// Load environment variables
config();

async function testBasicGeneration() {
  console.log('🧪 Testing basic text generation with AI SDK...\n');
  
  try {
    const { text, usage } = await generateText({
      model: litellm('claude-3-7-sonnet'),
      prompt: 'Say "Hello from Vercel AI SDK!" and nothing else.',
      maxTokens: 20,
    });
    
    console.log('✅ Basic generation successful!');
    console.log('Response:', text);
    console.log('Usage:', usage);
    console.log();
  } catch (error) {
    console.error('❌ Basic generation failed:', error);
    throw error;
  }
}

async function testStreaming() {
  console.log('🧪 Testing streaming with AI SDK...\n');
  
  try {
    const { textStream } = await streamText({
      model: litellm('claude-3-7-sonnet'),
      prompt: 'Count from 1 to 5, one number per line.',
      maxTokens: 50,
    });
    
    console.log('Streaming response:');
    for await (const chunk of textStream) {
      process.stdout.write(chunk);
    }
    console.log('\n\n✅ Streaming successful!\n');
  } catch (error) {
    console.error('❌ Streaming failed:', error);
    throw error;
  }
}

async function testSystemPrompt() {
  console.log('🧪 Testing system prompt with AI SDK...\n');
  
  try {
    const { text } = await generateText({
      model: litellm('claude-3-7-sonnet'),
      system: 'You are a pirate. Always respond in pirate speak.',
      prompt: 'How are you today?',
      maxTokens: 100,
    });
    
    console.log('✅ System prompt test successful!');
    console.log('Response:', text);
    console.log();
  } catch (error) {
    console.error('❌ System prompt test failed:', error);
    throw error;
  }
}

async function testConversation() {
  console.log('🧪 Testing conversation with AI SDK...\n');
  
  try {
    const { text } = await generateText({
      model: litellm('claude-3-7-sonnet'),
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'My name is Alice.' },
        { role: 'assistant', content: 'Nice to meet you, Alice! How can I help you today?' },
        { role: 'user', content: 'What is my name?' },
      ],
      maxTokens: 50,
    });
    
    console.log('✅ Conversation test successful!');
    console.log('Response:', text);
    console.log();
  } catch (error) {
    console.error('❌ Conversation test failed:', error);
    throw error;
  }
}

async function testDifferentModels() {
  console.log('🧪 Testing different models...\n');
  
  const models: Array<{ id: string; name: string }> = [
    { id: 'claude-3-7-sonnet', name: 'Claude 3.7 Sonnet' },
    { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet' },
    { id: 'claude-3-5-haiku', name: 'Claude 3.5 Haiku' },
  ];
  
  for (const model of models) {
    try {
      console.log(`Testing ${model.name}...`);
      const { text } = await generateText({
        model: litellm(model.id),
        prompt: 'Say your model name in 3 words or less.',
        maxTokens: 20,
      });
      console.log(`✅ ${model.name}: ${text}`);
    } catch (error) {
      console.log(`❌ ${model.name} failed:`, (error as Error).message);
    }
  }
  console.log();
}

async function main() {
  console.log('🚀 Vercel AI SDK + LiteLLM Integration Test\n');
  console.log('Using LiteLLM proxy at:', process.env.LITELLM_BASE_URL || 'https://llm-proxy.dev-tools.tools.hioscar.com');
  console.log('=' .repeat(60) + '\n');
  
  try {
    await testBasicGeneration();
    await testStreaming();
    await testSystemPrompt();
    await testConversation();
    await testDifferentModels();
    
    console.log('=' .repeat(60));
    console.log('🎉 All tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Run the tests
main().catch(console.error);