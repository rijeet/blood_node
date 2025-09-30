const crypto = require('crypto');

const targetHash = 'd1d1ed8ae92a5d9015fe4a7b8c489ca035c699c614a7fa9428e49cc344f6c29e';
const email = 'test@example.com';

// Test common secrets
const secrets = [
  'default-email-secret',
  'bloodnode-email-hash-secret-2024',
  'test-email-secret',
  'bloodnode-secret',
  'email-hash-secret'
];

console.log('Testing secrets to find the one that generates the target hash:');
console.log('Target hash:', targetHash);
console.log('Email:', email);
console.log('');

secrets.forEach(secret => {
  const hash = crypto.createHmac('sha256', secret).update(email.toLowerCase()).digest('hex');
  const match = hash === targetHash;
  console.log(`Secret: "${secret}" -> Hash: ${hash} ${match ? '✅ MATCH!' : ''}`);
});
