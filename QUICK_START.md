# ⚡ Quick Start - Speaker/Listener Translation

Get the real-time translation system running in 2 minutes!

## 1️⃣ Install & Configure (One Time Setup)

```bash
# Clone repo
git clone https://github.com/mtliou/azure-speech-translation-system.git
cd azure-speech-translation-system

# Install packages
npm install

# Setup Azure credentials
cp .env.example .env
# Edit .env and add your Azure Speech key and region
```

## 2️⃣ Start the System

```bash
# Start both servers with one command
npm run dev
```

Wait for:
- ✅ Express server running on http://localhost:3001
- ✅ WebSocket server running on port 3004

## 3️⃣ Open Speaker & Listener Pages

### Speaker (Person Talking)
1. Open: **http://localhost:3001/speaker-auto-detect.html**
2. Note the **4-letter code** shown (e.g., "ABCD")
3. Click **"Start Broadcasting"**
4. Allow microphone access
5. Start speaking (any language!)

### Listener (Person Receiving Translation)
1. Open: **http://localhost:3001/listener-auto-receive.html**
2. Enter the speaker's **4-letter code**
3. Choose your preferred language
4. Click **"Join Session"**
5. Hear translations in real-time!

## 📺 Visual Guide

```
SPEAKER SIDE                    LISTENER SIDE
┌─────────────────┐            ┌─────────────────┐
│  Session: ABCD  │            │ Enter Code: ABCD│
│                 │            │                 │
│ 🎤 Speaking...  │  =====>   │ 🔊 Hola...     │
│ "Hello..."      │            │ (Spanish)       │
└─────────────────┘            └─────────────────┘
```

## 🌍 Supported Languages

The system auto-detects and translates between:
- English 🇺🇸
- French 🇫🇷
- Spanish 🇪🇸
- German 🇩🇪
- Italian 🇮🇹
- Portuguese 🇵🇹
- Chinese 🇨🇳
- Japanese 🇯🇵

## 💡 Pro Tips

- **Multiple Listeners**: Multiple people can join the same session with different target languages
- **Auto-Detection**: Speaker can switch languages mid-conversation
- **Monitor**: Open http://localhost:3001/monitor.html to see system activity

## 🆘 Quick Fixes

**No connection?**
```bash
# Make sure both servers are running
npm run dev
```

**No audio?**
- Check browser microphone permissions
- Ensure TTS checkbox is enabled on listener page

**Authentication error?**
- Verify Azure credentials in `.env` file
- Make sure you're using the KEY, not the endpoint

---

**That's it!** You're ready for real-time speech translation! 🎉