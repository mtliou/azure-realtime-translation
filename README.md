# Azure Speech Translation Demos

Real-time bilingual speech recognition and translation demos using Azure Cognitive Services Speech SDK.

## Features

- **Bilingual Speech Recognition**: Automatic detection of French Canadian and English speech
- **Real-time Translation**: Simultaneous translation to 12+ languages with ultra-low latency
- **Zero-Repetition TTS**: Advanced deduplication system ensures translations are spoken only once
- **Session-Based Architecture**: Speaker/listener model with WebSocket communication
- **Multiple Demo Implementations**: Progressive enhancements from basic to advanced features

## Prerequisites

* Azure Speech Service subscription key - [Try the speech service for free](https://docs.microsoft.com/azure/cognitive-services/speech-service/get-started)
* Azure Translator Service subscription key (for translation features)
* Node.js 14+ and npm
* Modern web browser (Chrome, Firefox, Safari, Edge)

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/mtliou/azure-speech-translation-demos.git
   cd azure-speech-translation-demos
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Azure credentials
   ```

4. **Start the servers**
   ```bash
   # Terminal 1: Express server for token exchange (port 3003)
   npm run server

   # Terminal 2: Socket.io server for real-time communication (port 3000)
   node server/websocket-server.js

   # Terminal 3: HTTP server for static files (port 8080)
   npm run http-server
   ```

5. **Access the demos**
   - Translation Demos Index: http://localhost:8080/public/translation-demos.html
   - Speaker (Bilingual): http://localhost:8080/public/speaker-bilingual-auto.html
   - Listener (Zero Repetition): http://localhost:8080/public/listener-zero-repetition.html

## Key Components

### Speaker Interface (`speaker-bilingual-auto.html`)
- Continuous bilingual speech recognition (French Canadian/English)
- Real-time transcription display
- Session code generation for listeners to join
- WebSocket broadcasting of recognized speech

### Listener Interface (`listener-zero-repetition.html`)
- Joins speaker sessions via session code
- Real-time translation to selected target language
- Advanced deduplication system prevents TTS repetition
- Support for 12+ target languages including:
  - Arabic, Chinese (Simplified/Traditional), French, German
  - Italian, Japanese, Korean, Portuguese, Russian, Spanish

### Zero-Repetition System
The listener implements a sophisticated deduplication system:
- **Content Fingerprinting**: Multiple hash types for robust duplicate detection
- **State Machine**: Tracks translation chunk lifecycle
- **Smart Buffering**: Configurable delays for stability
- **Metrics Tracking**: Real-time statistics on deduplication effectiveness

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│     Speaker     │────▶│  Socket.io Server │────▶│    Listener     │
│ (Bilingual STT) │     │   (Port 3000)    │     │ (Translation +  │
└─────────────────┘     └──────────────────┘     │      TTS)       │
         │                                        └─────────────────┘
         │                                                 │
         ▼                                                 ▼
┌─────────────────┐                              ┌─────────────────┐
│  Express Server │                              │ Azure Translator│
│  (Port 3003)    │                              │      API        │
│ Token Exchange  │                              └─────────────────┘
└─────────────────┘
```

## Demo Files

### Core Demos
- `speaker-bilingual-auto.html` - Bilingual speaker with auto language detection
- `listener-zero-repetition.html` - Listener with zero-repetition TTS system
- `listener-optimal-simultaneous.html` - Professional simultaneous translation
- `test-zero-repetition.html` - Test page for deduplication system

### Progressive Enhancement Demos
- `listener-multilingual-enhanced.html` - Enhanced multilingual support
- `listener-stable-translation.html` - Stability-focused implementation
- `listener-simultaneous-incremental.html` - Incremental speech approach

## Token Exchange Security

The application implements secure token exchange to protect Azure subscription keys:
- Speech keys are stored server-side in environment variables
- Express server exchanges keys for temporary tokens
- Client-side code uses tokens instead of subscription keys
- Tokens are ephemeral and time-limited

## Development

### Project Structure
```
├── server/
│   ├── index.js              # Express server for token exchange
│   ├── websocket-server.js   # Socket.io server for real-time comm
│   └── translation-service.js # Azure Translator integration
├── public/
│   ├── speaker-*.html        # Speaker interfaces
│   ├── listener-*.html       # Listener interfaces
│   └── microsoft.*.js        # Speech SDK bundle
├── .env                      # Environment variables (not in git)
└── package.json              # Dependencies and scripts
```

### Key Technologies
- Azure Cognitive Services Speech SDK
- Azure Translator API
- Socket.io for WebSocket communication
- Express.js for token exchange
- Vanilla JavaScript (no framework dependencies)

## Troubleshooting

1. **No audio from TTS**
   - Check browser console for errors
   - Ensure Azure Speech credentials are correct
   - Verify target language is selected

2. **Translation not working**
   - Confirm Azure Translator credentials in `.env`
   - Check WebSocket connection in browser console
   - Verify session code matches between speaker/listener

3. **Repetitive TTS playback**
   - Use `listener-zero-repetition.html` for best results
   - Enable debug mode to see deduplication in action
   - Check the test page for deduplication effectiveness

## License

This project is licensed under the MIT License. See LICENSE file for details.

## Acknowledgments

Built with Microsoft Azure Cognitive Services:
- [Speech SDK Documentation](https://docs.microsoft.com/azure/cognitive-services/speech-service/)
- [Translator Documentation](https://docs.microsoft.com/azure/cognitive-services/translator/)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.