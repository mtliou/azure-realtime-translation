# 🚀 Quick Setup Guide - Speech-to-Speech Translation System

This guide will help you get the speaker/listener translation system running in under 5 minutes.

## Prerequisites

- **Node.js** (version 16 or higher)
- **Azure Speech Service account** (free tier works)
- **Modern browser** (Chrome, Edge, Safari, or Firefox)

## Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/mtliou/azure-speech-translation-system.git
cd azure-speech-translation-system

# Install dependencies
npm install
```

## Step 2: Configure Azure Credentials

### Option A: Create Azure Account (if you don't have one)
1. Go to [Azure Portal](https://portal.azure.com)
2. Create a free account (includes $200 credit)
3. Create a Speech Service resource:
   - Search for "Speech" in the marketplace
   - Click "Create"
   - Choose your subscription and resource group
   - Select a region (e.g., `eastus`)
   - Choose pricing tier (F0 is free)
   - Click "Review + create"
4. Once created, go to "Keys and Endpoint"
5. Copy Key 1 and the region

### Option B: Use Existing Azure Credentials
1. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Azure credentials:
   ```env
   # Azure Speech Service (REQUIRED)
   SPEECH_KEY=your-actual-speech-key-here
   SPEECH_REGION=eastus  # or your region

   # Azure Translator (OPTIONAL - for better translation)
   TRANSLATOR_KEY=your-translator-key-here
   TRANSLATOR_REGION=eastus

   # Server ports (keep defaults)
   PORT=3001
   WEBSOCKET_PORT=3004
   ```

## Step 3: Start the Servers

You need to run TWO servers for the system to work:

### Option 1: Start Both Servers Together (Recommended)
```bash
npm run dev
```

### Option 2: Start Servers Individually (in separate terminals)

**Terminal 1 - Express Server:**
```bash
npm run server
# This starts the main server on http://localhost:3001
```

**Terminal 2 - WebSocket Server:**
```bash
node server/websocket-server-enhanced.js
# This starts the WebSocket server on port 3004
```

You should see:
```
✅ Express server running on port 3001
✅ Enhanced WebSocket server running on port 3004
```

## Step 4: Open the Speaker/Listener Pages

### 🎤 Speaker Page (Person Speaking)

1. Open browser and go to: **http://localhost:3001/speaker-auto-detect.html**
2. You'll see a 4-character session code (e.g., "ABCD")
3. Click **"Start Broadcasting"**
4. Allow microphone access when prompted
5. Start speaking in any language - it will auto-detect!

**Features:**
- Automatic language detection (8+ languages)
- Real-time transcription display
- Visual waveform of your voice
- Session statistics

### 🎧 Listener Page (Person Receiving Translation)

1. Open another browser tab/window
2. Go to: **http://localhost:3001/listener-auto-receive.html**
3. Enter the speaker's 4-character session code
4. Select your preferred language from dropdown
5. Click **"Join Session"**
6. You'll receive real-time translations with automatic text-to-speech!

**Features:**
- Real-time translation to your chosen language
- Text-to-speech playback (enabled by default)
- Option to see original text alongside translation
- Choose different TTS voices

## Step 5: Test the System

### Quick Test Workflow:
1. **Speaker**: Say "Hello, how are you?" in English
2. **Listener**: Should see translation in their chosen language
3. **Speaker**: Switch to another language (e.g., Spanish: "Hola, ¿cómo estás?")
4. **System**: Automatically detects language change and translates

### Supported Languages:
- 🇺🇸 English (US/Canada)
- 🇫🇷 French (France/Canada)
- 🇪🇸 Spanish
- 🇩🇪 German
- 🇮🇹 Italian
- 🇵🇹 Portuguese
- 🇨🇳 Chinese (Mandarin)
- 🇯🇵 Japanese

## 📊 Monitoring Dashboard (Optional)

To monitor the system in real-time:
1. Open: **http://localhost:3001/monitor.html**
2. View:
   - Active sessions
   - Message flow
   - System logs
   - Performance metrics

## 🏠 Demo Index Page

For easy access to all features:
- Open: **http://localhost:3001/demo-index.html**
- This page lists all available demos and implementations

## Troubleshooting

### "Authentication Failed" Error
- Ensure your Azure credentials in `.env` are correct
- Check that you're using the actual key, not the key name
- Verify the region matches your Azure resource

### "Cannot Connect" Error
- Make sure both servers are running (Express on 3001, WebSocket on 3004)
- Check firewall settings aren't blocking the ports
- Try using Chrome or Edge browsers

### No Sound/TTS Not Working
- Check browser permissions for audio
- Ensure TTS is enabled (checkbox on listener page)
- Try selecting a different voice

### Microphone Not Working
- Allow microphone permission when prompted
- Check system microphone settings
- Ensure no other app is using the microphone

## Common Commands

```bash
# Install dependencies
npm install

# Start both servers
npm run dev

# Start Express server only
npm run server

# Start WebSocket server only
node server/websocket-server-enhanced.js

# View logs
tail -f logs/websocket-server.log

# Check server health
curl http://localhost:3004/health
```

## Quick URLs Reference

| Page | URL | Purpose |
|------|-----|---------|
| Speaker | http://localhost:3001/speaker-auto-detect.html | Broadcast speech |
| Listener | http://localhost:3001/listener-auto-receive.html | Receive translations |
| Monitor | http://localhost:3001/monitor.html | System monitoring |
| Demo Index | http://localhost:3001/demo-index.html | All demos |

## Tips for Best Experience

1. **Use headphones** on the listener side to avoid feedback
2. **Speak clearly** and pause between sentences for best recognition
3. **Test with multiple languages** to see auto-detection in action
4. **Open monitor** to see what's happening behind the scenes
5. **Try different voices** in the listener TTS settings

## Need Help?

- Check the monitor page for system logs
- Ensure both servers show as "healthy"
- Verify Azure credentials are correctly set
- Try the setup guide page: http://localhost:3001/setup-guide.html

---

**Ready to go!** Open the speaker page in one window and listener in another to experience real-time speech translation! 🎉