# Bilingual Translation Testing Checklist

## Pre-Test Setup ✅
- [ ] Express server running on port 3003
- [ ] WebSocket server running on port 3004  
- [ ] HTTP server running on port 8080
- [ ] Browser microphone permissions granted

## Functional Tests

### 1. Basic Recognition
- [ ] French recognition works
- [ ] English recognition works
- [ ] Language display updates correctly
- [ ] Confidence percentage shows

### 2. Continuous Recognition
- [ ] Recognition continues beyond first word
- [ ] Long sentences are captured completely
- [ ] Pauses don't break recognition session
- [ ] Resuming speech continues in same session

### 3. Language Switching
- [ ] Automatic detection when switching languages
- [ ] Smooth transition between French and English
- [ ] Language indicator updates with correct flag/color
- [ ] No dropped words during language switch

### 4. Real-time Features
- [ ] Partial results appear while speaking
- [ ] Final results replace partial results
- [ ] Timestamps are accurate
- [ ] Transcript auto-scrolls

### 5. WebSocket Communication
- [ ] Session code is generated
- [ ] Socket connects to server
- [ ] Transcripts are broadcast
- [ ] Listener count updates

### 6. UI/UX Tests
- [ ] Start/Stop buttons work correctly
- [ ] Audio visualizer animates during speech
- [ ] Metrics update (latency, words/min)
- [ ] Error messages display when needed

### 7. Advanced Settings (bilingual-speaker-style.html)
- [ ] Dual Recognition Mode vs Auto-Detect
- [ ] Streaming Mode options work
- [ ] Partial results toggle
- [ ] Dictation mode toggle

### 8. Debug Panel (continuous-fix.html)
- [ ] FR Recognizer status updates
- [ ] EN Recognizer status updates
- [ ] Event counter increments
- [ ] Status shows Active/Inactive correctly

## Performance Tests

### 1. Latency
- [ ] Latency metric < 500ms average
- [ ] Partial results appear quickly
- [ ] No noticeable lag in display

### 2. Accuracy
- [ ] French accuracy > 90%
- [ ] English accuracy > 90%
- [ ] Mixed language handling

### 3. Stability
- [ ] No crashes after 5 minutes
- [ ] Memory usage stable
- [ ] No connection drops

## Edge Cases

### 1. Error Scenarios
- [ ] Network disconnection handling
- [ ] Microphone permission denied
- [ ] Token expiration (wait 10 min)
- [ ] Invalid session code

### 2. Speech Variations
- [ ] Fast speech
- [ ] Slow speech
- [ ] Accented speech
- [ ] Background noise
- [ ] Multiple speakers

### 3. Language Edge Cases
- [ ] Code-switching mid-sentence
- [ ] Similar sounding words
- [ ] Numbers and dates
- [ ] Proper nouns

## Browser Compatibility
- [ ] Chrome
- [ ] Safari
- [ ] Firefox
- [ ] Edge

## Test Phrases

### French Test Phrases
1. "Bonjour, comment allez-vous aujourd'hui?"
2. "Je voudrais commander un café s'il vous plaît"
3. "L'intelligence artificielle est fascinante"
4. "Quelle est la météo pour demain?"

### English Test Phrases
1. "Hello, how are you doing today?"
2. "I would like to order a coffee please"
3. "Artificial intelligence is fascinating"
4. "What's the weather forecast for tomorrow?"

### Mixed Language Phrases
1. "Je vais au store pour acheter du bread"
2. "The meeting est scheduled pour trois heures"
3. "C'est vraiment amazing cette technology"

## Sign-off
- [ ] All critical features working
- [ ] No blocking issues found
- [ ] Performance acceptable
- [ ] Ready for production use

Tested by: _________________
Date: _________________
Version: _________________