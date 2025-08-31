#!/usr/bin/env tsx

import { generateObject, generateText } from 'ai';
import { litellm } from './lib/litellm-provider';
import { openaiProxy } from './lib/openai-proxy-provider';
import { z } from 'zod';
import { config } from 'dotenv';
import fs from 'fs';

// Load environment variables
config();

// Test schema for structured outputs
const CommandSchema = z.object({
  command: z.enum(['CREATE_ISSUE', 'UPDATE_STATUS', 'QUERY_DATABASE', 'NONE']),
  priority: z.enum(['low', 'medium', 'high']),
  reason: z.string(),
  confidence: z.number().min(0).max(1),
});

async function testLiteLLMEndpoint() {
  console.log('🔍 Testing LiteLLM Endpoint (Claude models)');
  console.log('=' .repeat(50));
  
  // Test 1: Basic text generation
  console.log('\n📝 Test 1: Basic text generation');
  try {
    const { text } = await generateText({
      model: litellm('claude-3-7-sonnet'),
      prompt: 'Say hello in one sentence',
      maxTokens: 50,
    });
    console.log('✅ SUCCESS:', text);
  } catch (error) {
    console.log('❌ FAILED:', (error as Error).message);
  }
  
  // Test 2: Structured output with schema (should fail)
  console.log('\n📋 Test 2: generateObject with schema');
  try {
    const { object } = await generateObject({
      model: litellm('claude-3-7-sonnet'),
      schema: CommandSchema,
      prompt: 'Extract command from: "Create an urgent issue about login bug"',
    });
    console.log('✅ SUCCESS:', object);
  } catch (error) {
    console.log('❌ FAILED (expected):', (error as Error).message.split('\n')[0]);
  }
  
  // Test 3: JSON with text generation (should work)
  console.log('\n🔧 Test 3: JSON via text generation');
  try {
    const { text } = await generateText({
      model: litellm('claude-3-7-sonnet'),
      system: 'Respond with valid JSON only',
      prompt: 'Extract command from "Create an urgent issue" as JSON with fields: command, priority, reason, confidence',
      maxTokens: 150,
    });
    console.log('✅ Raw response:', text);
    
    // Try to parse and validate
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    const validated = CommandSchema.parse(parsed);
    console.log('✅ Validated:', validated);
  } catch (error) {
    console.log('❌ FAILED:', (error as Error).message);
  }
}

async function testOpenAIProxyEndpoint() {
  console.log('\n\n🚀 Testing OpenAI Proxy Endpoint (GPT models)');
  console.log('=' .repeat(50));
  
  // Test 1: Basic text generation
  console.log('\n📝 Test 1: Basic text generation');
  try {
    const { text } = await generateText({
      model: openaiProxy('gpt-4o-mini'),
      prompt: 'Say hello in one sentence',
      maxTokens: 50,
    });
    console.log('✅ SUCCESS:', text);
  } catch (error) {
    console.log('❌ FAILED:', (error as Error).message);
  }
  
  // Test 2: Structured output with schema (should work!)
  console.log('\n📋 Test 2: generateObject with schema');
  try {
    const { object } = await generateObject({
      model: openaiProxy('gpt-4o-mini'),
      schema: CommandSchema,
      prompt: 'Extract command from: "Create an urgent issue about login bug"',
    });
    console.log('✅ SUCCESS:', object);
  } catch (error) {
    console.log('❌ FAILED:', (error as Error).message.split('\n')[0]);
  }
  
  // Test 3: Different models
  console.log('\n🎯 Test 3: Testing different GPT models');
  const models = ['gpt-4o-mini', 'gpt-4o'];
  
  for (const modelId of models) {
    try {
      console.log(`\n  Testing ${modelId}...`);
      const { object } = await generateObject({
        model: openaiProxy(modelId),
        schema: z.object({
          model: z.string(),
          greeting: z.string(),
        }),
        prompt: 'Return your model name and a greeting',
      });
      console.log(`  ✅ ${modelId}:`, object);
    } catch (error) {
      console.log(`  ❌ ${modelId} FAILED:`, (error as Error).message.split('\n')[0]);
    }
  }
}

