#!/usr/bin/env node

const http = require('http');

const data = JSON.stringify({
  email: 'tame@gamil.com',
  password: 'TestPassword123!'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/signin',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('🔐 Testing sign-in endpoint...\n');

const req = http.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log(`Status Code: ${res.statusCode}`);
    console.log('\nResponse Headers:');
    Object.entries(res.headers).forEach(([key, value]) => {
      if (key.includes('cookie') || key.includes('auth')) {
        console.log(`  ${key}: ${value}`);
      }
    });
    console.log('\nResponse Body:');
    try {
      const body = JSON.parse(responseData);
      console.log(JSON.stringify(body, null, 2));
      
      if (res.statusCode === 200) {
        console.log('\n✅ Sign-in successful!');
      } else {
        console.log(`\n❌ Sign-in failed with status ${res.statusCode}`);
      }
    } catch (e) {
      console.log(responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
  console.log('\n⚠️ Make sure the development server is running on http://localhost:3000');
  process.exit(1);
});

req.write(data);
req.end();
