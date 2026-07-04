// VAPID鍵ペアを生成するスクリプト
// Node.jsで実行: node scripts/generate-vapid-keys.js

const crypto = require('crypto');

function generateVAPIDKeys() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'prime256v1',
    publicKeyEncoding: {
      type: 'spki',
      format: 'der',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'der',
    },
  });

  const publicKeyBase64 = urlBase64Encode(publicKey);
  const privateKeyBase64 = urlBase64Encode(privateKey);

  console.log('\n========================================');
  console.log('VAPID Keys Generated Successfully!');
  console.log('========================================\n');
  console.log('Public Key:');
  console.log(publicKeyBase64);
  console.log('\nPrivate Key:');
  console.log(privateKeyBase64);
  console.log('\n========================================');
  console.log('Setup Instructions:');
  console.log('========================================\n');
  console.log('1. Add to wrangler.json:');
  console.log('   "vars": {');
  console.log(`     "VAPID_PUBLIC_KEY": "${publicKeyBase64}"`);
  console.log('   }');
  console.log('\n2. Set private key as secret:');
  console.log('   wrangler secret put VAPID_PRIVATE_KEY');
  console.log('   Then paste:', privateKeyBase64);
  console.log('\n========================================\n');
}

function urlBase64Encode(buffer) {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

generateVAPIDKeys();
