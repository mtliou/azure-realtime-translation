const express = require('express');
const https = require('https');
const fs = require('fs');
const WebSocket = require('ws');
const { RTCPeerConnection, RTCSessionDescription } = require('wrtc');
require('dotenv').config();

const app = express();
app.use(express.json());

// WebRTC configuration
const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
];

// Active peer connections
const peers = new Map();
const translationSessions = new Map();

// Azure Speech SDK setup
const sdk = require('microsoft-cognitiveservices-speech-sdk');

// WebSocket server for signaling
const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (ws, request) => {
    const sessionId = generateSessionId();
    console.log(`New WebRTC session: ${sessionId}`);
    
    // Create peer connection
    const pc = new RTCPeerConnection({ iceServers });
    peers.set(sessionId, { pc, ws });
    
    // Handle ICE candidates
    pc.onicecandidate = (event) => {
        if (event.candidate) {
            ws.send(JSON.stringify({
                type: 'ice-candidate',
                candidate: event.candidate
            }));
        }
    };
    
    // Handle data channel for ultra-low latency
    pc.ondatachannel = (event) => {
        const dataChannel = event.channel;
        console.log(`Data channel opened: ${dataChannel.label}`);
        
        dataChannel.onopen = () => {
            console.log('Data channel is open');
            setupTranslationPipeline(sessionId, dataChannel);
        };
        
        dataChannel.onmessage = (event) => {
            handleDataChannelMessage(sessionId, event.data);
        };
        
        dataChannel.onerror = (error) => {
            console.error('Data channel error:', error);
        };
    };
    
    // Handle audio track for speech processing
    pc.ontrack = (event) => {
        console.log(`Received ${event.track.kind} track`);
        if (event.track.kind === 'audio') {
            setupAudioProcessing(sessionId, event.track);
        }
    };
    
    // WebSocket message handling
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            
            switch (data.type) {
                case 'offer':
                    await handleOffer(sessionId, data.offer);
                    break;
                    
                case 'answer':
                    await handleAnswer(sessionId, data.answer);
                    break;
                    
                case 'ice-candidate':
                    await handleIceCandidate(sessionId, data.candidate);
                    break;
                    
                case 'configure':
                    configureTranslation(sessionId, data.config);
                    break;
                    
                case 'start-translation':
                    startTranslation(sessionId);
                    break;
                    
                case 'stop-translation':
                    stopTranslation(sessionId);
                    break;
                    
                default:
                    console.log('Unknown message type:', data.type);
            }
        } catch (error) {
            console.error('Error handling message:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: error.message
            }));
        }
    });
    
    ws.on('close', () => {
        console.log(`Session ${sessionId} closed`);
        cleanupSession(sessionId);
    });
    
    // Send session ID to client
    ws.send(JSON.stringify({
        type: 'session-created',
        sessionId: sessionId
    }));
});

async function handleOffer(sessionId, offer) {
    const peer = peers.get(sessionId);
    if (!peer) return;
    
    const { pc, ws } = peer;
    
    // Set remote description
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    
    // Create answer
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    
    // Send answer back
    ws.send(JSON.stringify({
        type: 'answer',
        answer: answer
    }));
}

async function handleAnswer(sessionId, answer) {
    const peer = peers.get(sessionId);
    if (!peer) return;
    
    await peer.pc.setRemoteDescription(new RTCSessionDescription(answer));
}

async function handleIceCandidate(sessionId, candidate) {
    const peer = peers.get(sessionId);
    if (!peer) return;
    
    await peer.pc.addIceCandidate(candidate);
}

function setupTranslationPipeline(sessionId, dataChannel) {
    // Create translation configuration
    const speechConfig = sdk.SpeechTranslationConfig.fromSubscription(
        process.env.SPEECH_KEY,
        process.env.SPEECH_REGION
    );
    
    // Store translation session
    translationSessions.set(sessionId, {
        config: speechConfig,
        dataChannel: dataChannel,
        recognizer: null,
        metrics: {
            startTime: Date.now(),
            packetsProcessed: 0,
            totalLatency: 0
        }
    });
}

