const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');

async function testPDFConversion() {
  try {
    // Login
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: 'Admin123!' }),
    });
    const loginData = await loginRes.json();
    const token = loginData.data.token;
    console.log('✓ Logged in');

    // Convert PDF
    const formData = new FormData();
    formData.append('file', fs.createReadStream('/tmp/test-conversion.pdf'));
    formData.append('includeMetadata', 'true');
    formData.append('extractTables', 'true');

    const convertRes = await fetch('http://localhost:3000/api/pdf/convert', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        ...formData.getHeaders(),
      },
      body: formData,
    });

    const result = await convertRes.json();

    console.log('Full result:', JSON.stringify(result, null, 2).substring(0, 500));

    if (result.success) {
      console.log('✓ Conversion successful!');
      console.log('  Total pages:', result.data.total_pages);
      console.log('  Source:', result.data.source);
      console.log('  Metadata included:', !!result.data.metadata);
      console.log('  First page text preview:', result.data.pages[0].text.substring(0, 50) + '...');
    } else {
      console.log('✗ Conversion failed:', result.message);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testPDFConversion();
