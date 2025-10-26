# 🎙️ WealthWise - AI Financial Advisor

**Complete voice-powered financial planning platform with dual interfaces for users and agents.**

## 🌟 Features

### 👤 User Interface
- **Voice-First Profile Building** - AI assistant asks 13 financial questions
- **Auto-Start Greeting** - Bot speaks immediately on page load
- **Live Analysis** - 4 detailed charts with 10-50 year projections
- **Scenario Planning** - 7 life event simulations with comparisons
- **Insurance Recommendations** - Personalized coverage calculator with 5 products
- **Singapore-Specific** - Category-based inflation (housing, medical, daily living)

### 🎙️ Agent Dashboard
- **Conversation Recording** - Record natural client discussions
- **AI Extraction** - Automatically creates profile from conversation
- **Built-in Analysis** - View projections without switching interfaces
- **Scenario Explorer** - Show clients different financial futures
- **Demo Testing** - Instant testing with sample conversation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- OpenAI API key

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Create environment file
echo "OPENAI_API_KEY=your-api-key-here" > .env

# 3. Start the server
npm start
```

Server will start on `http://localhost:3001`

## 🌐 Access Points

### User Interface
**URL:** `http://localhost:3001/`

**For end-users to build their own financial profile**

**Quick Test:**
1. Click "Start Voice Session"
2. Click "⚡ Load Demo Data" (instant profile)
3. View Analysis → Scenarios → Insurance

### Agent Dashboard  
**URL:** `http://localhost:3001/agent.html`

**For financial advisors recording client meetings**

**Quick Test:**
1. Open `http://localhost:3001/agent.html`
2. Click "🧪 Test with Sample Conversation"
3. Wait 5 seconds for AI processing
4. Click "View Client Analysis & Scenarios"
5. Explore Analysis and Scenarios tabs

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     WealthWise System                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  User Interface          ←→    Server (Node.js + Express)    │
│  (index.html)                   ├─ Voice Processing (OpenAI) │
│  - Voice chat                   ├─ Profile extraction        │
│  - Analysis                     ├─ Financial calculations    │
│  - Scenarios                    ├─ Scenario generation       │
│                                 └─ Insurance recommendations │
│                                                               │
│  Agent Dashboard         ←→    Database (SQLite)             │
│  (agent.html)                   ├─ Sessions                  │
│  - Conversation recorder        ├─ Profiles                  │
│  - AI extraction                └─ Messages                  │
│  - Built-in analysis                                         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
voicebot/
├── server.js                 # Main Express server
├── package.json             # Dependencies
├── .env                     # OpenAI API key (create this)
│
├── public/                  # Frontend files
│   ├── index.html          # User interface
│   ├── app.js              # User interface logic
│   ├── agent.html          # Agent dashboard
│   ├── agent.js            # Agent dashboard logic
│   └── styles.css          # Shared styles
│
├── src/
│   └── db.js               # SQLite database functions
│
└── data.sqlite             # SQLite database (auto-created)
```

## 🎯 Features in Detail

### Financial Analysis (4 Charts)

1. **Cumulative Wealth Overview**
   - Total Net Worth
   - CPF Balance (2.5% returns)
   - Liquid Assets (investments)

2. **Income & Cash Flow**
   - Gross Income (3% annual growth)
   - CPF Contributions
   - Net Cash Flow

3. **Expenses Breakdown** (Stacked Bar)
   - Housing 40% (2.0% inflation)
   - Daily Living 30% (2.5% inflation)  
   - Medical 15% (4.5% inflation)
   - Others 15% (2.5% inflation)

4. **Investment Portfolio Growth**
   - Portfolio Value
   - Total Contributions
   - Investment Gains

### Scenario Analysis (7 Scenarios)

Each scenario shows 3 comparison charts (Income, Expenses, Savings):

1. **📊 Current Plan** - Baseline trajectory
2. **🚀 Career Growth** - +30% income, +15% expenses
3. **😰 Job Loss** - $0 income, savings depletion
4. **🏥 Medical Emergency** - +50% expenses, -$80K savings
5. **👶 New Baby** - +40% expenses, -50% investments
6. **💪 FIRE Plan** - -35% expenses, 3x investments
7. **📉 Recession** - -20% income, +15% expenses

### Insurance Recommendations

- **Coverage Calculator** - Based on scenario and years
- **5 Generic Products** - Provider A through E
- **Real Premium Calculations** - Age-adjusted rates
- **Coverage Breakdown** - Income replacement, education fund, mortgage, buffers

## 🔧 Configuration

### Singapore-Specific Economic Parameters

| Parameter | Rate | Source |
|-----------|------|--------|
| Income Growth | 3.0% | Singapore wage growth average |
| General Inflation | 2.5% | MAS 10-year average |
| Housing Inflation | 2.0% | HDB/Condo market |
| Medical Inflation | 4.5% | Healthcare cost trends |
| CPF Returns | 2.5% | CPF OA guaranteed rate |
| Investment Returns | 4-7% | Based on risk tolerance |

### Risk Tolerance Returns
- **Conservative:** 4% annually
- **Balanced:** 5% annually
- **Aggressive:** 7% annually

## 📝 API Endpoints

### Session Management
- `POST /api/session` - Create new session
- `POST /api/demo-profile` - Load demo data
- `POST /api/profile-update` - Update profile fields

### Analysis & Scenarios
- `GET /api/profile?sessionId=xxx` - Get profile data
- `GET /api/analysis?sessionId=xxx` - Get financial projections
- `GET /api/scenarios?sessionId=xxx` - Get scenario analysis
- `POST /api/insurance-recommendation` - Get coverage needs

### Voice Processing
- `POST /api/ingest-audio` - User voice input (step-by-step)
- `POST /api/ingest-text` - User text input
- `POST /api/agent-conversation` - Agent full conversation
- `POST /api/agent-test-demo` - Agent demo transcript test

## 🧪 Testing

### Test User Interface
```bash
# Open browser
open http://localhost:3001/