function configureTranslation(sessionId, config) {
    const session = translationSessions.get(sessionId);
    if (!session) return;
    
    const { speechConfig } = session;
    
    // Configure source language
    speechConfig.speechRecognitionLanguage = config.sourceLanguage || 'en-US';
    
    // Add target languages
    if (config.targetLanguages) {
        config.targetLanguages.forEach(lang => {
            speechConfig.addTargetLanguage(lang);
        });
    }
    
    // Configure voice for synthesis
    if (config.voiceName) {
        speechConfig.voiceName = config.voiceName;
    }
    
    // Enable partial results for lower latency
    if (config.enablePartialResults) {
        speechConfig.enableWordLevelTimestamps = true;
    }
    
    // Update session configuration
    session.config = speechConfig;
    
    // Send confirmation
    const peer = peers.get(sessionId);
    if (peer && peer.ws) {
        peer.ws.send(JSON.stringify({
            type: 'configuration-updated',
            config: config
        }));
    }
}

function handleDataChannelMessage(sessionId, data) {
    const session = translationSessions.get(sessionId);
    if (!session) return;
    
    try {
        // Parse incoming audio data
        const audioData = new Uint8Array(data);
        const timestamp = Date.now();
        
        // Process through translation pipeline
        processAudioChunk(sessionId, audioData, timestamp);
        
        // Update metrics
        session.metrics.packetsProcessed++;
        
    } catch (error) {
        console.error('Error processing data channel message:', error);
    }
}

function processAudioChunk(sessionId, audioData, timestamp) {
    const session = translationSessions.get(sessionId);
    if (!session || !session.recognizer) return;
    
    // Feed audio to recognizer
    // Note: This is a simplified version - actual implementation would need
    // proper audio stream handling
    
    const processingStart = Date.now();
    
    // Process audio through Azure Speech SDK
    // (Implementation depends on SDK audio stream capabilities)
    
    const processingLatency = Date.now() - processingStart;
    
    // Send metrics back via data channel
    if (session.dataChannel && session.dataChannel.readyState === 'open') {
        session.dataChannel.send(JSON.stringify({
            type: 'metrics',
            timestamp: timestamp,
            processingLatency: processingLatency,
            totalPackets: session.metrics.packetsProcessed
        }));
    }
}

function setupAudioProcessing(sessionId, audioTrack) {
    const session = translationSessions.get(sessionId);
    if (!session) return;
    
    console.log(`Setting up audio processing for session ${sessionId}`);
    
    // Create audio stream from WebRTC track
    // This would require additional implementation to bridge WebRTC audio
    // to Azure Speech SDK audio input
}

function startTranslation(sessionId) {
    const session = translationSessions.get(sessionId);
    if (!session || !session.config) return;
    
    try {
        // Create push stream for audio input
        const pushStream = sdk.AudioInputStream.createPushStream();
        const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);
        
        // Create translation recognizer
        const recognizer = new sdk.TranslationRecognizer(session.config, audioConfig);
        
        // Setup event handlers
        recognizer.recognizing = (s, e) => {
            if (e.result.reason === sdk.ResultReason.TranslatingSpeech) {
                sendTranslationResult(sessionId, {
                    type: 'partial',
                    text: e.result.text,
                    translations: Array.from(e.result.translations),
                    timestamp: Date.now()
                });
            }
        };
        
        recognizer.recognized = (s, e) => {
            if (e.result.reason === sdk.ResultReason.TranslatedSpeech) {
                sendTranslationResult(sessionId, {
                    type: 'final',
                    text: e.result.text,
                    translations: Array.from(e.result.translations),
                    timestamp: Date.now()
                });
            }
        };
        
        recognizer.synthesizing = (s, e) => {
            if (e.result.reason === sdk.ResultReason.SynthesizingAudio) {
                sendAudioResult(sessionId, e.result.audio);
            }
        };
        
        // Start recognition
        recognizer.startContinuousRecognitionAsync(
            () => {
                console.log(`Translation started for session ${sessionId}`);
                session.recognizer = recognizer;
                session.pushStream = pushStream;
                
                // Notify client
                const peer = peers.get(sessionId);
                if (peer && peer.ws) {
                    peer.ws.send(JSON.stringify({
                        type: 'translation-started',
                        sessionId: sessionId
                    }));
                }
            },
            (error) => {
                console.error('Failed to start translation:', error);
                sendError(sessionId, error.message);
            }
        );
        
    } catch (error) {
        console.error('Error starting translation:', error);
        sendError(sessionId, error.message);
    }
}

