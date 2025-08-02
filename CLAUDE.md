# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development Setup
```bash
# Install dependencies
npm install

# Start the Express server (runs on port 3001)
npm run server

# Start both server and frontend development
npm run dev
```

### Configuration
Before running the sample:
1. Copy your Azure Speech Service credentials to `.env`:
   - `SPEECH_KEY`: Your Azure Speech subscription key
   - `SPEECH_REGION`: Your Azure Speech region (e.g., eastus, westus)

2. Update the `authorizationEndpoint` in HTML files if not using localhost:
   - Default: `http://localhost:3003/api/get-speech-token`

## Architecture

### Core Components

1. **Token Exchange Service** (`server/index.js`)
   - Express server running on port 3003
   - Endpoint `/api/get-speech-token` exchanges Speech API key for temporary tokens (port 3003)
   - Prevents client-side exposure of Speech subscription keys
   - Returns token + region for client-side Speech SDK initialization

2. **Client-Side Applications**
   - **Speech Recognition** (`public/index.html`): Speech-to-text, translation, intent recognition
   - **Speech Synthesis** (`public/synthesis.html`): Text-to-speech with voice selection
   - **Avatar Service** (`avatar/`): Real-time TTS avatar with video streaming
     - `basic.html`: Basic avatar interaction
     - `chat.html`: Full chat experience with STT + OpenAI + Avatar
   - **Dialog Service** (`dialog/`): Voice assistant integration via Direct Line Speech

### Security Architecture
- Speech keys are never exposed to the browser
- Server-side token exchange pattern using `SpeechConfig.fromAuthorizationToken()` instead of `fromSubscription()`
- Tokens are ephemeral and time-limited
- Production deployments should add user authentication to the token endpoint

### Key Dependencies
- `microsoft-cognitiveservices-speech-sdk`: Core Speech SDK
- `axios`: HTTP client for token requests and API calls
- `express`: Backend server for token exchange
- `dotenv`: Environment variable management

### Avatar Service Architecture
The avatar samples demonstrate advanced integration patterns:
- WebRTC for real-time video streaming
- Optional background transparency with real-time matting
- Support for custom avatars and voices
- Auto-reconnection capability
- Integration with Azure OpenAI for chat scenarios

### Important Files
- `.env`: Contains Speech API credentials (never commit this)
- `server/index.js`: Token exchange server
- `public/index.html`: Main speech recognition demo
- `public/synthesis.html`: Speech synthesis demo
- `avatar/js/basic.js`: Avatar connection and control logic
- `avatar/js/chat.js`: Full chat integration with STT/TTS/OpenAI