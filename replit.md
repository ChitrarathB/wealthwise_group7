# WealthWise - AI Financial Advisor

## Overview

WealthWise is a voice-powered financial planning platform designed for Singapore-based financial advisors and their clients. The system features dual interfaces: a user-facing voice assistant for building financial profiles through natural conversation, and an advisor dashboard for managing client portfolios and conducting live sessions.

The platform uses OpenAI's API chain (speech-to-text, GPT-4 reasoning, and text-to-speech) to create an interactive financial profiling experience. It collects 13 key financial data points through conversational AI, then generates comprehensive 30-50 year projections with scenario planning and personalized insurance recommendations.

## Recent Changes (October 24, 2025)

**Profile Section Restructure:**
- Reorganized top section from 3 to 4 columns for comprehensive data collection
- Renamed "Your Profile" to "Personal Information" with 5 core fields (Name, Current Age, Marital Status, Gender, Dependents)
- Updated "Financial Summary" with 9 detailed fields including Active Income Monthly, Active Income Growth (%), Passive Income with End Age, Current Bank Saving, Monthly Bank Saving, Monthly Expense, and Loans with Monthly EMI and End Age
- Renamed "Goals" to "Life Event" with dynamic add/remove functionality - users can add multiple life events (Marriage or Child Birth), each with its own age field, and remove them individually
- Added "Scenario Inputs" section with conditional logic:
  - Scenario Type radio buttons (Death or Retirement - mutually exclusive)
  - If Death selected: Death Age field appears
  - If Retirement selected: Retirement Age, Monthly Retirement Expenses, and Life Expectancy fields appear
  - Helper functions getScenarioType() and setScenarioType() manage radio button state
- Reduced font sizes and padding to maintain single-screen visibility with 4 sections

