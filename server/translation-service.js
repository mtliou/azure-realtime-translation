const axios = require('axios');
require('dotenv').config();

class TranslationService {
    constructor() {
        this.endpoint = `https://api.cognitive.microsofttranslator.com`;
        this.subscriptionKey = process.env.TRANSLATOR_KEY || process.env.SPEECH_KEY;
        this.region = process.env.TRANSLATOR_REGION || process.env.SPEECH_REGION || 'eastus';
        
        // Cache for translations to reduce API calls
        this.cache = new Map();
        this.cacheMaxSize = 1000;
        this.cacheMaxAge = 5 * 60 * 1000; // 5 minutes
    }
    
    // Convert speech language codes to translator language codes
    normalizeLanguageCode(speechLangCode, isTarget = false) {
        // Map speech recognition codes to translation codes
        const mappings = {
            'en-US': 'en',
            'en-CA': 'en',
            'es-ES': 'es',
            'fr-FR': 'fr',
            'fr-CA': 'fr',
            'de-DE': 'de',
            'it-IT': 'it',
            'pt-BR': 'pt',
            'zh-CN': 'zh-Hans',
            'ja-JP': 'ja',
            'ko-KR': 'ko',
            'ru-RU': 'ru',
            'ar-SA': 'ar',
            'hi-IN': 'hi'
        };
        
        // For source languages (with region)
        if (!isTarget && mappings[speechLangCode]) {
            return mappings[speechLangCode];
        }
        
        // For target languages (already normalized)
        if (isTarget) {
            return speechLangCode;
        }
        
        // Extract base language code if not found
        return speechLangCode.split('-')[0];
    }
    
