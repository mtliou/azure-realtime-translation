const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
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

// Enhanced logging
const logFile = path.join(__dirname, '../logs/websocket-server.log');
const logDir = path.dirname(logFile);

// Create logs directory if it doesn't exist
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// Logging function
function log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        level,
        message,
        data
    };
    
    // Console output with color coding
    const colors = {
        INFO: '\x1b[36m',
        WARN: '\x1b[33m',
        ERROR: '\x1b[31m',
        SUCCESS: '\x1b[32m',
        DEBUG: '\x1b[35m'
    };
    
    console.log(`${colors[level] || ''}[${timestamp}] [${level}] ${message}\x1b[0m`, data || '');
    
    // File output
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
}

// Session management
const sessions = new Map();
const translationService = require('./translation-service');

// Socket connection handling
io.on('connection', (socket) => {
    log('INFO', 'New client connected', { socketId: socket.id, ip: socket.handshake.address });
    
    // Speaker joins a session
    socket.on('speaker-join', (data) => {
        const { sessionCode, sourceLanguage, language, supportedLanguages } = data;
        log('INFO', 'Speaker joining session', { sessionCode, sourceLanguage, socketId: socket.id });
        
        // Create or update session
        let session = sessions.get(sessionCode);
        if (!session) {
            session = {
                speaker: null,
                listeners: new Map(),
                sourceLanguage: sourceLanguage || language || 'auto',
                supportedLanguages: supportedLanguages || [],
                created: Date.now(),
                messageCount: 0
            };
            sessions.set(sessionCode, session);
            log('SUCCESS', 'New session created', { sessionCode });
        }
        
        session.speaker = socket.id;
        session.sourceLanguage = sourceLanguage || language || 'auto';
        session.supportedLanguages = supportedLanguages || [];
        socket.join(`session-${sessionCode}`);
        
        log('SUCCESS', `Speaker joined session ${sessionCode}`, {
            sourceLanguage: session.sourceLanguage,
            listenersCount: session.listeners.size
        });
        
        // Notify all listeners in the session
        socket.to(`session-${sessionCode}`).emit('speaker-started', {
            sessionCode,
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
        log('INFO', 'Listener joining session', { sessionCode, targetLanguage, socketId: socket.id });
        
        const session = sessions.get(sessionCode);
        if (!session) {
            log('WARN', 'Session not found', { sessionCode });
            socket.emit('session-not-found');
            return;
        }
        
        // Add listener to session
        session.listeners.set(socket.id, {
            targetLanguage: targetLanguage,
            joinedAt: Date.now(),
            messagesReceived: 0
        });
        
        socket.join(`session-${sessionCode}`);
        
        log('SUCCESS', `Listener joined session ${sessionCode}`, {
            targetLanguage,
            totalListeners: session.listeners.size
        });
        
        // Send speaker info to new listener
        if (session.speaker) {
            socket.emit('speaker-started', {
                sessionCode,
                sourceLanguage: session.sourceLanguage,
                speakerId: session.speaker
            });
        }
        
        // Notify speaker about new listener
        if (session.speaker) {
            io.to(session.speaker).emit('listener-joined', {
                listenerId: socket.id,
                targetLanguage: targetLanguage,
                totalListeners: session.listeners.size
            });
        }
    });
    
    // Handle speech data from speaker (with streaming support)
    socket.on('speech-data', async (data) => {
        const { sessionCode, text, isFinal, language, timestamp, isStreaming, isSentence, isPartial } = data;
        const session = sessions.get(sessionCode);
        
        if (!session) {
            log('WARN', 'Session not found for speech data', { sessionCode });
            return;
        }
        
        if (session.speaker !== socket.id) {
            log('WARN', 'Speech data from non-speaker', { sessionCode, socketId: socket.id });
            return;
        }
        
        session.messageCount++;
        
        // Log streaming info
        const logData = {
            sessionCode,
            text: text.substring(0, 50) + '...',
            language,
            isFinal,
            isPartial,
            isStreaming,
            isSentence,
            listenersCount: session.listeners.size
        };
        
        if (isPartial) {
            log('DEBUG', `Partial transcript received (#${session.messageCount})`, logData);
        } else if (isStreaming || isSentence) {
            log('INFO', `Streaming sentence received (#${session.messageCount})`, logData);
        } else {
            log('DEBUG', `Speech data received (#${session.messageCount})`, logData);
        }
        
        // Store last known language for this session
        if (language && language !== 'unknown' && language !== 'bilingual') {
            session.lastKnownLanguage = language;
        }
        
        // Determine source language
        let sourceLang = language;
        if (!sourceLang || sourceLang === 'unknown' || sourceLang === 'bilingual') {
            sourceLang = session.lastKnownLanguage || session.sourceLanguage || 'en-US';
        }
        
        // Translate for each listener
        const translationPromises = Array.from(session.listeners.entries()).map(async ([listenerId, listener]) => {
            try {
                listener.messagesReceived++;
                
                // Skip translation if same language
                if (sourceLang === listener.targetLanguage) {
                    log('DEBUG', 'Same language, skipping translation', {
                        sourceLang,
                        targetLang: listener.targetLanguage
                    });
                    
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
                
                log('DEBUG', `Translating message #${listener.messagesReceived}`, {
                    from: sourceLang,
                    to: listener.targetLanguage,
                    textLength: text.length
                });
                
                // Use ultra-low latency for streaming sentences
                const startTime = Date.now();
                const translation = (isStreaming || isSentence || !isFinal)
                    ? await translationService.translateTextUltraLowLatency(text, sourceLang, listener.targetLanguage)
                    : await translationService.translateText(text, sourceLang, listener.targetLanguage);
                
                const translationTime = Date.now() - startTime;
                
                log('SUCCESS', `Translation completed in ${translationTime}ms`, {
                    original: text.substring(0, 30) + '...',
                    translated: translation.substring(0, 30) + '...',
                    time: translationTime
                });
                
                // Send translation to listener with streaming flags
                io.to(listenerId).emit('translation', {
                    originalText: text,
                    translatedText: translation,
                    timestamp: timestamp,
                    isFinal: isFinal,
                    isPartial: isPartial,
                    isStreaming: isStreaming,
                    isSentence: isSentence,
                    sourceLanguage: sourceLang,
                    targetLanguage: listener.targetLanguage
                });
                
            } catch (error) {
                log('ERROR', 'Translation failed', {
                    error: error.message,
                    sourceLang,
                    targetLang: listener.targetLanguage
                });
                
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
    
    // Handle speaker stop
    socket.on('speaker-stop', (data) => {
        const { sessionCode } = data;
        const session = sessions.get(sessionCode);
        
        if (session && session.speaker === socket.id) {
            log('INFO', 'Speaker stopped', {
                sessionCode,
                totalMessages: session.messageCount,
                duration: Date.now() - session.created
            });
            
            socket.to(`session-${sessionCode}`).emit('speaker-stopped', {
                sessionCode
            });
        }
    });
    
    // Handle listener language change
    socket.on('listener-language-change', (data) => {
        const { sessionCode, targetLanguage } = data;
        const session = sessions.get(sessionCode);
        
        if (session && session.listeners.has(socket.id)) {
            const listener = session.listeners.get(socket.id);
            listener.targetLanguage = targetLanguage;
            
            log('INFO', 'Listener changed language', {
                sessionCode,
                newLanguage: targetLanguage,
                socketId: socket.id
            });
        }
    });
    
    // Handle TTS completion events from listeners
    socket.on('tts-completed', (data) => {
        log('SUCCESS', 'TTS playback completed', {
            sessionCode: data.sessionCode,
            text: data.text,
            language: data.language,
            voice: data.voice,
            socketId: socket.id
        });
        
        // Broadcast to monitoring clients
        io.emit('tts-completed', data);
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
        log('INFO', 'Client disconnected', { socketId: socket.id });
        
        // Remove from all sessions
        sessions.forEach((session, sessionCode) => {
            if (session.speaker === socket.id) {
                log('WARN', 'Speaker disconnected from session', {
                    sessionCode,
                    totalMessages: session.messageCount
                });
                
                // Notify listeners
                socket.to(`session-${sessionCode}`).emit('speaker-stopped', {
                    sessionCode
                });
                
                // Clean up session if no listeners
                if (session.listeners.size === 0) {
                    sessions.delete(sessionCode);
                    log('INFO', 'Session cleaned up', { sessionCode });
                }
            } else if (session.listeners.has(socket.id)) {
                const listener = session.listeners.get(socket.id);
                log('INFO', 'Listener left session', {
                    sessionCode,
                    messagesReceived: listener.messagesReceived
                });
                
                session.listeners.delete(socket.id);
                
                // Notify speaker
                if (session.speaker) {
                    io.to(session.speaker).emit('listener-left', {
                        listenerId: socket.id,
                        remainingListeners: session.listeners.size
                    });
                }
            }
        });
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    const sessionCount = sessions.size;
    const activeListeners = Array.from(sessions.values())
        .reduce((sum, session) => sum + session.listeners.size, 0);
    
    res.json({
        status: 'healthy',
        sessions: sessionCount,
        activeListeners,
        uptime: process.uptime()
    });
});

// Session stats endpoint
app.get('/stats', (req, res) => {
    const stats = Array.from(sessions.entries()).map(([code, session]) => ({
        code,
        hasSpeaker: !!session.speaker,
        listeners: session.listeners.size,
        sourceLanguage: session.sourceLanguage,
        messageCount: session.messageCount,
        created: new Date(session.created).toISOString()
    }));
    
    res.json(stats);
});

const PORT = process.env.WEBSOCKET_PORT || 3004;

server.listen(PORT, () => {
    log('SUCCESS', `Enhanced WebSocket server running on port ${PORT}`);
    log('INFO', 'Logging to', { logFile });
    log('INFO', 'Health check available at', { url: `http://localhost:${PORT}/health` });
    log('INFO', 'Stats available at', { url: `http://localhost:${PORT}/stats` });
});