**UI Improvements:**
- Professional red and white color theme (#dc2626) applied throughout
- Red-themed animations:
  - Personal Information and Financial Summary: Individual input boxes animate on change (red border glow, shadow, and background flash)
  - Life Event and Scenario Inputs: Section-level animations (accent bars, status badges, border glows)
  - Voice Assistant: Section animation on new messages
- Voice Assistant with speaker labels ("You" and "Customer"), 9px font size for messages, increased height to 420px for better conversation visibility
- Product Recommendation section optimized to 200px max-height with compact styling
- Tab button font size reduced to 11px for compact display
- Upload button functional - opens file selection for audio upload
- Direct display of all tabs: Analysis, Insights
- No splash screen - immediate access to all functionality
- All content visible on one screen without scrolling

**Replit Environment Setup:**
- Configured server to run on port 5000 (Replit standard)
- Removed welcome overlay for immediate access to tabs
- Updated .gitignore to exclude .env and SQLite database files
- Configured deployment for VM target with persistent connections

## User Preferences

Preferred communication style: Simple, everyday language.
Interface: No welcome screens, direct access to tabs, metrics, and profile forms.

## System Architecture

### Core Technology Stack

**Backend Framework**: Express.js (Node.js) with ES modules
- Main server runs on port 5000 (Replit standard, configurable via PORT env var)
- Session management with SQLite database
- RESTful API endpoints for profile, analysis, scenarios, and insurance recommendations

**Database**: SQLite with better-sqlite3
- Session management (session_id, current_step, completion status)
- Profile storage (13+ financial fields with dynamic column migration)
- Message history (role-based conversation tracking)
- WAL mode for concurrent access performance

**AI/ML Pipeline**: Three-stage OpenAI chain
1. Speech-to-Text: `gpt-4o-mini-transcribe` for audio transcription
2. Extraction/Reasoning: `gpt-4.1` with JSON schema for structured data extraction
3. Text-to-Speech: `gpt-4o-mini-tts` with 'alloy' voice for responses

**Frontend**: Vanilla JavaScript with real-time updates
- MediaRecorder API for browser-based audio capture
- Chart.js for financial visualizations (4 chart types)
- Push-to-talk interface with recording status indicators
- Live profile updates via polling

### Application Architecture Patterns

**Session Management Pattern**
- Unique session IDs generated using nanoid (12-character alphanumeric)
- Step-based progression through 13 financial questions
- Session state persisted in SQLite with current_step tracking
- Profile updates are idempotent with dynamic schema migration

**Voice Interaction Flow**
1. User initiates session → Server creates session record
2. Assistant delivers first question via TTS (auto-plays on load)
3. User records audio (webm/ogg format) → Uploaded as multipart form data
4. Server transcribes → GPT-4 extracts structured answer → Updates DB
5. Server generates confirmation + next question → Returns text + TTS audio
6. Frontend updates profile UI + appends to conversation feed

**Data Extraction Strategy**
- Per-step extraction functions map answers to profile fields
- JSON schema validation ensures type safety
- Short confirmation messages acknowledge each input
- Final step triggers profile completion flag

**Dual Interface Architecture**
- `/` - User-facing voice interface (build own profile)
- `/agent.html` - Advisor dashboard (record client conversations)
- `/demo-frontend/` - Static demo with pre-populated Singapore family data
- Shared styling variables and component structure

### Financial Calculations

**Singapore-Specific Features**
- CPF (Central Provident Fund) contribution tracking
- HDB/Condo/Landed housing type classification
- SGD-denominated income, expenses, and projections
- Category-based inflation rates (housing, medical, daily living)

**Projection Models**
- 30-50 year net worth forecasting
- Savings rate calculations (monthly surplus / gross income)
- Risk tolerance mapping (conservative/balanced/aggressive)
- Investment horizon modeling for goal-based planning

**Scenario Planning Engine**
- 7 life event simulations (marriage, children, property upgrade, etc.)
- Side-by-side comparison views
- Impact analysis on net worth trajectory

**Insurance Recommendations**
- 5 product categories (life, health, disability, critical illness, long-term care)
- Coverage gap analysis (10x annual income rule)
- Provider-specific product matching
- Confidence scoring with reasoning explanations

### Data Models

**Profile Schema** (13 core fields)
```
- household_size
- monthly_income_sgd
- housing_type
- dependents
- monthly_expenses_sgd
- savings_sgd
- cpf_employee_percent
- liabilities_mortgage_sgd
- risk_tolerance
- invest_horizon_years
- monthly_invest_sgd
- preferred_instruments (array)
- investment_goal
```

**Demo Data Structure** (ER diagram-based)
- Customer profile with personal details and dependents
- Financial details aggregator (income, expenses, assets, liabilities)
- Derived metrics (net worth, cash flow, projections)
- Realistic Singapore family persona (Sarah Chen, 34, married with 2 children)

## External Dependencies

**OpenAI Platform**
- API Key required (stored in .env as OPENAI_API_KEY)
- Models: gpt-4o-mini-transcribe, gpt-4.1, gpt-4o-mini-tts
- Audio format support: webm (opus codec preferred), ogg, mp3
- File upload via toFile utility for transcription

**NPM Packages**
- express@5.1.0 - Web server framework
- better-sqlite3@12.4.1 - Synchronous SQLite database
- multer@2.0.2 - Multipart/form-data handling for audio uploads
- nanoid@5.1.6 - Unique ID generation
- openai@5.23.1 - Official OpenAI SDK
- dotenv@17.2.2 - Environment variable management
- nodemon@3.1.10 (dev) - Auto-reload development server

**Browser APIs**
- MediaRecorder API (audio capture)
- getUserMedia (microphone access)
- Fetch API (HTTP requests)
- Audio API (TTS playback)

**Python Backend** (Customer Categorization - Optional)
- Flask web framework (port 9000)
- joblib for model serialization
- pandas/numpy for data processing
- GMM (Gaussian Mixture Model) clustering for customer segmentation
- 8 archetype categories (High-Debt, Affluent, Career Starter, etc.)

**Chart.js**
- CDN-loaded for financial visualizations
- Used in demo and advisor dashboard
- Chart types: line (projections), bar (comparisons), doughnut (allocation)

**Static File Serving**
- Python http.server for demo frontends
- Express static middleware for production
- No-cache headers for development

**Database**
- SQLite file-based storage (data.sqlite)
- No external database server required
- Automatic table creation and schema migration
- WAL mode for improved concurrency