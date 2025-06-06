import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function waitForService(url: string, maxRetries = 30, interval = 2000): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      // Use curl for compatibility across different Node environments
      await execAsync(`curl -f -s ${url}`);
      console.log(`✅ Service at ${url} is ready`);
      return;
    } catch (error) {
      // Service not ready yet
    }
    
    console.log(`⏳ Waiting for service at ${url} (attempt ${i + 1}/${maxRetries})`);
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`❌ Service at ${url} failed to become ready after ${maxRetries} attempts`);
}

async function globalSetup() {
  console.log('🐳 Starting containerized test environment...');
  
  try {
    // Stop any existing containers
    console.log('🧹 Cleaning up existing containers...');
    await execAsync('docker compose -f ../docker-compose.test.yml down -v').catch(() => {
      // Ignore errors if no containers exist
    });
    
    // Start services
    console.log('🚀 Starting test containers...');
    await execAsync('docker compose -f ../docker-compose.test.yml up -d --build');
    
    // Give containers time to fully start
    console.log('⏳ Waiting for containers to initialize...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Wait for services to be ready
    console.log('⏳ Waiting for services to be ready...');
    await Promise.all([
      waitForService('http://localhost:9192/health'),
      waitForService('http://localhost:3000'),
    ]);
    
    console.log('✅ Test environment is ready!');
    
    // Give services a moment to fully initialize
    await new Promise(resolve => setTimeout(resolve, 2000));
    
  } catch (error) {
    console.error('❌ Failed to start test environment:', error);
    
    // Cleanup on failure
    try {
      await execAsync('docker compose -f ../docker-compose.test.yml down -v');
    } catch (cleanupError) {
      console.error('Failed to cleanup after setup failure:', cleanupError);
    }
    
    throw error;
  }
}

export default globalSetup;