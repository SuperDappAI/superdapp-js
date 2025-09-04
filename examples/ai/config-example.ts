import { loadModel, AIConfigError } from '../src/ai';

/**
 * Example demonstrating how to use the AI provider configuration loader
 */
async function exampleUsage() {
  try {
    // Example 1: Load from environment variables
    // Set these environment variables:
    // AI_PROVIDER=openai
    // AI_MODEL=gpt-4
    // AI_API_KEY=your-api-key
    console.log('Loading model from environment variables...');
    const modelFromEnv = await loadModel();
    console.log('✅ Model loaded successfully from environment');

    // Example 2: Load with explicit configuration
    console.log('\nLoading model with explicit configuration...');
    const modelFromConfig = await loadModel({
      provider: 'openai',
      model: 'gpt-4',
      apiKey: 'sk-your-api-key-here',
      baseUrl: 'https://api.openai.com/v1', // Optional custom base URL
    });
    console.log('✅ Model loaded successfully with explicit config');

    // Example 3: Load Anthropic model
    console.log('\nLoading Anthropic model...');
    const anthropicModel = await loadModel({
      provider: 'anthropic',
      model: 'claude-3-sonnet-20240229',
      apiKey: 'your-anthropic-api-key',
    });
    console.log('✅ Anthropic model loaded successfully');

    // Example 4: Load Google model
    console.log('\nLoading Google model...');
    const googleModel = await loadModel({
      provider: 'google',
      model: 'gemini-pro',
      apiKey: 'your-google-api-key',
    });
    console.log('✅ Google model loaded successfully');

    // The loaded models are wrapped with aisdk() and ready to use
    // with the Vercel AI SDK in your SuperDapp agents
    
  } catch (error) {
    if (error instanceof AIConfigError) {
      console.error('❌ AI Configuration Error:', error.message);
      console.error('Error Code:', error.code);
      
      // Handle specific error types
      switch (error.code) {
        case 'INVALID_CONFIG':
          console.error('Please check your environment variables or configuration');
          break;
        case 'UNSUPPORTED_PROVIDER':
          console.error('Supported providers: openai, anthropic, google');
          break;
        case 'PROVIDER_LOAD_ERROR':
          console.error('Make sure the required AI SDK package is installed');
          break;
        default:
          console.error('Unknown configuration error');
      }
    } else {
      console.error('❌ Unexpected error:', error);
    }
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  exampleUsage().catch(console.error);
}

export { exampleUsage };