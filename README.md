# Real-Time Speech-to-Speech Translation System

A professional real-time speech translation system that enables seamless communication across language barriers using Azure Cognitive Services.

## 📚 Quick Setup Guides

- **[QUICK_START.md](QUICK_START.md)** - Get speaker/listener pages running in 2 minutes! ⚡
- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Comprehensive setup with troubleshooting 🔧

## Features

- 🎙️ **Real-time speech recognition** with automatic language detection (French Canadian & English)
- 🌐 **Live translation** to multiple target languages
- 🔊 **Text-to-Speech output** with natural neural voices
- 📡 **WebSocket-based streaming** for minimal latency
- 💻 **Professional UI** with real-time metrics and status indicators
- 🔐 **Secure token-based authentication** (no API keys in client code)

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Azure Cognitive Services subscription with:
  - Speech Services
  - Translator Services

## Quick Start

### 1. Clone the repository

```bash
git clone [your-repo-url]
cd [repo-name]
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy `.env.example` to `.env` and add your Azure credentials:

```bash
cp .env.example .env
```

Edit `.env` with your Azure credentials:
```
SPEECH_KEY=your_azure_speech_key
SPEECH_REGION=your_azure_region
TRANSLATOR_KEY=your_azure_translator_key
TRANSLATOR_REGION=your_azure_region
```

### 4. Start the servers

```bash
# Make the script executable (first time only)
chmod +x start-all-servers.sh

# Start both Express and WebSocket servers
./start-all-servers.sh
```

The servers will start on:
- Express server: http://localhost:3001
- WebSocket server: ws://localhost:3004

## Usage

### Main Interface
Open http://localhost:3001/main-index.html to access the main page with links to all components.

### Speaker (Broadcaster)
1. Open http://localhost:3001/speaker-professional.html
2. Click "Start Session" to generate a session code
3. Click "Start Broadcasting" to begin speech recognition
4. Speak in French Canadian or English - the system will auto-detect

### Listener (Translator)
1. Open http://localhost:3001/listener-professional.html
2. Enter the session code from the speaker
3. Select your target language (e.g., Spanish, German, Japanese)
4. Click "Join Session" to receive live translations
5. Translations will be spoken automatically via TTS

### Testing Connection
Open http://localhost:3001/test-speech-connection.html to verify Speech SDK connectivity.

## Project Structure

```
.
├── server/
│   ├── index.js              # Express server for token exchange
│   └── websocket-server.js   # WebSocket server for real-time communication
├── public/
│   ├── speaker-professional.html    # Speaker/broadcaster interface
│   ├── listener-professional.html   # Listener/translator interface
│   ├── test-speech-connection.html  # Connection testing utility
│   └── main-index.html             # Main navigation page
├── package.json              # Node.js dependencies
├── start-all-servers.sh      # Server startup script
├── .env.example             # Environment variables template
└── README.md                # This file
```

## Key Files Explained

### `server/index.js`
Express server that:
- Serves static files from the public directory
- Provides `/api/get-speech-token` endpoint for secure token exchange
- Prevents exposure of Azure API keys to the client

### `server/websocket-server.js`
WebSocket server that:
- Manages real-time communication between speakers and listeners
- Handles translation requests using Azure Translator
- Manages session creation and participant tracking
- Implements smart language detection and fallback logic

### `public/speaker-professional.html`
Speaker interface featuring:
- Automatic language detection (French Canadian & English)
- Real-time speech recognition with partial results
- Session code generation for listeners to join
- Professional UI with metrics display

### `public/listener-professional.html`
Listener interface featuring:
- Session joining via code
- Multiple target language selection
- Streaming TTS with smart text segmentation
- Queue management for smooth audio playback

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     Speaker     │────▶│ WebSocket Server│────▶│    Listener     │
│  (Browser/Mic)  │     │   (Port 3004)   │     │ (Browser/TTS)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                         │
         │                       │                         │
         ▼                       ▼                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Speech SDK     │     │ Azure Translator│     │  Speech SDK     │
│ (Recognition)   │     │      API        │     │    (TTS)        │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Supported Languages

### Source Languages (Auto-detected)
- French Canadian (fr-CA)
- English US (en-US)

### Target Languages
- Spanish (es-ES)
- English US (en-US)
- French France (fr-FR)
- German (de-DE)
- Italian (it-IT)
- Portuguese Brazil (pt-BR)
- Japanese (ja-JP)
- Chinese Mandarin (zh-CN)

## Troubleshooting

### WebSocket connection fails
- Ensure both servers are running (check with `lsof -Pi :3001,3004`)
- Check firewall settings
- Verify WebSocket server is on port 3004

### Speech recognition not working
- Check microphone permissions in browser
- Verify Azure Speech credentials in `.env`
- Test connection using http://localhost:3001/test-speech-connection.html

### No translation happening
- Verify Azure Translator credentials in `.env`
- Check WebSocket server logs: `tail -f websocket-server.log`
- Ensure source and target languages are different

### TTS not playing
- Check browser audio permissions
- Verify target language is supported
- Check browser console for errors

## Development

### Running servers individually

```bash
# Express server only
node server/index.js

# WebSocket server only
node server/websocket-server.js
```

### Viewing logs

```bash
# Express server logs
tail -f express-server.log

# WebSocket server logs
tail -f websocket-server.log
```

### Adding new languages

1. Add language option in `listener-professional.html`
2. Add voice mapping in `getVoiceForLanguage()` function
3. Update language detection array in `speaker-professional.html` if adding source languages

## Security Notes

- Never commit `.env` file with real credentials
- API keys are exchanged for tokens server-side
- Tokens are time-limited and region-specific
- Consider adding authentication for production use

## License

This project uses Azure Cognitive Services which requires appropriate licensing.

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review server logs for errors
3. Test individual components using the test pages
4. Ensure all Azure services are properly configured