function stopTranslation(sessionId) {
    const session = translationSessions.get(sessionId);
    if (!session || !session.recognizer) return;
    
    session.recognizer.stopContinuousRecognitionAsync(
        () => {
            console.log(`Translation stopped for session ${sessionId}`);
            
            // Clean up
            session.recognizer.close();
            session.recognizer = null;
            
            if (session.pushStream) {
                session.pushStream.close();
                session.pushStream = null;
            }
            
            // Notify client
            const peer = peers.get(sessionId);
            if (peer && peer.ws) {
                peer.ws.send(JSON.stringify({
                    type: 'translation-stopped',
                    sessionId: sessionId,
                    metrics: session.metrics
                }));
            }
        },
        (error) => {
            console.error('Error stopping translation:', error);
        }
    );
}

function sendTranslationResult(sessionId, result) {
    const session = translationSessions.get(sessionId);
    if (!session) return;
    
    // Send via data channel for ultra-low latency
    if (session.dataChannel && session.dataChannel.readyState === 'open') {
        const message = {
            type: 'translation',
            ...result,
            latency: Date.now() - result.timestamp
        };
        
        session.dataChannel.send(JSON.stringify(message));
        
        // Update metrics
        session.metrics.totalLatency += message.latency;
    }
    
    // Also send via WebSocket as fallback
    const peer = peers.get(sessionId);
    if (peer && peer.ws && peer.ws.readyState === WebSocket.OPEN) {
        peer.ws.send(JSON.stringify({
            type: 'translation-result',
            ...result
        }));
    }
}

function sendAudioResult(sessionId, audioData) {
    const session = translationSessions.get(sessionId);
    if (!session) return;
    
    // Send synthesized audio via data channel
    if (session.dataChannel && session.dataChannel.readyState === 'open') {
        // Send audio in chunks for streaming
        const chunkSize = 4096;
        for (let i = 0; i < audioData.byteLength; i += chunkSize) {
            const chunk = audioData.slice(i, Math.min(i + chunkSize, audioData.byteLength));
            session.dataChannel.send(chunk);
        }
    }
}

function sendError(sessionId, errorMessage) {
    const peer = peers.get(sessionId);
    if (peer && peer.ws) {
        peer.ws.send(JSON.stringify({
            type: 'error',
            message: errorMessage
        }));
    }
}

function cleanupSession(sessionId) {
    // Stop translation if active
    stopTranslation(sessionId);
    
    // Clean up peer connection
    const peer = peers.get(sessionId);
    if (peer) {
        if (peer.pc) {
            peer.pc.close();
        }
        peers.delete(sessionId);
    }
    
    // Clean up translation session
    const session = translationSessions.get(sessionId);
    if (session) {
        if (session.recognizer) {
            session.recognizer.close();
        }
        if (session.pushStream) {
            session.pushStream.close();
        }
        translationSessions.delete(sessionId);
    }
}

function generateSessionId() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        activeSessions: peers.size,
        translationSessions: translationSessions.size,
        timestamp: new Date().toISOString()
    });
});

// Session metrics endpoint
app.get('/metrics/:sessionId', (req, res) => {
    const session = translationSessions.get(req.params.sessionId);
    if (!session) {
        return res.status(404).json({ error: 'Session not found' });
    }
    
    const uptime = Date.now() - session.metrics.startTime;
    const avgLatency = session.metrics.packetsProcessed > 0 
        ? session.metrics.totalLatency / session.metrics.packetsProcessed 
        : 0;
    
    res.json({
        sessionId: req.params.sessionId,
        uptime: uptime,
        packetsProcessed: session.metrics.packetsProcessed,
        averageLatency: avgLatency,
        isActive: !!session.recognizer
    });
});

// Create HTTPS server for secure WebRTC
const serverOptions = {
    key: process.env.SSL_KEY ? fs.readFileSync(process.env.SSL_KEY) : null,
    cert: process.env.SSL_CERT ? fs.readFileSync(process.env.SSL_CERT) : null
};

const server = process.env.SSL_KEY && process.env.SSL_CERT
    ? https.createServer(serverOptions, app)
    : require('http').createServer(app);

// Handle WebSocket upgrade
server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});

const PORT = process.env.WEBRTC_PORT || 3005;

server.listen(PORT, () => {
    console.log(`WebRTC Translation Server running on port ${PORT}`);
    console.log(`WebSocket endpoint: ws${process.env.SSL_KEY ? 's' : ''}://localhost:${PORT}`);
    console.log(`Health check: http${process.env.SSL_KEY ? 's' : ''}://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing server...');
    
    // Close all sessions
    peers.forEach((peer, sessionId) => {
        cleanupSession(sessionId);
    });
    
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});