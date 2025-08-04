#!/bin/bash

echo "🔴 Killing any existing servers..."
lsof -ti:3001 | xargs kill -9 2>/dev/null
lsof -ti:3004 | xargs kill -9 2>/dev/null
sleep 1

echo "🚀 Starting Express server on port 3001..."
cd /Users/mtliou/Documents/zooms2s/shit/try5/kno3/cognitive-services-speech-sdk/samples/js/browser
nohup node server/index.js > express-server.log 2>&1 &
EXPRESS_PID=$!
echo "Express server PID: $EXPRESS_PID"

sleep 2

echo "🚀 Starting WebSocket server on port 3004..."
nohup node server/websocket-server.js > websocket-server.log 2>&1 &
WEBSOCKET_PID=$!
echo "WebSocket server PID: $WEBSOCKET_PID"

sleep 2

echo "✅ Checking server status..."
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ Express server is running on http://localhost:3001"
else
    echo "❌ Express server failed to start!"
    exit 1
fi

if lsof -Pi :3004 -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ WebSocket server is running on port 3004"
else
    echo "❌ WebSocket server failed to start!"
    exit 1
fi

echo ""
echo "🎯 Access the application at:"
echo "   Main Page: http://localhost:3001/main-index.html"
echo "   Speaker:   http://localhost:3001/speaker-professional.html"
echo "   Listener:  http://localhost:3001/listener-professional.html"
echo ""
echo "📝 Server logs:"
echo "   Express:   tail -f express-server.log"
echo "   WebSocket: tail -f websocket-server.log"