# Use demo data for instant testing
# Click "Start Voice Session" → "⚡ Load Demo Data"
```

### Test Agent Dashboard
```bash
# Open browser
open http://localhost:3001/agent.html

# Click "🧪 Test with Sample Conversation"
# AI will extract 12 profile fields from demo transcript
```

### Manual Testing (Voice)
1. Open user interface
2. Click "Start Voice Session"
3. Allow microphone access
4. Hold "Hold to Talk" button and speak
5. Answer financial questions
6. View analysis automatically

### Agent Recording (Real Conversation)
1. Open agent dashboard
2. Click large 🎙️ button
3. Have natural conversation with client
4. Click ⏹️ button to stop
5. AI extracts profile automatically
6. View analysis and scenarios

## 💡 Profile Fields Collected

The system collects 13 financial data points:

1. Household size
2. Monthly income (SGD)
3. Housing type (HDB/Condo/Landed/Other)
4. Number of dependents
5. Monthly expenses (SGD)
6. Current savings (SGD)
7. CPF employee contribution %
8. Monthly mortgage (SGD)
9. Risk tolerance (conservative/balanced/aggressive)
10. Investment horizon (years)
11. Monthly investment amount (SGD)
12. Preferred instruments (stocks/ETFs/bonds/crypto/funds)
13. Investment goal (growth/income/capital_preservation)

## 🎨 Technology Stack

- **Backend:** Node.js + Express
- **Database:** SQLite (better-sqlite3)
- **AI/ML:** OpenAI API
  - Whisper-1 (Speech-to-Text)
  - TTS-1 (Text-to-Speech)
  - GPT-4o-mini (Profile extraction, translation)
  - GPT-4.1 (Structured data extraction)
- **Frontend:** Vanilla JavaScript + Chart.js
- **Styling:** Custom CSS (Light theme)

## 📊 Data Flow

### User Voice Flow
```
User speaks → Whisper (STT) → GPT-4.1 (extract field) 
→ Update DB → Generate TTS response → User hears response
```

### Agent Conversation Flow
```
Record full conversation → Whisper (STT) → GPT-4o-mini (extract all fields)
→ Create complete profile → Show analysis
```

## 🔐 Security Notes

- `.env` file is gitignored (never commit API keys)
- Database uses parameterized queries
- Input validation on all endpoints
- CORS not enabled (local development only)

## 🚀 Production Deployment

For production deployment:

1. **Add CORS configuration** in server.js
2. **Use environment variables** for PORT, API keys
3. **Set up HTTPS** (required for getUserMedia)
4. **Add authentication** for agent dashboard
5. **Increase rate limiting** on OpenAI calls
6. **Add error logging** service
7. **Database backups** for SQLite

## 📱 Browser Compatibility

- **Chrome** ✅ (Recommended)
- **Safari** ✅
- **Firefox** ✅
- **Edge** ✅

**Note:** HTTPS required for production (getUserMedia API requirement)

## 🤝 Support

### Common Issues

**Issue:** "Audio blocked" message  
**Solution:** Click anywhere on page first (browser autoplay policy)

**Issue:** "Failed to process audio"  
**Solution:** Check microphone permissions in browser settings

**Issue:** No TTS audio  
**Solution:** Verify OpenAI API key has TTS access

**Issue:** Charts not loading  
**Solution:** Ensure Chart.js CDN is accessible

## 📄 License

This project is for educational purposes. Insurance products and financial projections are illustrative examples only and should not be considered financial advice.

## 🎉 Credits

Built with:
- OpenAI API (Whisper, TTS, GPT)
- Chart.js for visualizations
- Express.js for server
- Better-SQLite3 for database

---

**WealthWise - Empowering Financial Decisions with AI** 🎯
