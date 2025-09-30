const crypto = require('crypto');

function hashEmail(email) {
  const secret = process.env.EMAIL_HASH_SECRET || 'default-email-secret';
  return crypto
    .createHmac('sha256', secret)
    .update(email.toLowerCase())
    .digest('hex');
}

async function testEmailHash() {
  const email = 'test@example.com';
  const emailHash = hashEmail(email);
  
  console.log('Email:', email);
  console.log('Email Hash:', emailHash);
  console.log('Expected Hash: d1d1ed8ae92a5d9015fe4a7b8c489ca035c699c614a7fa9428e49cc344f6c29e');
  console.log('Match:', emailHash === 'd1d1ed8ae92a5d9015fe4a7b8c489ca035c699c614a7fa9428e49cc344f6c29e');
  
  // Test with different secrets
  console.log('\nTesting with different secrets:');
  const secrets = ['default-email-secret', 'bloodnode-email-hash-secret-2024'];
  secrets.forEach(secret => {
    const hash = crypto.createHmac('sha256', secret).update(email.toLowerCase()).digest('hex');
    console.log(`Secret: ${secret} -> Hash: ${hash}`);
  });
}

testEmailHash().catch(console.error);