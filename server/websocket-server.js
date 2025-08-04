const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

// Session management
const sessions = new Map();
const translationService = require('./translation-service');

// Socket connection handling
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    
    // Speaker joins a session
    socket.on('speaker-join', (data) => {
        const { sessionCode, sourceLanguage, language, supportedLanguages } = data;
        
        // Create or update session
        let session = sessions.get(sessionCode);
        if (!session) {
            session = {
                speaker: null,
                listeners: new Map(),
                sourceLanguage: sourceLanguage || language || 'auto',
                supportedLanguages: supportedLanguages || [],
                created: Date.now()
            };
            sessions.set(sessionCode, session);
        }
        
        session.speaker = socket.id;
        session.sourceLanguage = sourceLanguage || language || 'auto';
        session.supportedLanguages = supportedLanguages || [];
        socket.join(`session-${sessionCode}`);
        
        console.log(`Speaker joined session ${sessionCode} with language ${session.sourceLanguage}`);
        
        // Notify all listeners in the session
        socket.to(`session-${sessionCode}`).emit('speaker-info', {
            sourceLanguage: session.sourceLanguage,
            supportedLanguages: session.supportedLanguages,
            speakerId: socket.id
        });
        
        // Update listener count
        socket.emit('listener-count', session.listeners.size);
    });
    
    // Listener joins a session
    socket.on('listener-join', (data) => {
        const { sessionCode, targetLanguage } = data;
        
        const session = sessions.get(sessionCode);
        if (!session) {
            socket.emit('session-not-found');
            return;
        }
        
        // Add listener to session
        session.listeners.set(socket.id, {
            targetLanguage: targetLanguage,
            joinedAt: Date.now()
        });
        
        socket.join(`session-${sessionCode}`);
        
        console.log(`Listener joined session ${sessionCode} for ${targetLanguage} translation`);
        
        // Send speaker info to new listener
        if (session.speaker) {
            socket.emit('speaker-info', {
                sourceLanguage: session.sourceLanguage,
                speakerId: session.speaker
            });
        }
        
        // Notify speaker about new listener
        if (session.speaker) {
            io.to(session.speaker).emit('listener-joined', {
                listenerId: socket.id,
                targetLanguage: targetLanguage
            });
        }
    });
    
    // Handle speech data (unified handler for test page)
    socket.on('speech-data', async (data) => {
        const { sessionCode, text, isFinal, language, timestamp } = data;
        const session = sessions.get(sessionCode);
        
        if (!session || session.speaker !== socket.id) return;
        
        console.log(`Speech data received: "${text}" [${language}] (final: ${isFinal})`);
        
        // Store last known language for this session
        if (language && language !== 'unknown' && language !== 'bilingual') {
            session.lastKnownLanguage = language;
        }
        
        // Determine source language - use last known if current is unknown
        let sourceLang = language;
        if (!sourceLang || sourceLang === 'unknown' || sourceLang === 'bilingual') {
            sourceLang = session.lastKnownLanguage || session.sourceLanguage || 'fr-CA';
        }
        
        // Translate for each listener
        const translationPromises = Array.from(session.listeners.entries()).map(async ([listenerId, listener]) => {
            try {
                // Skip translation if same language
                if (sourceLang === listener.targetLanguage) {
                    io.to(listenerId).emit('translation', {
                        originalText: text,
                        translatedText: text,
                        timestamp: timestamp,
                        isFinal: isFinal,
                        sourceLanguage: sourceLang,
                        targetLanguage: listener.targetLanguage
                    });
                    return;
                }
                
                console.log(`Translating from ${sourceLang} to ${listener.targetLanguage}`);
                
                // Use ultra-low latency translation for partial results
                const translation = isFinal 
                    ? await translationService.translateText(text, sourceLang, listener.targetLanguage)
                    : await translationService.translateTextUltraLowLatency(text, sourceLang, listener.targetLanguage);
                
                console.log(`Translation result: "${translation}"`);
                
                // Send translation to listener
                io.to(listenerId).emit('translation', {
                    originalText: text,
                    translatedText: translation,
                    timestamp: timestamp,
                    isFinal: isFinal,
                    sourceLanguage: sourceLang,
                    targetLanguage: listener.targetLanguage
                });
                
            } catch (error) {
                console.error('Translation error:', error);
                // Send original text on error
                io.to(listenerId).emit('translation', {
                    originalText: text,
                    translatedText: text,
                    timestamp: timestamp,
                    isFinal: isFinal,
                    sourceLanguage: sourceLang,
                    targetLanguage: listener.targetLanguage,
                    error: true
                });
            }
        });
        
        await Promise.all(translationPromises);
    });
    
    // Handle partial speech results
    socket.on('speech-partial', async (data) => {
        const { sessionCode, text, timestamp } = data;
        const session = sessions.get(sessionCode);
        
        if (!session || session.speaker !== socket.id) return;
        
        // Translate for each listener
        session.listeners.forEach(async (listener, listenerId) => {
            try {
                const translation = await translationService.translateText(
                    text,
                    session.sourceLanguage,
                    listener.targetLanguage
                );
                
                io.to(listenerId).emit('translation-data', {
                    original: text,
                    translation: translation,
                    timestamp: timestamp,
                    isFinal: false,
                    sourceLanguage: session.sourceLanguage,
                    targetLanguage: listener.targetLanguage
                });
            } catch (error) {
                console.error('Translation error:', error);
            }
        });
    });
    
    // Handle final speech results
    socket.on('speech-final', async (data) => {
        const { sessionCode, text, timestamp, confidence } = data;
        const session = sessions.get(sessionCode);
        
        if (!session || session.speaker !== socket.id) return;
        
        // Translate for each listener
        session.listeners.forEach(async (listener, listenerId) => {
            try {
                const translation = await translationService.translateText(
                    text,
                    session.sourceLanguage,
                    listener.targetLanguage
                );
                
                io.to(listenerId).emit('translation-data', {
                    original: text,
                    translation: translation,
                    timestamp: timestamp,
                    confidence: confidence,
                    isFinal: true,
                    sourceLanguage: session.sourceLanguage,
                    targetLanguage: listener.targetLanguage
                });
            } catch (error) {
                console.error('Translation error:', error);
            }
        });
    });
    
    // Handle ultra-low latency partial speech results
    socket.on('speech-partial-ultra', async (data) => {
        const { sessionCode, text, timestamp, sourceLanguage, confidence } = data;
        const session = sessions.get(sessionCode);
        
        if (!session || session.speaker !== socket.id) return;
        
        // Update session source language if bilingual
        if (sourceLanguage && session.sourceLanguage === 'bilingual-fr-en') {
            session.activeLanguage = sourceLanguage;
        }
        
        // Ultra-fast translation for each listener
        const translationPromises = Array.from(session.listeners.entries()).map(async ([listenerId, listener]) => {
            try {
                const startTime = Date.now();
                const sourceLang = sourceLanguage || session.sourceLanguage;
                console.log(`Translating: "${text}" from ${sourceLang} to ${listener.targetLanguage}`);
                
                const translation = await translationService.translateTextUltraLowLatency(
                    text,
                    sourceLang,
                    listener.targetLanguage
                );
                
                console.log(`Translation result: "${translation}"`);
                
                io.to(listenerId).emit('translation-data-ultra', {
                    original: text,
                    translation: translation,
                    timestamp: timestamp,
                    latency: Date.now() - startTime,
                    confidence: confidence,
                    isFinal: false,
                    sourceLanguage: sourceLang,
                    targetLanguage: listener.targetLanguage
                });
            } catch (error) {
                console.error('Ultra translation error:', error);
            }
        });
        
        // Process all translations in parallel
        await Promise.all(translationPromises);
    });
    
    // Handle ultra-low latency final speech results
    socket.on('speech-final-ultra', async (data) => {
        const { sessionCode, text, timestamp, sourceLanguage, confidence, cached } = data;
        const session = sessions.get(sessionCode);
        
        if (!session || session.speaker !== socket.id) return;
        
        // Update session source language if bilingual
        if (sourceLanguage && session.sourceLanguage === 'bilingual-fr-en') {
            session.activeLanguage = sourceLanguage;
        }
        
        // Ultra-fast translation for each listener
        const translationPromises = Array.from(session.listeners.entries()).map(async ([listenerId, listener]) => {
            try {
                const startTime = Date.now();
                
                // Skip translation if cached
                let translation;
                if (cached) {
                    translation = text; // Already processed
                } else {
                    translation = await translationService.translateTextUltraLowLatency(
                        text,
                        sourceLanguage || session.sourceLanguage,
                        listener.targetLanguage
                    );
                }
                
                io.to(listenerId).emit('translation-data-ultra', {
                    original: text,
                    translation: translation,
                    timestamp: timestamp,
                    latency: Date.now() - startTime,
                    confidence: confidence,
                    isFinal: true,
                    cached: cached,
                    sourceLanguage: sourceLanguage || session.sourceLanguage,
                    targetLanguage: listener.targetLanguage
                });
            } catch (error) {
                console.error('Ultra translation error:', error);
            }
        });
        
        // Process all translations in parallel
        await Promise.all(translationPromises);
    });
    
    // Speaker stops broadcasting
    socket.on('speaker-stop', (data) => {
        const { sessionCode } = data;
        const session = sessions.get(sessionCode);
        
        if (session && session.speaker === socket.id) {
            socket.to(`session-${sessionCode}`).emit('speaker-disconnected');
        }
    });
    
    // Listener leaves session
    socket.on('listener-leave', (data) => {
        const { sessionCode } = data;
        const session = sessions.get(sessionCode);
        
        if (session && session.listeners.has(socket.id)) {
            session.listeners.delete(socket.id);
            
            // Notify speaker
            if (session.speaker) {
                io.to(session.speaker).emit('listener-left', {
                    listenerId: socket.id
                });
            }
        }
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        
        // Check if this was a speaker
        sessions.forEach((session, sessionCode) => {
            if (session.speaker === socket.id) {
                // Notify all listeners
                socket.to(`session-${sessionCode}`).emit('speaker-disconnected');
                
                // Clean up session after a delay
                setTimeout(() => {
                    if (sessions.get(sessionCode)?.speaker === socket.id) {
                        sessions.delete(sessionCode);
                        console.log(`Session ${sessionCode} removed`);
                    }
                }, 30000); // 30 seconds grace period
            }
            
            // Check if this was a listener
            if (session.listeners.has(socket.id)) {
                session.listeners.delete(socket.id);
                
                // Notify speaker
                if (session.speaker) {
                    io.to(session.speaker).emit('listener-left', {
                        listenerId: socket.id
                    });
                }
            }
        });
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        activeSessions: sessions.size,
        timestamp: new Date().toISOString()
    });
});

// Session info endpoint
app.get('/sessions/:code', (req, res) => {
    const session = sessions.get(req.params.code);
    if (!session) {
        return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json({
        sessionCode: req.params.code,
        hasSpeaker: !!session.speaker,
        listenerCount: session.listeners.size,
        sourceLanguage: session.sourceLanguage,
        created: new Date(session.created).toISOString()
    });
});

// Clean up old sessions periodically
setInterval(() => {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hour
    
    sessions.forEach((session, code) => {
        if (now - session.created > maxAge && !session.speaker) {
            sessions.delete(code);
            console.log(`Cleaned up old session: ${code}`);
        }
    });
}, 5 * 60 * 1000); // Every 5 minutes

const PORT = process.env.WEBSOCKET_PORT || 3004;

server.listen(PORT, () => {
    console.log(`WebSocket server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
});