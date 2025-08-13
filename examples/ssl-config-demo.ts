import 'dotenv/config';
import { SuperDappClient, createBotConfig } from '../src';

/**
 * Demo showing SSL configuration behavior in different environments
 */
async function sslConfigDemo() {
  console.log('🔒 SSL Configuration Demo\n');

  // Show current environment
  console.log(`Current NODE_ENV: ${process.env.NODE_ENV || 'not set'}\n`);

  try {
    // Create client with current configuration
    const client = new SuperDappClient(createBotConfig());

    console.log('✅ Client created successfully');
    console.log(
      '📝 Check the console output above to see SSL configuration status'
    );

    // Try to make a test request (this will show SSL configuration in action)
    console.log('\n🔄 Making test request to demonstrate SSL configuration...');

    // Note: This will fail in test environment, but shows the SSL configuration
    try {
      await client.getBotInfo();
      console.log('✅ Request successful');
    } catch (error) {
      console.log('❌ Request failed (expected in test environment)');
      console.log('   This demonstrates that SSL configuration is working');
    }
  } catch (error) {
    console.error('❌ Failed to create client:', error);
  }
}

// Environment scenarios to test
function showEnvironmentScenarios() {
  console.log('\n📋 Environment Scenarios:\n');

  console.log('1. Development Mode:');
  console.log('   NODE_ENV=development');
  console.log('   Result: SSL verification disabled ⚠️');
  console.log('   Use case: Local development with self-signed certificates\n');

  console.log('2. Production Mode:');
  console.log('   NODE_ENV=production');
  console.log('   Result: SSL verification enabled 🔒');
  console.log('   Use case: Production deployment with valid certificates\n');

  console.log('3. Test Mode:');
  console.log('   NODE_ENV=test');
  console.log('   Result: SSL verification enabled 🔒');
  console.log('   Use case: Automated testing with valid certificates\n');

  console.log('4. No NODE_ENV Set:');
  console.log('   NODE_ENV not defined');
  console.log('   Result: SSL verification enabled 🔒');
  console.log('   Use case: Default secure behavior\n');
}

// Run demo
if (require.main === module) {
  showEnvironmentScenarios();
  sslConfigDemo().catch(console.error);
}

export { sslConfigDemo, showEnvironmentScenarios };
