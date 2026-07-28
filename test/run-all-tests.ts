import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { runPrismaTest } from './test-prisma';
import { runCloudinaryTest } from './test-cloudinary';
import { runWebSocketTest } from './test-websocket';

async function main() {
  console.log('================================================================');
  console.log('🚀 CIVICPULSE AUTOMATED SYSTEM & INTEGRATION TEST SUITE');
  console.log('================================================================');

  let wsProcess: ChildProcess | null = null;

  try {
    // 1. Launch WebSocket server for test execution
    console.log('📡 Starting background WebSocket server (ws://localhost:3001)...');
    wsProcess = spawn('npx', ['tsx', 'server/ws-server.ts'], {
      cwd: process.cwd(),
      stdio: 'pipe',
      shell: true
    });

    // Wait 2 seconds for WS server to boot
    await new Promise((r) => setTimeout(r, 2000));

    // 2. Run Test 1: Prisma DB ChatMessage Schema
    const prismaOk = await runPrismaTest();

    // 3. Run Test 2: Cloudinary Upload
    const cloudinaryOk = await runCloudinaryTest();

    // 4. Run Test 3: WebSocket Connection, GPS Mapping & DB Persistence
    const wsOk = await runWebSocketTest();

    console.log('================================================================');
    console.log('📊 TEST SUITE SUMMARY RESULTS');
    console.log('================================================================');
    console.log(`1. Prisma DB Schema & Instance Connection : ${prismaOk ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`2. Cloudinary Upload & CDN HTTPS URL      : ${cloudinaryOk ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`3. WebSocket Connection & GPS DB Messaging : ${wsOk ? '✅ PASSED' : '❌ FAILED'}`);
    console.log('================================================================');

    const allPassed = prismaOk && cloudinaryOk && wsOk;
    if (allPassed) {
      console.log('🎉 ALL TESTS PASSED SUCCESSFULLY! SYSTEM IS HEALTHY AND READY.\n');
    } else {
      console.error('⚠️ SOME TESTS FAILED. PLEASE REVIEW LOGS ABOVE.\n');
    }

    if (wsProcess) {
      wsProcess.kill();
    }

    process.exit(allPassed ? 0 : 1);
  } catch (err) {
    console.error('Test runner execution error:', err);
    if (wsProcess) (wsProcess as ChildProcess).kill();
    process.exit(1);
  }
}

main();
