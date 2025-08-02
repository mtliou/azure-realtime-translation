# Azure Speech Translation Demos

This repository contains multiple real-time speech translation demos using Azure Cognitive Services Speech SDK.

## Available Demos

### 1. Ultra-Low Latency Bilingual Translation (`bilingual-ultra-low-latency.html`)
Cutting-edge translation system optimized for French Canadian/English bilingual speakers.
- **Features**: 
  - Automatic language detection between French Canadian and English
  - Sub-200ms end-to-end latency
  - Dual recognition streams running in parallel
  - Phrase caching for common expressions
  - Predictive synthesis
  - Hardware acceleration support
- **Best for**: Bilingual speakers who switch between languages naturally
- **URL**: http://localhost:8080/public/bilingual-ultra-low-latency.html

### 2. Simultaneous Translation (`simultaneous-translation.html`)
Ultra-low latency translation that starts synthesizing while the speaker is still talking.
- **Features**: Chunked translation, overlap handling, configurable parameters
- **Best for**: Real-time conversations where minimal delay is critical
- **URL**: http://localhost:8080/public/simultaneous-translation.html

### 2. Speaker/Listener System (`speaker.html` + `listener.html`)
Distributed translation system for presentations and meetings.
- **Speaker**: Broadcasts speech in source language
- **Listener**: Receives translations in their preferred language
- **Features**: Session-based rooms, multiple listeners, live captions
- **URLs**: 
  - Speaker: http://localhost:8080/public/speaker.html
  - Listener: http://localhost:8080/public/listener.html

### 3. Real-Time Translation (`realtime-translation.html`)
Traditional continuous translation with complete utterance processing.
- **Features**: Higher accuracy, multiple language pairs, neural voices
- **Best for**: Scenarios where accuracy is more important than latency
- **URL**: http://localhost:8080/public/realtime-translation.html

## Setup Instructions

### Prerequisites
1. Azure Speech Services subscription key and region
2. Node.js installed
3. `.env` file with credentials:
   ```
   SPEECH_KEY=your_azure_speech_key_here
   SPEECH_REGION=your_azure_region_here
   ```

### Running the Demos

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the Express token server (port 3003):**
   ```bash
   npm run server
   ```

3. **Start the WebSocket server (port 3004):**
   ```bash
   npm run websocket
   ```

4. **Start the HTTP server (port 8080):**
   ```bash
   npx http-server -p 8080
   ```

5. **Access the demos:**
   - Main page: http://localhost:8080/public/translation-demos.html
   - Individual demos via the links above

## Architecture

### Token Exchange Pattern
- Express server on port 3003 exchanges Azure API keys for temporary tokens
- Prevents client-side exposure of sensitive credentials
- Tokens are ephemeral and time-limited

### WebSocket Communication
- Real-time bidirectional communication for speaker/listener system
- Session-based room management
- Automatic translation routing based on listener preferences

### Translation Pipeline
1. **Speech Recognition**: Converts speech to text using Azure Speech SDK
2. **Translation**: Uses Azure Translator API for text translation
3. **Speech Synthesis**: Converts translated text back to speech
4. **Streaming**: Delivers audio with minimal latency

## Key Technologies
- Azure Cognitive Services Speech SDK
- Azure Translator API
- Socket.IO for WebSocket communication
- Express.js for backend services
- Neural TTS voices for natural speech output

## Performance Considerations
- **Ultra-Low Latency Bilingual**: <200ms total latency (with optimizations)
- **Simultaneous Translation**: ~300-500ms latency
- **Speaker/Listener**: ~500-800ms end-to-end latency
- **Traditional Translation**: 1-2 second latency (more accurate)

### Ultra-Low Latency Optimizations
1. **Dual Recognition Streams**: French Canadian and English recognizers run in parallel
2. **Phrase Caching**: Common phrases translated instantly from memory
3. **Predictive Synthesis**: Start speaking before full translation completes
4. **Hardware Acceleration**: GPU/NPU utilization when available
5. **Network Optimization**: WebRTC DataChannel, QUIC protocol support

## Troubleshooting

### Common Issues
1. **"Failed to get authorization token"**: Check Express server is running on port 3003
2. **"Session not found"**: Ensure WebSocket server is running on port 3004
3. **No audio output**: Check browser permissions for microphone access
4. **Translation not working**: Verify Azure credentials in `.env` file

### Server Status Check
- Express API: http://localhost:3003/api/get-speech-token
- WebSocket Health: http://localhost:3004/health
- Main Demo Page: http://localhost:8080/public/translation-demos.html