    getCacheKey(text, from, to) {
        return `${from}:${to}:${text}`;
    }
    
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        if (Date.now() - cached.timestamp > this.cacheMaxAge) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.translation;
    }
    
    addToCache(key, translation) {
        // Limit cache size
        if (this.cache.size >= this.cacheMaxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        
        this.cache.set(key, {
            translation: translation,
            timestamp: Date.now()
        });
    }
    
    async translateText(text, sourceLanguage, targetLanguage) {
        if (!text || !text.trim()) return '';
        
        // Normalize language codes
        const fromLang = this.normalizeLanguageCode(sourceLanguage);
        const toLang = this.normalizeLanguageCode(targetLanguage, true);
        
        // Check if translation is needed
        if (fromLang === toLang) {
            return text;
        }
        
        // Check cache
        const cacheKey = this.getCacheKey(text, fromLang, toLang);
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            return cached;
        }
        
        try {
            const response = await axios({
                method: 'post',
                url: `${this.endpoint}/translate`,
                params: {
                    'api-version': '3.0',
                    'from': fromLang,
                    'to': toLang,
                    'textType': 'plain',
                    'profanityAction': 'NoAction'
                },
                headers: {
                    'Ocp-Apim-Subscription-Key': this.subscriptionKey,
                    'Ocp-Apim-Subscription-Region': this.region,
                    'Content-Type': 'application/json'
                },
                data: [{
                    'text': text
                }]
            });
            
            if (response.data && response.data[0] && response.data[0].translations) {
                const translation = response.data[0].translations[0].text;
                this.addToCache(cacheKey, translation);
                return translation;
            }
            
            return text; // Fallback to original
            
        } catch (error) {
            console.error('Translation API error:', error.response?.data || error.message);
            
            // For development/testing - return a mock translation
            if (!this.subscriptionKey || this.subscriptionKey === process.env.SPEECH_KEY) {
                return `[${toLang}] ${text}`;
            }
            
            return text; // Fallback to original
        }
    }
    
    // Batch translation for efficiency
    async translateBatch(texts, sourceLanguage, targetLanguage) {
        if (!texts || texts.length === 0) return [];
        
        const fromLang = this.normalizeLanguageCode(sourceLanguage);
        const toLang = this.normalizeLanguageCode(targetLanguage, true);
        
        if (fromLang === toLang) {
            return texts;
        }
        
        // Check cache and separate cached vs uncached
        const results = new Array(texts.length);
        const uncachedTexts = [];
        const uncachedIndices = [];
        
        texts.forEach((text, index) => {
            const cacheKey = this.getCacheKey(text, fromLang, toLang);
            const cached = this.getFromCache(cacheKey);
            
            if (cached) {
                results[index] = cached;
            } else {
                uncachedTexts.push({ text });
                uncachedIndices.push(index);
            }
        });
        
        // If all are cached, return immediately
        if (uncachedTexts.length === 0) {
            return results;
        }
        
        try {
            const response = await axios({
                method: 'post',
                url: `${this.endpoint}/translate`,
                params: {
                    'api-version': '3.0',
                    'from': fromLang,
                    'to': toLang,
                    'textType': 'plain',
                    'profanityAction': 'NoAction'
                },
                headers: {
                    'Ocp-Apim-Subscription-Key': this.subscriptionKey,
                    'Ocp-Apim-Subscription-Region': this.region,
                    'Content-Type': 'application/json'
                },
                data: uncachedTexts
            });
            
            if (response.data) {
                response.data.forEach((item, idx) => {
                    if (item.translations && item.translations[0]) {
                        const translation = item.translations[0].text;
                        const originalIndex = uncachedIndices[idx];
                        const originalText = texts[originalIndex];
                        
                        results[originalIndex] = translation;
                        
                        // Cache the result
                        const cacheKey = this.getCacheKey(originalText, fromLang, toLang);
                        this.addToCache(cacheKey, translation);
                    }
                });
            }
            
            return results;
            
        } catch (error) {
            console.error('Batch translation error:', error);
            return texts; // Fallback to original
        }
    }
    
    // Ultra-low latency translation method optimized for French Canadian/English
    async translateTextUltraLowLatency(text, sourceLanguage, targetLanguage) {
        if (!text || !text.trim()) return '';
        
        // Normalize language codes
        const fromLang = this.normalizeLanguageCode(sourceLanguage);
        const toLang = this.normalizeLanguageCode(targetLanguage, true);
        
        // Check if translation is needed
        if (fromLang === toLang) {
            return text;
        }
        
        // Ultra-fast cache check
        const cacheKey = this.getCacheKey(text, fromLang, toLang);
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            return cached;
        }
        
        // For French Canadian <-> English, use optimized phrase mapping
        if ((fromLang === 'fr' && toLang === 'en') || (fromLang === 'en' && toLang === 'fr')) {
            const quickTranslation = this.getQuickTranslation(text, fromLang, toLang);
            if (quickTranslation) {
                this.addToCache(cacheKey, quickTranslation);
                return quickTranslation;
            }
        }
        
        try {
            // Use faster API configuration for ultra-low latency
            const response = await axios({
                method: 'post',
                url: `${this.endpoint}/translate`,
                params: {
                    'api-version': '3.0',
                    'from': fromLang,
                    'to': toLang,
                    'textType': 'plain',
                    'profanityAction': 'NoAction',
                    'includeAlignment': false,
                    'includeSentenceLength': false
                },
                headers: {
                    'Ocp-Apim-Subscription-Key': this.subscriptionKey,
                    'Ocp-Apim-Subscription-Region': this.region,
                    'Content-Type': 'application/json',
                    'X-ClientTraceId': require('crypto').randomUUID()
                },
                data: [{
                    'text': text
                }],
                timeout: 200, // 200ms timeout for ultra-low latency
                maxRedirects: 0, // Skip redirects for speed
                decompress: false // Skip decompression for speed
            });
            
            if (response.data && response.data[0] && response.data[0].translations) {
                const translation = response.data[0].translations[0].text;
                this.addToCache(cacheKey, translation);
                return translation;
            }
            
            return text; // Fallback to original
            
        } catch (error) {
            // For timeout or error, use fallback translation
            if (error.code === 'ECONNABORTED' || error.response?.status === 429) {
                const fallback = this.getFallbackTranslation(text, fromLang, toLang);
                if (fallback) return fallback;
            }
            
            console.error('Ultra-low latency translation error:', error.message);
            return text; // Fallback to original
        }
    }
    
    // Quick translation lookup for common French Canadian <-> English phrases
    getQuickTranslation(text, fromLang, toLang) {
        const lowerText = text.toLowerCase().trim();
        
        // Common French Canadian to English phrases
        const frToEn = {
            'bonjour': 'hello',
            'bonsoir': 'good evening',
            'comment allez-vous': 'how are you',
            'comment ça va': 'how are you',
            'ça va bien': 'i am fine',
            'merci': 'thank you',
            'merci beaucoup': 'thank you very much',
            's\'il vous plaît': 'please',
            'excusez-moi': 'excuse me',
            'pardon': 'sorry',
            'oui': 'yes',
            'non': 'no',
            'peut-être': 'maybe',
            'je ne comprends pas': 'i don\'t understand',
            'parlez-vous anglais': 'do you speak english',
            'où est': 'where is',
            'combien ça coûte': 'how much does it cost',
            'l\'addition s\'il vous plaît': 'the bill please',
            'au revoir': 'goodbye',
            'à bientôt': 'see you soon',
            'bonne journée': 'have a good day'
        };
        
        // English to French Canadian phrases
        const enToFr = {
            'hello': 'bonjour',
            'hi': 'salut',
            'good morning': 'bon matin',
            'good evening': 'bonsoir',
            'how are you': 'comment allez-vous',
            'i am fine': 'je vais bien',
            'thank you': 'merci',
            'thank you very much': 'merci beaucoup',
            'please': 's\'il vous plaît',
            'excuse me': 'excusez-moi',
            'sorry': 'désolé',
            'yes': 'oui',
            'no': 'non',
            'maybe': 'peut-être',
            'i don\'t understand': 'je ne comprends pas',
            'do you speak french': 'parlez-vous français',
            'where is': 'où est',
            'how much': 'combien',
            'the bill please': 'l\'addition s\'il vous plaît',
            'goodbye': 'au revoir',
            'see you soon': 'à bientôt',
            'have a good day': 'bonne journée'
        };
        
        if (fromLang === 'fr' && toLang === 'en') {
            return frToEn[lowerText];
        } else if (fromLang === 'en' && toLang === 'fr') {
            return enToFr[lowerText];
        }
        
        return null;
    }
    
    // Fallback translation for common patterns
    getFallbackTranslation(text, fromLang, toLang) {
        // Simple word-by-word translation for numbers
        if (/^\d+$/.test(text)) {
            return text; // Numbers are universal
        }
        
        // For other languages, return a prefixed version
        const langPrefixes = {
            'es': '[ES]',
            'de': '[DE]',
            'it': '[IT]',
            'pt': '[PT]',
            'zh-Hans': '[ZH]',
            'ja': '[JA]',
            'ko': '[KO]',
            'ru': '[RU]',
            'ar': '[AR]',
            'hi': '[HI]'
        };
        
        const prefix = langPrefixes[toLang];
        if (prefix) {
            return `${prefix} ${text}`;
        }
        
        return null;
    }
}

module.exports = new TranslationService();