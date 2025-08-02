#!/usr/bin/env node
require('dotenv').config();
const translationService = require('./server/translation-service');

async function testTranslations() {
    console.log('Testing Azure Translation Service...\n');
    
    const testCases = [
        { text: 'السلام عليكم', from: 'ar-SA', to: 'en', expected: 'Peace be upon you' },
        { text: 'كيف حالكم اليوم؟', from: 'ar-SA', to: 'en', expected: 'How are you today?' },
        { text: 'Hello, how are you?', from: 'en-US', to: 'ar', expected: 'مرحبا كيف حالك؟' },
        { text: 'Bonjour', from: 'fr-CA', to: 'en', expected: 'Hello' },
        { text: 'Thank you', from: 'en-US', to: 'fr', expected: 'Merci' }
    ];
    
    console.log('Configuration:');
    console.log('- Translator Key:', process.env.TRANSLATOR_KEY ? '✓ Set' : '✗ Not set');
    console.log('- Region:', process.env.TRANSLATOR_REGION || 'eastus');
    console.log('- Using key:', process.env.TRANSLATOR_KEY ? process.env.TRANSLATOR_KEY.substring(0, 8) + '...' : 'None');
    console.log('\n');
    
    for (const test of testCases) {
        try {
            console.log(`Testing: "${test.text}" (${test.from} → ${test.to})`);
            const result = await translationService.translateText(test.text, test.from, test.to);
            console.log(`Result: "${result}"`);
            console.log(`Expected: "${test.expected}"`);
            console.log(`Status: ${result.toLowerCase().includes(test.expected.toLowerCase()) ? '✓ Pass' : '✗ Different'}`);
            console.log('---');
        } catch (error) {
            console.log(`Error: ${error.message}`);
            console.log('---');
        }
    }
}

testTranslations().catch(console.error);