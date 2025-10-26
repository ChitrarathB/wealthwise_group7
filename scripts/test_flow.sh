#!/bin/sh
set -e

ROOT="$(cd "$(dirname "$0")"/.. && pwd)"

# Start a session
SID=$(curl -sS -X POST http://localhost:3000/api/session | jq -r .sessionId)
echo "Session: $SID"

# Generate TTS samples simulating user answers
ANS1=$(node "$ROOT/scripts/gen_tts.js" "There are 3 people in my family" | tail -n1)
ANS2=$(node "$ROOT/scripts/gen_tts.js" "We make about 9000 dollars a month" | tail -n1)
ANS3=$(node "$ROOT/scripts/gen_tts.js" "We live in an H D B flat" | tail -n1)

# Send each as if they were recorded responses
curl -sS -F sessionId="$SID" -F audio=@"$ANS1" http://localhost:3000/api/ingest-audio | jq -r '.profile'
curl -sS -F sessionId="$SID" -F audio=@"$ANS2" http://localhost:3000/api/ingest-audio | jq -r '.profile'
curl -sS -F sessionId="$SID" -F audio=@"$ANS3" http://localhost:3000/api/ingest-audio | jq -r '.profile'

# Final profile
curl -sS "http://localhost:3000/api/profile?sessionId=$SID" | jq -r '.profile'


