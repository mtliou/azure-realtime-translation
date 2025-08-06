# Azure Speech Translation Demos

Real-time speech-to-speech translation system with ultra-low latency streaming capabilities. Built with Azure Cognitive Services for bilingual conferences and live translation scenarios.

## 🚀 Features

- **Ultra-Low Latency**: <50ms streaming with sentence-level translation
- **Bilingual Support**: Optimized for French Canadian ↔ English translation
- **Real-Time TTS**: Immediate text-to-speech playback with queue management
- **Auto Language Detection**: Automatic detection of FR-CA/EN-CA/EN-US
- **WebSocket Streaming**: Real-time bidirectional communication
- **Voice Visualization**: Advanced audio visualizers and monitoring

## 📋 Prerequisites

- Node.js 14+ and npm
- Azure Cognitive Services subscription
- Azure Speech Service API key
- (Optional) Azure Translator API key for enhanced translation

## 🔧 Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/azure-speech-translation-demos.git
cd azure-speech-translation-demos
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Create a `.env` file in the root directory:
```env
# Azure Speech Service (REQUIRED)
SPEECH_KEY=your_azure_speech_key_here
SPEECH_REGION=eastus

# Azure Translator (Optional - for enhanced translation)
TRANSLATOR_KEY=your_azure_translator_key_here
TRANSLATOR_REGION=eastus

# Server Configuration
PORT=3001
WEBSOCKET_PORT=3004
```

⚠️ **Security Note**: Never commit `.env` file to version control!

## 🎯 Quick Start - Speaker & Listener Pages

### Starting the Servers

1. **Start the main Express server** (handles token exchange and API):
```bash
npm run server
```
This starts the server on `http://localhost:3001`

2. **Start the WebSocket server** (handles real-time streaming):
```bash
npm run websocket
```
This starts the WebSocket server on port 3004

3. **Start both servers simultaneously**:
```bash
npm run dev
```

### 🎙️ Speaker Page (Broadcaster)

The speaker page captures speech, performs real-time transcription, and broadcasts to all connected listeners.

1. **Open the speaker page**:
   ```
   http://localhost:3001/speaker-streaming.html
   ```

2. **Start a broadcasting session**:
   - Click **"Start Session"** to generate a unique 4-character session code (e.g., "ABCD")
   - Share this code with listeners who want to receive translations
   - Select your source language:
     - **Auto-detect** (recommended) - Automatically detects FR-CA/EN-CA/EN-US
     - French Canadian (fr-CA)
     - English Canadian (en-CA)
     - English US (en-US)
   - Click **"Start Broadcasting"** to begin speech capture

3. **While speaking**:
   - Speak naturally in French or English
   - The system detects sentence boundaries and streams them immediately
   - Monitor real-time metrics:
     - Sentence counter
     - Chunk counter (for smart phrase detection)
     - Average latency
     - Session duration

4. **Features**:
   - **Sentence Streaming**: Sends complete sentences as soon as detected
   - **Smart Chunking**: Breaks long phrases at natural pause points
   - **Parallel Processing**: Optimizes for minimal latency
   - **Live Transcript**: Shows what's being captured and sent

### 🎧 Listener Page (Receiver)

The listener page receives translations and plays them through text-to-speech.

1. **Open the listener page**:
   ```
   http://localhost:3001/listener-streaming.html
   ```

2. **Join a session**:
   - Enter the 4-character **session code** from the speaker
   - Select your **preferred language** for translation:
     - English
     - French
     - Spanish
     - German
     - Italian
     - Portuguese
     - Chinese (Simplified)
     - Japanese
   - Click **"Join Session"**

3. **Receiving translations**:
   - Translations appear instantly as the speaker talks
   - **Automatic TTS playback** with neural voices
   - **Visual indicators**:
     - Green bars show audio is playing
     - Queue display shows pending sentences
     - Latency metrics show network performance
   - **Real-time stats**:
     - Sentences received
     - TTS played count
     - Queue size
     - Average delay

## 📱 Additional Pages

### Central Dashboard
Access all features from one place:
```
http://localhost:3001/dashboard.html
```
- Quick links to speaker/listener pages
- System performance metrics
- Feature overview

