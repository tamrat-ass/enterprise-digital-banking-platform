#!/usr/bin/env node

const bcrypt = require('bcryptjs');

async function test() {
  const password = 'TestPassword123!';
  
  console.log('🧪 Testing bcrypt hash formats...\n');
  
  for (let rounds = 10; rounds <= 12; rounds++) {
    try {
      const hash = await bcrypt.hash(password, rounds);
      const match = await bcrypt.compare(password, hash);
      
      console.log(`Rounds: ${rounds}`);
      console.log(`  Hash: ${hash}`);
      console.log(`  Verify: ${match ? '✅ PASS' : '❌ FAIL'}\n`);
    } catch (err) {
      console.log(`Rounds: ${rounds} - ERROR: ${err.message}\n`);
    }
  }
  
  process.exit(0);
}

test();
