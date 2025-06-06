import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function globalTeardown() {
  console.log('🧹 Cleaning up test environment...');
  
  try {
    // Stop and remove containers, networks, and volumes
    await execAsync('docker compose -f ../docker-compose.test.yml down -v');
    console.log('✅ Test environment cleaned up successfully');
  } catch (error) {
    console.error('❌ Failed to cleanup test environment:', error);
    // Don't throw - cleanup failures shouldn't fail the test run
  }
}

export default globalTeardown;