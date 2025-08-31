#!/usr/bin/env tsx

import { generateObject, streamObject } from 'ai';
import { litellm } from './lib/litellm-provider';
import { z } from 'zod';
import { config } from 'dotenv';

// Load environment variables
config();

// Define command enumeration - simpler version
const CommandSchema = z.object({
  command: z.enum([
    'CREATE_ISSUE',
    'UPDATE_STATUS', 
    'SEND_NOTIFICATION',
    'QUERY_DATABASE',
    'EXECUTE_CODE',
    'NONE'
  ]),
  reason: z.string(),
  priority: z.enum(['low', 'medium', 'high'])
});

// Simple categorization schema
const CategoriesSchema = z.object({
  technical: z.array(z.string()),
  personal: z.array(z.string()),
  summary: z.string()
});

async function testSimpleStructured() {
  console.log('🧪 Testing simple structured output...\n');
  
  const message = "Create an issue about the login bug, it's urgent!";
  
  try {
    const { object } = await generateObject({
      model: litellm('claude-3-7-sonnet'),
      schema: CommandSchema,
      prompt: `Extract the command from this message: "${message}". Determine what action should be taken.`,
    });
    
    console.log('✅ Command extraction successful!');
    console.log('  Command:', object.command);
    console.log('  Reason:', object.reason);
    console.log('  Priority:', object.priority);
    console.log();
    
  } catch (error) {
    console.error('❌ Failed:', error);
  }
}

async function testStreamOfConsciousness() {
  console.log('🧪 Testing stream of consciousness categorization...\n');
  
  const stream = `
    Been debugging the auth system all morning, really frustrating. 
    Need to query the database for failed login attempts.
    Had too much coffee, feeling jittery. The code is messy and needs refactoring.
  `;
  
  try {
    const { object } = await generateObject({
      model: litellm('claude-3-7-sonnet'),
      schema: CategoriesSchema,
      prompt: `Categorize this stream of consciousness into technical and personal aspects: "${stream}"`,
    });
    
    console.log('✅ Categorization successful!');
    console.log('\n📁 Categories:');
    console.log('  Technical aspects:');
    object.technical.forEach(item => console.log('    •', item));
    console.log('\n  Personal aspects:');
    object.personal.forEach(item => console.log('    •', item));
    console.log('\n  Summary:', object.summary);
    console.log();
    
  } catch (error) {
    console.error('❌ Failed:', error);
  }
}

async function testStreamingCommands() {
  console.log('🧪 Testing streaming command detection...\n');
  
  const messages = [
    "Update the status of ticket #123 to done",
    "Just thinking about lunch",
    "Query how many active users we have today"
  ];
  
  for (const msg of messages) {
    try {
      console.log(`📨 Processing: "${msg}"`);
      
      const { partialObjectStream, object } = await streamObject({
        model: litellm('claude-3-7-sonnet'),
        schema: CommandSchema,
        prompt: `What command should be executed for: "${msg}"`,
      });
      
      // Get the final object
      const result = await object;
      console.log(`   → ${result.command} (${result.priority})\n`);
      
    } catch (error) {
      console.error(`   ❌ Failed:`, (error as Error).message);
    }
  }
}

async function main() {
  console.log('🚀 Simple Structured Output Test\n');
  console.log('=' .repeat(50));
  
  try {
    await testSimpleStructured();
    await testStreamOfConsciousness();
    await testStreamingCommands();
    
    console.log('=' .repeat(50));
    console.log('✨ Tests completed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);