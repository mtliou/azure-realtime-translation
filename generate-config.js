// generate-config.js
require('dotenv').config({ path: '../../.env' });
const fs = require('fs'), path = require('path');
const { SPEECH_KEY, SPEECH_REGION } = process.env;
if (!SPEECH_KEY || !SPEECH_REGION) {
  console.error('Missing SPEECH_KEY or SPEECH_REGION in root .env'); process.exit(1);
}
const content = `
// Auto-generated; do not edit.
const subscriptionKey = "${SPEECH_KEY}";
const serviceRegion   = "${SPEECH_REGION}";
`;
fs.writeFileSync(path.join(__dirname, 'config.js'), content.trim());
console.log('✅ config.js generated');
