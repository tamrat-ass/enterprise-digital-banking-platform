const http = require('http');

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({ status: res.statusCode, data });
      });
    });

    req.on('error', reject);
    req.setTimeout(10000);
    req.end();
  });
}

async function test() {
  try {
    console.log('Adding pdf_path column to document_versions table...\n');
    
    const result = await makeRequest('/api/admin/add-pdf-path-column');
    const data = JSON.parse(result.data);
    
    if (data.success) {
      console.log('✓ Success!');
      console.log('- Message:', data.message);
      console.log('- Column verified:', data.verified);
      if (data.column) {
        console.log('- Column info:', data.column);
      }
    } else {
      console.log('✗ Error:', data.error);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

test();
