## Financial Profile Builder Voice Agent (Prototype)

Minimal full-stack prototype of a Singapore-focused financial profile voice agent using a chained architecture:

- STT: `gpt-4o-mini-transcribe`
- Reasoning/extraction: `gpt-4.1`
- TTS: `gpt-4o-mini-tts`

### Features
- 3-step onboarding via voice: household size → monthly income (SGD) → housing type
- Live dashboard profile updates
- Conversation feed with push-to-talk
- SQLite persistence (sessions, profiles, messages)

### Prerequisites
- Node.js 18+
- OpenAI API key

### Setup
1. Install dependencies:
```bash
npm install
```
2. Configure environment:
```bash
cp .env.example .env
# edit .env and set OPENAI_API_KEY=...
```
3. Run the dev server:
```bash
npm run dev
```
4. Open `http://localhost:3000` in your browser and hold the button to talk.

### How it works
- Frontend records audio (`audio/webm`) via `MediaRecorder` and sends it to `/api/ingest-audio` with the current `sessionId`.
- Backend transcribes, extracts the answer for the current step using `gpt-4.1` with JSON schema, updates SQLite, advances the step, and replies with text and TTS audio.
- UI streams conversation updates and profile fields live.

### Endpoints
- `POST /api/session` → creates a session, returns first question and optional TTS
- `POST /api/ingest-audio` (multipart: `audio`, `sessionId`) → transcribe, extract, update DB, reply
- `GET /api/profile?sessionId=...` → current profile and step
- `GET /api/messages?sessionId=...` → recent conversation

### Extend scope
- Add more questions/steps in `getQuestionByStep` and `extractValueForStep`
- Add profile fields and DB columns in `src/db.js`

### Notes
- If TTS fails (e.g., missing API key), the app still works with text responses.
- For lowest latency playback, the server uses `wav` output.


