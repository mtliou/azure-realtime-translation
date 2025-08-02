# Real-time Translation Setup Guide

## Overview
This guide explains how to set up real translations instead of mock translations in the bilingual demos.

## The Translation Issue

Currently, you may see mock translations like `[fr] Hello` instead of actual French translations. This happens because:

1. The Azure Translator service requires a separate API key
2. Without this key, the system falls back to mock translations
3. The bilingual demos need to use the WebSocket server for real translations

## Setting Up Real Translations

### Step 1: Get Azure Translator Key

1. Go to [Azure Portal](https://portal.azure.com)
2. Create a new "Translator" resource
3. Copy your key and region from the resource's "Keys and Endpoint" page

### Step 2: Update Environment Configuration

Edit the `.env` file and add your Translator credentials:

```bash
# Existing Speech configuration
SPEECH_KEY=your_speech_key_here
SPEECH_REGION=eastus

# Add these lines for translation
TRANSLATOR_KEY=your_translator_key_here
TRANSLATOR_REGION=eastus
```

### Step 3: Restart Servers

After updating the `.env` file, restart both servers:

```bash
# Stop servers with Ctrl+C, then:
npm run server      # Express server on port 3003
npm run websocket   # WebSocket server on port 3004
```

## Testing Real Translations

### Using the New Bilingual Real-time Demo

1. Open `http://localhost:8080/public/bilingual-realtime-translation.html`
2. Start broadcasting - you'll see a session code like "AB12"
3. Open `http://localhost:8080/public/listener-realtime.html` in another tab
4. Enter the session code and select your target language
5. Speak in French or English - you should hear real translations!

### Features of the Real-time Translation Demo

- **Chunking Strategies**: Translates after 3-7 words, not waiting for silence
- **Multiple Strategies**:
  - Word count based
  - Clause boundary detection
  - Punctuation-based
  - Smart hybrid approach
- **Early TTS**: Starts speaking translations while you're still talking
- **Real Translations**: Uses Azure Translator API for accurate translations

## Simultaneous Translation Implementation

The new system implements truly simultaneous translation by:

1. **Chunking Speech**: Breaking speech into smaller segments (3-15 words)
2. **Early Triggering**: Starting translation and TTS before silence is detected
3. **Smart Boundaries**: Using linguistic cues to determine optimal chunk boundaries
4. **Parallel Processing**: Processing multiple chunks simultaneously

## Troubleshooting

### Still Seeing Mock Translations?

1. **Check the logs** in the WebSocket server terminal:
   - If you see "Translation API error", your key might be invalid
   - Look for "Mock translation" messages

2. **Verify your Translator key**:
   - Make sure you copied the full key (32 characters)
   - Ensure the region matches your Translator resource

3. **Test the translation service**:
   ```bash
   curl http://localhost:3004/health
   ```

### Low Translation Quality?

- Increase the minimum chunk size in the UI settings
- Use the "Clause Boundary" or "Punctuation-based" strategies
- These wait for more natural breaking points

### High Latency?

- Use the "Word Count" strategy with 3-5 words minimum
- Enable "Immediate playback" in the listener settings
- This bypasses the queue for instant TTS

## Architecture Overview

```
Speaker (bilingual-realtime-translation.html)
    ↓ (Speech chunks via WebSocket)
WebSocket Server (port 3004)
    ↓ (Calls translation service)
Translation Service (uses Azure Translator API)
    ↓ (Returns translated text)
Listener (listener-realtime.html)
    ↓ (Synthesizes to speech)
Audio Output
```

## Key Differences from Previous Demos

1. **Real Translations**: Uses actual Azure Translator API
2. **Early TTS**: Doesn't wait for silence to start speaking
3. **Chunking**: Intelligently breaks speech into translatable segments
4. **WebSocket Integration**: Properly uses the server infrastructure
5. **Multiple Strategies**: Configurable chunking approaches

## Performance Optimization

For best performance:

1. Use a wired internet connection
2. Place speaker and listener on different devices
3. Use headphones on the listener side to prevent feedback
4. Adjust chunk size based on your speaking pace
5. Use the "Hybrid" strategy for balanced performance

## Next Steps

- Experiment with different chunking strategies
- Adjust TTS speech rate for faster output
- Try different language pairs
- Test with multiple simultaneous listeners