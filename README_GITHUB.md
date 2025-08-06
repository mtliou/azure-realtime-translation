# Azure Speech Translation Demos

Real-time speech-to-speech translation system with automatic language detection and ultra-low latency.

## Features

- 🎤 **Speaker Broadcasting**: Automatic language detection for 8+ languages
- 🎧 **Listener Receiving**: Real-time translation with text-to-speech
- 🌐 **Multi-Language Support**: English, French, Spanish, German, Italian, Portuguese, Chinese, Japanese
- ⚡ **Ultra-Low Latency**: Multiple implementations from 30ms to 300ms
- 📊 **System Monitoring**: Real-time monitoring dashboard with comprehensive logging

## Architecture

### Implementations

1. **Azure Direct Translation** (100-150ms latency) - RECOMMENDED
   - Uses Azure TranslationRecognizer API
   - Single API call for speech-to-speech translation
   - Preserves prosody and emotion

2. **WebRTC DataChannel** (30-50ms latency)
   - Peer-to-peer connection
   - Binary streaming support
   - For ultra-low latency requirements

3. **Current Implementation** (300-800ms latency)
   - Three-step pipeline: STT → Translation → TTS
   - Good for understanding the basic flow

## Quick Start

### Prerequisites

- Node.js 16+
- Azure Speech Service subscription
- Azure Translator subscription (optional)

### Installation

```bash
# Clone the repository
git clone [repository-url]
cd azure-speech-translation-demos

# Install dependencies
npm install

# Copy environment template and add your keys
cp .env.example .env
# Edit .env with your Azure credentials
```

### Configuration

Add your Azure credentials to `.env`:

```env
SPEECH_KEY=your-azure-speech-key
SPEECH_REGION=your-region
TRANSLATOR_KEY=your-translator-key
TRANSLATOR_REGION=your-region
```

### Running the Application

```bash
# Start both Express server and WebSocket server
npm run dev

# Or start servers individually
npm run server          # Express server on port 3001
node server/websocket-server-enhanced.js  # WebSocket on port 3004
```

### Access the Demos

- **Demo Index**: http://localhost:3001/demo-index.html
- **Speaker**: http://localhost:3001/speaker-auto-detect.html
- **Listener**: http://localhost:3001/listener-auto-receive.html
- **Monitor**: http://localhost:3001/monitor.html

## Usage

### Speaker-Listener Workflow

1. **Speaker**:
   - Open speaker page
   - Note the 4-character session code
   - Click "Start Broadcasting"
   - Speak in any supported language

2. **Listener**:
   - Open listener page
   - Enter the speaker's session code
   - Select your preferred language
   - Join session to receive translations

## Project Structure

```
├── public/                     # Frontend files
│   ├── speaker-auto-detect.html
│   ├── listener-auto-receive.html
│   ├── optimal-speech-translation.html
│   ├── webrtc-ultra-low-latency.html
│   ├── performance-comparison-dashboard.html
│   └── monitor.html
├── server/                     # Backend services
│   ├── index.js               # Express server
│   ├── websocket-server-enhanced.js
│   └── translation-service.js
├── logs/                      # Server logs
├── package.json
└── .env                       # Configuration (not in repo)
```

## API Endpoints

- `GET /api/get-speech-token` - Exchange API key for temporary token
- `POST /api/translate` - Text translation endpoint
- `GET /health` - WebSocket server health check
- `GET /stats` - Active session statistics

## WebSocket Events

### Speaker Events
- `speaker-join` - Join a session as speaker
- `speech-data` - Send speech transcription data
- `speaker-stop` - Stop broadcasting

### Listener Events
- `listener-join` - Join a session as listener
- `translation` - Receive translated text
- `listener-language-change` - Change target language

## Performance Metrics

| Implementation | Latency | Use Case |
|---------------|---------|----------|
| WebRTC DataChannel | 30-50ms | Gaming, critical real-time |
| Azure Direct | 100-150ms | Most applications (RECOMMENDED) |
| Current Pipeline | 300-800ms | Learning/debugging |

## Monitoring

The system includes comprehensive monitoring:

- Real-time session tracking
- Message flow visualization
- Performance metrics
- Color-coded logging
- Health status indicators

Access at: http://localhost:3001/monitor.html

## Security

- API keys never exposed to client
- Token-based authentication
- Session-based access control
- Environment variable configuration

## License

MIT

## Support

For issues or questions, please open a GitHub issue.