### System Monitor
Real-time monitoring of all active sessions:
```
http://localhost:3001/monitor-dashboard.html
```
- View all active sessions
- Monitor TTS events
- Track performance metrics
- Debug connection issues

### Voice Visualizer
Advanced audio visualization:
```
http://localhost:3001/voice-visualizer.html
```
- Spectrum analyzer
- Waveform display
- Circular visualizer
- Particle effects

## 🏢 Conference Setup

For multi-hour conferences with bilingual speakers:

### Pre-Conference Checklist

1. **Test the system** at least 1 day before:
   - Run a 30-minute test session
   - Verify both languages work
   - Test with actual conference network

2. **Enable optimizations** on speaker page:
   - ✅ Sentence Streaming (enabled by default)
   - ✅ Smart Chunking (enabled by default)
   - ✅ Parallel Processing (enabled by default)

3. **Network requirements**:
   - Stable internet (minimum 1 Mbps up/down)
   - Low latency to Azure region (<100ms)
   - Wired connection for speakers (not WiFi)

4. **Browser setup**:
   - Use Chrome 90+ or Edge 90+ (best performance)
   - Allow microphone permissions
   - Disable browser extensions that might interfere

### During the Conference

1. **Start early**:
   - Launch servers 30 minutes before
   - Test speaker/listener connection
   - Have backup session codes ready

2. **Monitor continuously**:
   - Keep monitor dashboard open
   - Watch for connection drops
   - Monitor latency metrics

3. **Have backups**:
   - Secondary server ready
   - Local recording as backup
   - Technical support on standby

## 🧪 Testing

### Test Connection
```bash
# Test Azure Speech Service
node test-translation.js
```

### Test Full System
1. Open speaker page in Chrome
2. Open listener page in another browser/device
3. Test phrases:
   - French: "Bonjour, comment allez-vous aujourd'hui?"
   - English: "Hello, how are you today?"
4. Verify translation appears and audio plays

## 🐛 Troubleshooting

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| **"Failed to start translation: 401"** | Check SPEECH_KEY in .env file |
| **"Cannot connect to WebSocket"** | Start WebSocket server: `npm run websocket` |
| **No audio on listener page** | Check browser audio permissions |
| **High latency (>1 second)** | Check network connection to Azure region |
| **Session code not working** | Ensure WebSocket server is running |
| **Language not detected** | Speak more clearly, check microphone quality |

### Server Logs

Check logs for debugging:
```bash
# Express server logs
tail -f express-server.log

# WebSocket server logs  
tail -f websocket-server.log

# Or see console output directly
npm run dev
```

## 🏗️ Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Speaker   │────▶│  WebSocket   │────▶│  Listener   │
│   Browser   │     │    Server    │     │   Browser   │
└─────────────┘     └──────────────┘     └─────────────┘
       │                    │                     │
       ▼                    ▼                     ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│Azure Speech │     │   Express    │     │ Azure TTS   │
│     SDK     │     │    Server    │     │     SDK     │
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                    ┌──────────────┐
                    │Azure Translator│
                    │  (Optional)    │
                    └──────────────┘
```

## 📝 API Reference

### REST Endpoints
- `GET /api/get-speech-token` - Get temporary auth token
- `GET /api/translate` - Translate text (requires translator key)

### WebSocket Events
- `speaker-join` - Speaker connects with session code
- `listener-join` - Listener joins session
- `speech-data` - Streaming speech data
- `translation` - Translated content delivery
- `tts-completed` - TTS playback confirmation

## 🔒 Security Best Practices

1. **API Key Security**:
   - Never expose keys in client code
   - Use token exchange endpoint
   - Rotate keys regularly

2. **Production Deployment**:
   - Use HTTPS/WSS
   - Implement rate limiting
   - Add authentication layer
   - Configure CORS properly

3. **Data Privacy**:
   - Don't log sensitive content
   - Clear sessions after use
   - Implement data retention policies

## 📄 License

MIT License - See LICENSE file

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open pull request

## 🆘 Support

- Create GitHub issue for bugs
- Check troubleshooting guide
- Review server logs
- Test with provided test pages

---

Built with ❤️ using Azure Cognitive Services