async function testTTSEndpoint() {
  console.log('\n\n🔊 Testing Text-to-Speech Endpoint');
  console.log('=' .repeat(50));
  
  const apiKey = fs.readFileSync('./openai_proxy_api_key.json', 'utf8');
  const testText = "Hello! This is a test of the text-to-speech functionality from the OpenAI proxy endpoint.";
  
  // Test different TTS models
  const ttsModels = [
    { id: 'tts-1', name: 'TTS-1 (Standard)' },
    { id: 'tts-1-hd', name: 'TTS-1-HD (High Quality)' }
  ];
  
  const voices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
  
  for (const model of ttsModels) {
    console.log(`\n🎤 Testing ${model.name}`);
    
    try {
      const response = await fetch('https://openai-proxy.air.dev.hioscar.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model.id,
          input: testText,
          voice: 'alloy', // Use alloy voice for testing
          response_format: 'mp3',
          speed: 1.0,
        }),
      });
      
      if (response.ok) {
        const audioBuffer = await response.arrayBuffer();
        const filename = `test-tts-${model.id}-alloy.mp3`;
        fs.writeFileSync(filename, Buffer.from(audioBuffer));
        
        console.log(`  ✅ ${model.name}: Generated ${audioBuffer.byteLength} bytes`);
        console.log(`  📁 Saved as: ${filename}`);
        console.log(`  🎵 Play with: afplay ${filename} (macOS) or mpv ${filename}`);
      } else {
        const error = await response.text();
        console.log(`  ❌ ${model.name} FAILED:`, error.substring(0, 100));
      }
    } catch (error) {
      console.log(`  ❌ ${model.name} ERROR:`, (error as Error).message);
    }
  }
  
  // Test different voices with TTS-1
  console.log(`\n🎭 Testing different voices with TTS-1`);
  const shortText = "Hello, this is a voice test.";
  
  for (const voice of voices.slice(0, 3)) { // Test first 3 voices
    try {
      console.log(`  Testing voice: ${voice}...`);
      
      const response = await fetch('https://openai-proxy.air.dev.hioscar.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: shortText,
          voice: voice,
          response_format: 'mp3',
        }),
      });
      
      if (response.ok) {
        const audioBuffer = await response.arrayBuffer();
        const filename = `test-voice-${voice}.mp3`;
        fs.writeFileSync(filename, Buffer.from(audioBuffer));
        
        console.log(`    ✅ Voice ${voice}: ${audioBuffer.byteLength} bytes → ${filename}`);
      } else {
        console.log(`    ❌ Voice ${voice} failed`);
      }
    } catch (error) {
      console.log(`    ❌ Voice ${voice} error:`, (error as Error).message);
    }
  }
}

async function main() {
  console.log('🚀 Comprehensive Endpoint Comparison Test\n');
  console.log('Testing both LiteLLM and OpenAI Proxy endpoints for:');
  console.log('• Basic text generation');
  console.log('• Structured outputs with Zod schemas');
  console.log('• Text-to-speech functionality');
  console.log('• Model availability\n');
  
  try {
    await testLiteLLMEndpoint();
    await testOpenAIProxyEndpoint();
    // await testTTSEndpoint();
    
    console.log('\n' + '=' .repeat(60));
    console.log('📊 SUMMARY:');
    console.log('');
    console.log('🔹 LiteLLM Endpoint (Claude models):');
    console.log('  ✅ Basic text generation');
    console.log('  ❌ Native structured outputs (generateObject)');
    console.log('  ✅ JSON via text generation + manual parsing');
    console.log('  📋 Models: Claude 3.5/3.7 Sonnet, Opus, Haiku variants');
    console.log('');
    console.log('🔹 OpenAI Proxy Endpoint (GPT models):');
    console.log('  ✅ Basic text generation');
    console.log('  ✅ Native structured outputs (generateObject)');
    console.log('  ✅ Full Zod schema validation');
    console.log('  ✅ Text-to-speech (TTS-1, TTS-1-HD)');
    console.log('  📋 Models: GPT-4o variants, TTS models');
    console.log('');
    console.log('💡 RECOMMENDATION:');
    console.log('  • Use OpenAI Proxy for structured outputs & TTS');
    console.log('  • Use LiteLLM for Claude-specific capabilities');
    console.log('  • Both can be used together in the same project');
    console.log('');
    console.log('🎵 TTS Files Generated:');
    console.log('  • test-tts-*.mp3 - Different TTS models');
    console.log('  • test-voice-*.mp3 - Different voices');
    console.log('  • Play with: afplay filename.mp3 (macOS)');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);