import 'dotenv/config';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import express from 'express';
import multer from 'multer';
import { customAlphabet } from 'nanoid';
import { OpenAI } from 'openai';
import { toFile } from 'openai/uploads';
import db from './src/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const PORT = process.env.PORT || 5000;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const nanoid = customAlphabet('123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz', 12);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const TOTAL_STEPS = 13;
function getQuestionByStep(step) {
        if (step === 0) return 'How many people are in your household?';
        if (step === 1) return "What's your household's monthly gross income in SGD?";
        if (step === 2) return 'What type of housing do you live in: HDB, condo, landed, or other?';
        if (step === 3) return 'How many dependents do you have?';
        if (step === 4) return 'Roughly what are your monthly living expenses in SGD?';
        if (step === 5) return 'About how much do you currently have in savings (SGD)?';
        if (step === 6) return 'What is your CPF employee contribution percent?';
        if (step === 7) return 'Do you have a monthly mortgage? If yes, how much in SGD?';
        if (step === 8) return 'Which best describes your risk tolerance: conservative, balanced, or aggressive?';
        if (step === 9) return 'What is your investment horizon in years?';
        if (step === 10) return 'How much would you like to invest monthly (SGD)?';
        if (step === 11) return 'Which instruments do you prefer: stocks, ETFs, bonds, crypto, or funds?';
        if (step === 12) return 'What is your primary investment goal: growth, income, or capital preservation?';
        return null;
}

function shortConfirmText(step, value) {
        if (step === 0) return `Got it — household size: ${value}.`;
        if (step === 1) return `Thanks — monthly gross income noted: $${value} SGD.`;
        if (step === 2) return `Understood — housing type: ${value}.`;
        if (step === 3) return `Noted — ${value} dependents.`;
        if (step === 4) return `Thanks — monthly expenses: $${value} SGD.`;
        if (step === 5) return `Great — savings: $${value} SGD.`;
        if (step === 6) return `Noted — CPF contribution: ${value}%.`;
        if (step === 7) return `Got it — mortgage: $${value}/month.`;
        if (step === 8) return `Perfect — risk tolerance: ${value}.`;
        if (step === 9) return `Excellent — investment horizon: ${value} years.`;
        if (step === 10) return `Great — monthly investment: $${value} SGD.`;
        if (step === 11) return `Perfect — instruments: ${Array.isArray(value) ? value.join(', ') : value}.`;
        if (step === 12) return `Excellent — investment goal: ${value}.`;
        return '';
}

async function tts(text) {
        try {
                const resp = await openai.audio.speech.create({
                        model: 'tts-1', // Correct OpenAI TTS model name
                        voice: 'alloy',
                        input: text,
                        response_format: 'wav'
                });
                const arrayBuffer = await resp.arrayBuffer();
                return Buffer.from(arrayBuffer);
        } catch (e) {
                console.error('TTS error:', e);
                throw e;
        }
}

async function transcribeAudio(buffer, originalName, mimeType) {
        try {
                // Create file object from buffer
                const fileLike = await toFile(buffer, originalName || 'audio.webm', { type: mimeType || 'audio/webm' });
                
                const tr = await openai.audio.transcriptions.create({
                        model: 'whisper-1', // Correct OpenAI Whisper model name
                        file: fileLike,
                        language: 'en' // Optimize for English
                });
                
                return tr.text || '';
        } catch (e) {
                console.error('transcribeAudio error:', e);
                console.error('File details:', { originalName, mimeType, bufferSize: buffer?.length });
                throw e;
        }
}

async function translateToEnglishIfNeeded(text) {
        if (!text) return text;
        const hasNonAscii = /[^\x00-\x7F]/.test(text);
        if (!hasNonAscii) return text;
        
        try {
                const response = await openai.chat.completions.create({
                        model: 'gpt-4o-mini',
                        messages: [
                                { role: 'system', content: 'Translate the user text to English. Respond only with the translated text, nothing else.' },
                                { role: 'user', content: text }
                        ],
                        temperature: 0
                });
                return response.choices[0]?.message?.content || text;
        } catch (error) {
                console.error('Translation error:', error);
                return text; // fallback to original text
        }
}

async function extractValueForStep(step, transcript) {
        if (!transcript) return { ok: false };
        if (step === 0) {
                const schema = {
                        type: 'object',
                        properties: { household_size: { type: 'integer', minimum: 1, maximum: 20 } },
                        required: ['household_size'],
                        additionalProperties: false
                };
                const r = await openai.responses.create({
                        model: 'gpt-4.1',
                        input: [
                                { role: 'system', content: 'Extract household_size as an integer between 1 and 20 from the user text. English only. Output JSON strictly.' },
                                { role: 'user', content: transcript }
                        ],
                        text: { format: { type: 'json_schema', name: 'household', schema } }
                });
                const text = r.output_text || r.output?.[0]?.content?.[0]?.text;
                const obj = JSON.parse(text);
                return { ok: true, value: obj.household_size };
        }
        if (step === 1) {
                const schema = {
                        type: 'object',
                        properties: { monthly_income_sgd: { type: 'number', minimum: 0 } },
                        required: ['monthly_income_sgd'],
                        additionalProperties: false
                };
                const r = await openai.responses.create({
                        model: 'gpt-4.1',
                        input: [
                                { role: 'system', content: 'Extract monthly_income_sgd as a number in SGD from the user text. If ranges, pick a reasonable number in the middle. English only. Output JSON strictly.' },
                                { role: 'user', content: transcript }
                        ],
                        text: { format: { type: 'json_schema', name: 'income', schema } }
                });
                const text = r.output_text || r.output?.[0]?.content?.[0]?.text;
                const obj = JSON.parse(text);
                return { ok: true, value: Number(obj.monthly_income_sgd) };
        }
        if (step === 2) {
                const schema = {
                        type: 'object',
                        properties: {
                                housing_type: { type: 'string', enum: ['HDB', 'Condo', 'Landed', 'Other'] }
                        },
                        required: ['housing_type'],
                        additionalProperties: false
                };
                const r = await openai.responses.create({
                        model: 'gpt-4.1',
                        input: [
                                { role: 'system', content: "Classify housing_type as one of: HDB, Condo, Landed, Other based on the user's text. English only. Output JSON strictly." },
                                { role: 'user', content: transcript }
                        ],
                        text: { format: { type: 'json_schema', name: 'housing', schema } }
                });
                const text = r.output_text || r.output?.[0]?.content?.[0]?.text;
                const obj = JSON.parse(text);
                return { ok: true, value: obj.housing_type };
        }
        if (step === 3) {
                const schema = { type: 'object', properties: { dependents: { type: 'integer', minimum: 0, maximum: 20 } }, required: ['dependents'], additionalProperties: false };
                const r = await openai.responses.create({
                        model: 'gpt-4.1',
                        input: [
                                { role: 'system', content: 'Extract dependents as an integer between 0 and 20 from the user text.' },
                                { role: 'user', content: transcript }
                        ],
                        text: { format: { type: 'json_schema', name: 'dependents', schema } }
                });
                const text = r.output_text || r.output?.[0]?.content?.[0]?.text;
                const obj = JSON.parse(text);
                return { ok: true, value: obj.dependents };
        }
        if (step === 4) {
                const schema = { type: 'object', properties: { monthly_expenses_sgd: { type: 'number', minimum: 0 } }, required: ['monthly_expenses_sgd'], additionalProperties: false };
                const r = await openai.responses.create({
                        model: 'gpt-4.1',
                        input: [
                                { role: 'system', content: 'Extract monthly_expenses_sgd as a number in SGD from the user text.' },
                                { role: 'user', content: transcript }
                        ],
                        text: { format: { type: 'json_schema', name: 'expenses', schema } }
                });
                const text = r.output_text || r.output?.[0]?.content?.[0]?.text;
                const obj = JSON.parse(text);
                return { ok: true, value: Number(obj.monthly_expenses_sgd) };
        }
        if (step === 5) {
                const schema = { type: 'object', properties: { savings_sgd: { type: 'number', minimum: 0 } }, required: ['savings_sgd'], additionalProperties: false };
                const r = await openai.responses.create({
                        model: 'gpt-4.1',
                        input: [
                                { role: 'system', content: 'Extract savings_sgd as a number in SGD from the user text.' },
                                { role: 'user', content: transcript }
                        ],
                        text: { format: { type: 'json_schema', name: 'savings', schema } }
                });
                const text = r.output_text || r.output?.[0]?.content?.[0]?.text;
                const obj = JSON.parse(text);
                return { ok: true, value: Number(obj.savings_sgd) };
        }
        if (step === 6) {
                const schema = { type: 'object', properties: { cpf_employee_percent: { type: 'number', minimum: 0, maximum: 60 } }, required: ['cpf_employee_percent'], additionalProperties: false };
                const r = await openai.responses.create({
                        model: 'gpt-4.1',
                        input: [
                                { role: 'system', content: 'Extract cpf_employee_percent as a number percentage (0-60).' },
                                { role: 'user', content: transcript }
                        ],
                        text: { format: { type: 'json_schema', name: 'cpf', schema } }
                });
                const text = r.output_text || r.output?.[0]?.content?.[0]?.text;
                const obj = JSON.parse(text);
                return { ok: true, value: Number(obj.cpf_employee_percent) };
        }
        if (step === 7) {
                const schema = { type: 'object', properties: { liabilities_mortgage_sgd: { type: 'number', minimum: 0 } }, required: ['liabilities_mortgage_sgd'], additionalProperties: false };
                const r = await openai.responses.create({
                        model: 'gpt-4.1',
                        input: [
                                { role: 'system', content: 'Extract liabilities_mortgage_sgd as a number in SGD (0 if none).' },
                                { role: 'user', content: transcript }
                        ],
                        text: { format: { type: 'json_schema', name: 'mortgage', schema } }
                });
                const text = r.output_text || r.output?.[0]?.content?.[0]?.text;
                const obj = JSON.parse(text);
                return { ok: true, value: Number(obj.liabilities_mortgage_sgd) };
        }
        if (step === 8) {
                const schema = { type: 'object', properties: { risk_tolerance: { type: 'string', enum: ['conservative','balanced','aggressive'] } }, required: ['risk_tolerance'], additionalProperties: false };
                const r = await openai.responses.create({
                        model: 'gpt-4.1',
                        input: [
                                { role: 'system', content: 'Classify risk_tolerance as one of: conservative, balanced, aggressive.' },
                                { role: 'user', content: transcript }
                        ],
                        text: { format: { type: 'json_schema', name: 'risk', schema } }
                });
                const text = r.output_text || r.output?.[0]?.content?.[0]?.text;
                const obj = JSON.parse(text);
                return { ok: true, value: obj.risk_tolerance };
        }
        if (step === 9) {
                const schema = { type: 'object', properties: { invest_horizon_years: { type: 'integer', minimum: 0, maximum: 60 } }, required: ['invest_horizon_years'], additionalProperties: false };
                const r = await openai.responses.create({ model: 'gpt-4.1', input: [ { role: 'system', content: 'Extract invest_horizon_years as an integer (0-60).' }, { role: 'user', content: transcript } ], text: { format: { type: 'json_schema', name: 'inv_horizon', schema } } });
                const text = r.output_text || r.output?.[0]?.content?.[0]?.text;
                const obj = JSON.parse(text);
                return { ok: true, value: obj.invest_horizon_years };
        }
        if (step === 10) {
                const schema = { type: 'object', properties: { monthly_invest_sgd: { type: 'number', minimum: 0 } }, required: ['monthly_invest_sgd'], additionalProperties: false };
                const r = await openai.responses.create({ model: 'gpt-4.1', input: [ { role: 'system', content: 'Extract monthly_invest_sgd as a number in SGD.' }, { role: 'user', content: transcript } ], text: { format: { type: 'json_schema', name: 'inv_monthly', schema } } });
                const text = r.output_text || r.output?.[0]?.content?.[0]?.text;
                const obj = JSON.parse(text);
                return { ok: true, value: Number(obj.monthly_invest_sgd) };
        }
        if (step === 11) {
                const schema = { type: 'object', properties: { preferred_instruments: { type: 'array', items: { type: 'string', enum: ['stocks','ETFs','bonds','crypto','funds'] }, minItems: 1 } }, required: ['preferred_instruments'], additionalProperties: false };
                const r = await openai.responses.create({ model: 'gpt-4.1', input: [ { role: 'system', content: 'Extract preferred_instruments as an array of one or more of: stocks, ETFs, bonds, crypto, funds.' }, { role: 'user', content: transcript } ], text: { format: { type: 'json_schema', name: 'inv_instr', schema } } });
                const text = r.output_text || r.output?.[0]?.content?.[0]?.text;
                const obj = JSON.parse(text);
                return { ok: true, value: obj.preferred_instruments };
        }
        if (step === 12) {
                const schema = { type: 'object', properties: { investment_goal: { type: 'string', enum: ['growth','income','capital_preservation'] } }, required: ['investment_goal'], additionalProperties: false };
                const r = await openai.responses.create({ model: 'gpt-4.1', input: [ { role: 'system', content: 'Classify investment_goal as one of: growth, income, capital_preservation.' }, { role: 'user', content: transcript } ], text: { format: { type: 'json_schema', name: 'inv_goal', schema } } });
                const text = r.output_text || r.output?.[0]?.content?.[0]?.text;
                const obj = JSON.parse(text);
                return { ok: true, value: obj.investment_goal };
        }
        return { ok: false };
}

app.post('/api/session', async (req, res) => {
        try {
                const sessionId = nanoid();
                db.createSession(sessionId);
                
                const assistantText = "Hello! Welcome to WealthWise, your personal financial advisor. I'll help you build your financial profile. Let's get started. " + getQuestionByStep(0);
                
                // Generate TTS for the greeting
                let audioBase64 = null;
                try {
                        const audio = await tts(assistantText);
                        audioBase64 = audio.toString('base64');
                } catch (e) {
                        console.error('TTS error:', e);
                }
                
                db.addMessage(sessionId, 'assistant', assistantText);
                
                return res.json({ 
                        sessionId, 
                        assistantText, 
                        audio: audioBase64, 
                        profile: db.getProfile(sessionId), 
                        currentStep: 0, 
                        completed: false, 
                        totalSteps: TOTAL_STEPS 
                });
        } catch (err) {
                console.error(err);
                return res.status(500).json({ error: 'failed_to_create_session' });
        }
});

app.get('/api/profile', (req, res) => {
        const sessionId = req.query.sessionId;
        if (!sessionId) return res.status(400).json({ error: 'missing_sessionId' });
        const profile = db.getProfile(sessionId);
        const session = db.getSession(sessionId);
        if (!session) return res.status(404).json({ error: 'not_found' });
        return res.json({ profile, currentStep: session.current_step, completed: !!session.completed, totalSteps: TOTAL_STEPS });
});

app.get('/api/messages', (req, res) => {
        const sessionId = req.query.sessionId;
        if (!sessionId) return res.status(400).json({ error: 'missing_sessionId' });
        const rows = db.getMessages(sessionId, 50);
        return res.json({ messages: rows });
});

app.post('/api/profile-update', (req, res) => {
        const { sessionId, fields } = req.body || {};
        if (!sessionId) return res.status(400).json({ error: 'missing_sessionId' });
        if (!fields || typeof fields !== 'object') return res.status(400).json({ error: 'missing_fields' });
        const session = db.getSession(sessionId);
        if (!session) return res.status(404).json({ error: 'session_not_found' });
        try {
                db.upsertProfile(sessionId, fields);
                const profile = db.getProfile(sessionId);
                return res.json({ ok: true, profile });
        } catch (e) {
                console.error('profile-update error', e);
                return res.status(500).json({ error: 'update_failed' });
        }
});

// Demo data endpoint - populates profile with sample data
app.post('/api/demo-profile', (req, res) => {
        const { sessionId } = req.body || {};
        if (!sessionId) return res.status(400).json({ error: 'missing_sessionId' });
        
        const session = db.getSession(sessionId);
        if (!session) return res.status(404).json({ error: 'session_not_found' });
        
        try {
                // Demo profile data
                const demoData = {
                        household_size: 4,
                        monthly_income_sgd: 12000,
                        housing_type: 'Condo',
                        dependents: 2,
                        monthly_expenses_sgd: 6500,
                        savings_sgd: 85000,
                        cpf_employee_percent: 20,
                        liabilities_mortgage_sgd: 3200,
                        risk_tolerance: 'balanced',
                        invest_horizon_years: 25,
                        monthly_invest_sgd: 2000,
                        preferred_instruments: ['stocks', 'ETFs', 'bonds'],
                        investment_goal: 'growth'
                };
                
                db.upsertProfile(sessionId, demoData);
                db.updateSessionStep(sessionId, 13, 1); // Mark as completed
                
                const profile = db.getProfile(sessionId);
                return res.json({ ok: true, profile, message: 'Demo profile loaded successfully!' });
        } catch (e) {
                console.error('demo-profile error', e);
                return res.status(500).json({ error: 'demo_failed' });
        }
});

function computeAnalysis(profile, opts = {}) {
        const years = opts.years || 50;
        const monthlyIncome = Number(profile?.monthly_income_sgd || 0);
        const monthlyExpenses = Number(profile?.monthly_expenses_sgd || 0);
        const monthlyInvest = Number(profile?.monthly_invest_sgd || 0);
        const savingsStart = Number(profile?.savings_sgd || 0);
        const incomeGrowth = opts.incomeGrowth ?? 0.03; // 3%
        const expenseInflation = opts.expenseInflation ?? 0.025; // 2.5%
        const returnRate = opts.returnRate ?? 0.05; // 5%
        const retirementAge = opts.retirementAge ?? 65;

        let netWorth = savingsStart;
        const series = [];
        for (let y = 0; y <= years; y++) {
                const annualIncome = monthlyIncome * 12 * Math.pow(1 + incomeGrowth, y);
                const annualExpenses = monthlyExpenses * 12 * Math.pow(1 + expenseInflation, y);
                const annualInvest = monthlyInvest * 12 * Math.pow(1 + incomeGrowth, y); // assume invests scale with income
                // grow net worth then add this year's contributions (mid-year approx)
                netWorth = netWorth * (1 + returnRate) + annualInvest * (1 + returnRate * 0.5);
                series.push({ year: y, income: annualIncome, expenses: annualExpenses, invest: annualInvest, netWorth });
        }
        return { params: { incomeGrowth, expenseInflation, returnRate, retirementAge }, series };
}




async function generatePlansWithSearch(profile) {
        try {
                const monthlyIncome = Number(profile.monthly_income_sgd || 5000);
                const savings = Number(profile.savings_sgd || 10000);
                const dependents = Number(profile.dependents || 0);
                const riskTolerance = profile.risk_tolerance || 'moderate';
                
                // Generate recommendations based on profile
                const plans = {
                        life_insurance: [
                                {
                                        name: "Great Eastern Supreme Term",
                                        provider: "Great Eastern",
                                        coverage: `$${Math.round(monthlyIncome * 120).toLocaleString()}`,
                                        premium: `$${Math.round(monthlyIncome * 0.02)}/month`,
                                        features: ["Death benefit", "Terminal illness coverage", "Renewable up to age 65"],
                                        suitability: "High coverage at low cost for young families",
                                        priority: dependents > 0 ? "High" : "Medium"
                                },
                                {
                                        name: "AIA Smart Term",
                                        provider: "AIA Singapore", 
                                        coverage: `$${Math.round(monthlyIncome * 100).toLocaleString()}`,
                                        premium: `$${Math.round(monthlyIncome * 0.025)}/month`,
                                        features: ["Flexible coverage", "Premium waiver benefit", "Conversion option"],
                                        suitability: "Flexible protection with conversion options",
                                        priority: "Medium"
                                }
                        ],
                        health_insurance: [
                                {
                                        name: "Prudential PRUShield",
                                        provider: "Prudential Singapore",
                                        coverage: "Up to $2M annually",
                                        premium: `$${Math.round(monthlyIncome * 0.03)}/month per person`,
                                        features: ["Private hospital coverage", "No lifetime limit", "Worldwide coverage"],
                                        suitability: "Comprehensive health protection for families",
                                        priority: "High"
                                },
                                {
                                        name: "NTUC Income Enhanced IncomeShield",
                                        provider: "NTUC Income",
                                        coverage: "Up to $1M annually",
                                        premium: `$${Math.round(monthlyIncome * 0.02)}/month per person`,
                                        features: ["Medisave approved", "Pre-existing conditions covered", "Cashless claims"],
                                        suitability: "Affordable comprehensive coverage",
                                        priority: "High"
                                }
                        ],
                        investment_plans: [
                                {
                                        name: riskTolerance === 'conservative' ? "OCBC Blue Chip Investment" : "DBS Equity Growth Fund",
                                        provider: riskTolerance === 'conservative' ? "OCBC Bank" : "DBS Bank",
                                        minimum: "$1,000",
                                        expected_return: riskTolerance === 'conservative' ? "4-6% annually" : "6-10% annually",
                                        features: ["Diversified portfolio", "Professional management", "Regular savings plan"],
                                        suitability: riskTolerance === 'conservative' ? "Suitable for conservative investors" : "Good for growth-oriented investors",
                                        priority: savings > 50000 ? "High" : "Medium"
                                },
                                {
                                        name: "DBS Invest-Saver",
                                        provider: "DBS Bank",
                                        minimum: "$100/month",
                                        expected_return: "5-8% annually",
                                        features: ["Dollar cost averaging", "Low fees", "Flexible contributions"],
                                        suitability: "Ideal for regular monthly investments",
                                        priority: "Medium"
                                }
                        ],
                        retirement_plans: [
                                {
                                        name: "CPF Voluntary Contribution",
                                        provider: "CPF Board",
                                        contribution: "Up to $37,740 annually",
                                        returns: "2.5-4% guaranteed",
                                        features: ["Tax relief", "Guaranteed returns", "Government backed"],
                                        suitability: "Safe retirement savings with tax benefits",
                                        priority: "High"
                                },
                                {
                                        name: "SRS (Supplementary Retirement Scheme)",
                                        provider: "Approved Banks",
                                        contribution: "Up to $15,300 annually",
                                        returns: "Market-linked",
                                        features: ["Tax deferment", "Investment flexibility", "Retirement income"],
                                        suitability: "Tax-efficient retirement planning",
                                        priority: monthlyIncome > 8000 ? "High" : "Medium"
                                }
                        ]
                };

                return {
                        recommendations: plans,
                        summary: {
                                total_monthly_premium: Math.round(monthlyIncome * 0.08),
                                recommended_life_cover: Math.round(monthlyIncome * 120),
                                emergency_fund_target: Math.round(monthlyIncome * 6),
                                investment_allocation: {
                                        conservative: riskTolerance === 'conservative' ? 70 : riskTolerance === 'moderate' ? 40 : 20,
                                        balanced: riskTolerance === 'moderate' ? 50 : 40,
                                        growth: riskTolerance === 'aggressive' ? 60 : riskTolerance === 'moderate' ? 10 : 10
                                }
                        }
                };
        } catch (error) {
                console.error('Error in generatePlansWithSearch:', error);
                throw error;
        }
}

app.post('/api/ingest-audio', upload.single('audio'), async (req, res) => {
        try {
                const sessionId = req.body.sessionId;
                if (!sessionId) return res.status(400).json({ error: 'missing_sessionId' });
                const session = db.getSession(sessionId);
                if (!session) return res.status(404).json({ error: 'session_not_found' });
                if (!req.file) return res.status(400).json({ error: 'missing_audio' });

                let transcript;
                try {
                        transcript = await transcribeAudio(req.file.buffer, req.file.originalname, req.file.mimetype);
                } catch (e) {
                        const assistantText = 'I could not process that audio. Please hold to talk again or type your answer.';
                        let audioBase64 = null;
                        try { const audio = await tts(assistantText); audioBase64 = audio.toString('base64'); } catch {}
                        return res.json({ assistantText, audio: audioBase64, transcript: '', profile: db.getProfile(req.body.sessionId), currentStep: (db.getSession(req.body.sessionId)?.current_step)||0, completed: false });
                }
                const transcriptEn = await translateToEnglishIfNeeded(transcript);
                db.addMessage(sessionId, 'user', transcriptEn);

                const step = session.current_step || 0;
                const extraction = await extractValueForStep(step, transcriptEn);
                let assistantText;
                let nextStep = step;
                let completed = false;

                if (extraction.ok) {
                        if (step === 0) db.upsertProfile(sessionId, { household_size: extraction.value });
                        if (step === 1) db.upsertProfile(sessionId, { monthly_income_sgd: extraction.value });
                        if (step === 2) db.upsertProfile(sessionId, { housing_type: extraction.value });
                        if (step === 3) db.upsertProfile(sessionId, { dependents: extraction.value });
                        if (step === 4) db.upsertProfile(sessionId, { monthly_expenses_sgd: extraction.value });
                        if (step === 5) db.upsertProfile(sessionId, { savings_sgd: extraction.value });
                        if (step === 6) db.upsertProfile(sessionId, { cpf_employee_percent: extraction.value });
                        if (step === 7) db.upsertProfile(sessionId, { liabilities_mortgage_sgd: extraction.value });
                        if (step === 8) db.upsertProfile(sessionId, { risk_tolerance: extraction.value });
                        if (step === 9) db.upsertProfile(sessionId, { invest_horizon_years: extraction.value });
                        if (step === 10) db.upsertProfile(sessionId, { monthly_invest_sgd: extraction.value });
                        if (step === 11) db.upsertProfile(sessionId, { preferred_instruments: extraction.value });
                        if (step === 12) db.upsertProfile(sessionId, { investment_goal: extraction.value });

                        const confirm = shortConfirmText(step, extraction.value);
                        nextStep = step + 1;
                        const nextQ = getQuestionByStep(nextStep);
                        if (nextQ) {
                                assistantText = `${confirm} ${nextQ}`;
                        } else {
                                assistantText = `${confirm} Wonderful! Your complete financial profile is now ready. You can explore your personalized analysis and recommendations.`;
                                completed = true;
                        }
                } else {
                        assistantText = `Sorry, I didn't quite get that. ${getQuestionByStep(step)}`;
                }

                db.addMessage(sessionId, 'assistant', assistantText);
                db.updateSessionStep(sessionId, nextStep, completed ? 1 : 0);

                let audioBase64 = null;
                try {
                        const audio = await tts(assistantText);
                        audioBase64 = audio.toString('base64');
                } catch {}

                const profile = db.getProfile(sessionId);
                return res.json({
                        assistantText,
                        audio: audioBase64,
                        transcript: transcriptEn,
                        profile,
                        currentStep: nextStep,
                        completed
                });
        } catch (err) {
                console.error(err);
                return res.status(500).json({ error: 'ingest_failed', details: String(err?.message || err) });
        }
});

app.post('/api/ingest-text', async (req, res) => {
        try {
                const { sessionId, text } = req.body || {};
                if (!sessionId) return res.status(400).json({ error: 'missing_sessionId' });
                if (!text) return res.status(400).json({ error: 'missing_text' });
                const session = db.getSession(sessionId);
                if (!session) return res.status(404).json({ error: 'session_not_found' });

                db.addMessage(sessionId, 'user', text);
                const step = session.current_step || 0;
                const extraction = await extractValueForStep(step, text);
                let assistantText;
                let nextStep = step;
                let completed = false;
                if (extraction.ok) {
                        if (step === 0) db.upsertProfile(sessionId, { household_size: extraction.value });
                        if (step === 1) db.upsertProfile(sessionId, { monthly_income_sgd: extraction.value });
                        if (step === 2) db.upsertProfile(sessionId, { housing_type: extraction.value });
                        if (step === 3) db.upsertProfile(sessionId, { dependents: extraction.value });
                        if (step === 4) db.upsertProfile(sessionId, { monthly_expenses_sgd: extraction.value });
                        if (step === 5) db.upsertProfile(sessionId, { savings_sgd: extraction.value });
                        if (step === 6) db.upsertProfile(sessionId, { cpf_employee_percent: extraction.value });
                        if (step === 7) db.upsertProfile(sessionId, { liabilities_mortgage_sgd: extraction.value });
                        if (step === 8) db.upsertProfile(sessionId, { risk_tolerance: extraction.value });
                        if (step === 9) db.upsertProfile(sessionId, { invest_horizon_years: extraction.value });
                        if (step === 10) db.upsertProfile(sessionId, { monthly_invest_sgd: extraction.value });
                        if (step === 11) db.upsertProfile(sessionId, { preferred_instruments: extraction.value });
                        if (step === 12) db.upsertProfile(sessionId, { investment_goal: extraction.value });

                        const confirm = shortConfirmText(step, extraction.value);
                        nextStep = step + 1;
                        const nextQ = getQuestionByStep(nextStep);
                        if (nextQ) assistantText = `${confirm} ${nextQ}`;
                        else { assistantText = `${confirm} Thanks! Your basic profile is ready.`; completed = true; }
                } else {
                        assistantText = `Sorry, I didn't quite get that. ${getQuestionByStep(step)}`;
                }

                db.addMessage(sessionId, 'assistant', assistantText);
                db.updateSessionStep(sessionId, nextStep, completed ? 1 : 0);

                let audioBase64 = null;
                try {
                        const audio = await tts(assistantText);
                        audioBase64 = audio.toString('base64');
                } catch {}

                const profile = db.getProfile(sessionId);
                return res.json({ assistantText, audio: audioBase64, transcript: text, profile, currentStep: nextStep, completed });
        } catch (err) {
                console.error(err);
                return res.status(500).json({ error: 'ingest_failed', details: String(err?.message || err) });
        }
});

function calculateAnalysis(profile) {
        // Handle empty or undefined profile with defaults
        const safeProfile = profile || {};
        const monthlyIncome = Number(safeProfile.monthly_income_sgd || 5000);
        const monthlyExpenses = Number(safeProfile.monthly_expenses_sgd || 3000);
        const monthlyInvest = Number(safeProfile.monthly_invest_sgd || 1000);
        const currentSavings = Number(safeProfile.savings_sgd || 10000);
        const cpfPercent = Number(safeProfile.cpf_employee_percent || 20);
        const mortgage = Number(safeProfile.liabilities_mortgage_sgd || 0);
        const riskTolerance = safeProfile.risk_tolerance || 'balanced';
        const dependents = Number(safeProfile.dependents || 0);
        const householdSize = Number(safeProfile.household_size || 1);
        
        // Determine investment return rate based on risk tolerance
        let investmentReturn = 0.05; // 5% default (balanced)
        if (riskTolerance === 'conservative') investmentReturn = 0.04; // 4%
        if (riskTolerance === 'aggressive') investmentReturn = 0.07; // 7%
        
        // Singapore-specific economic parameters
        const incomeGrowth = 0.03; // 3% annual income growth (Singapore wage growth average)
        const generalInflation = 0.025; // 2.5% general inflation (Singapore 10-year average)
        const housingInflation = 0.02; // 2% housing cost inflation (HDB/condo appreciation)
        const medicalInflation = 0.045; // 4.5% medical cost inflation (Singapore healthcare costs rising)
        const educationInflation = 0.035; // 3.5% education cost inflation
        const cpfReturn = 0.025; // 2.5% CPF returns (CPF OA rate)
        
        const projections = {
                years_10: [],
                years_20: [],
                years_30: [],
                years_40: [],
                years_50: []
        };
        
        // Calculate projections for 50 years
        let netWorth = currentSavings;
        let cpfBalance = currentSavings * 0.3; // Assume 30% in CPF
        let liquidAssets = currentSavings * 0.7;
        
        // Track investment portfolio value separately
        let investmentPortfolio = liquidAssets;
        let totalInvested = 0; // Track cumulative contributions
        
        const allYears = [];
        
        for (let year = 0; year <= 50; year++) {
                const annualIncome = monthlyIncome * 12 * Math.pow(1 + incomeGrowth, year);
                
                // Break down expenses into categories for more accurate inflation modeling
                // Assume: 40% housing, 30% daily living, 15% medical, 15% others
                const baseMonthlyExpenses = monthlyExpenses;
                const housingExpenses = baseMonthlyExpenses * 0.40 * 12 * Math.pow(1 + housingInflation, year);
                const dailyExpenses = baseMonthlyExpenses * 0.30 * 12 * Math.pow(1 + generalInflation, year);
                const medicalExpenses = baseMonthlyExpenses * 0.15 * 12 * Math.pow(1 + medicalInflation, year);
                const otherExpenses = baseMonthlyExpenses * 0.15 * 12 * Math.pow(1 + generalInflation, year);
                
                const annualExpenses = housingExpenses + dailyExpenses + medicalExpenses + otherExpenses;
                
                // Mortgage typically fixed or grows slower (only if variable rate)
                const annualMortgage = mortgage * 12 * Math.pow(1 + housingInflation * 0.5, year); // 50% of housing inflation
                const annualInvestment = monthlyInvest * 12 * Math.pow(1 + incomeGrowth, year);
                const annualCPF = annualIncome * (cpfPercent / 100);
                
                // CPF grows with guaranteed returns
                cpfBalance = cpfBalance * (1 + cpfReturn) + annualCPF;
                
                // Investment portfolio grows with compound returns
                investmentPortfolio = investmentPortfolio * (1 + investmentReturn) + annualInvestment;
                totalInvested += annualInvestment;
                const investmentGains = investmentPortfolio - totalInvested;
                
                // Liquid assets = investments + cash reserves
                const netCashFlow = annualIncome - annualExpenses - annualMortgage - annualInvestment - annualCPF;
                const cashReserves = Math.max(0, netCashFlow > 0 ? netCashFlow * year * 0.5 : 0); // Accumulate excess cash
                liquidAssets = investmentPortfolio + cashReserves;
                
                // Total net worth
                netWorth = cpfBalance + liquidAssets;
                
                const yearData = {
                        year,
                        income: Math.round(annualIncome),
                        expenses: Math.round(annualExpenses),
                        mortgage: Math.round(annualMortgage),
                        investment: Math.round(annualInvestment),
                        cpfContribution: Math.round(annualCPF),
                        cpfBalance: Math.round(cpfBalance),
                        liquidAssets: Math.round(liquidAssets),
                        netWorth: Math.round(netWorth),
                        netCashFlow: Math.round(netCashFlow),
                        // Expense breakdown
                        housingExpenses: Math.round(housingExpenses),
                        dailyExpenses: Math.round(dailyExpenses),
                        medicalExpenses: Math.round(medicalExpenses),
                        otherExpenses: Math.round(otherExpenses),
                        // Investment tracking
                        investmentPortfolio: Math.round(investmentPortfolio),
                        totalInvested: Math.round(totalInvested),
                        investmentGains: Math.round(investmentGains)
                };
                
                allYears.push(yearData);
                
                // Store in specific year buckets
                if (year <= 10) projections.years_10.push(yearData);
                if (year <= 20) projections.years_20.push(yearData);
                if (year <= 30) projections.years_30.push(yearData);
                if (year <= 40) projections.years_40.push(yearData);
                projections.years_50.push(yearData);
        }
        
        // Calculate key milestones
        const emergencyFund = Math.round(monthlyExpenses * 6);
        const retirementTarget = Math.round(monthlyExpenses * 12 * 25); // 25x annual expenses
        const lifeCoverNeeded = Math.round((monthlyExpenses * 12 * 10) + (dependents * 100000));
        
        // Find when they reach various milestones
        let firstMillionYear = null;
        let retirementReadyYear = null;
        
        for (const yearData of allYears) {
                if (!firstMillionYear && yearData.netWorth >= 1000000) {
                        firstMillionYear = yearData.year;
                }
                if (!retirementReadyYear && yearData.netWorth >= retirementTarget) {
                        retirementReadyYear = yearData.year;
                }
        }
        
        // Calculate savings rate
        const savingsRate = monthlyIncome > 0 ? Math.round((monthlyInvest / monthlyIncome) * 100) : 0;
        
        return {
                projections,
                summary: {
                        currentAge: 30, // Can be extended to ask user
                        retirementAge: 65,
                        yearsToRetirement: 35,
                        currentNetWorth: Math.round(netWorth),
                        projectedNetWorth_10: projections.years_10[10]?.netWorth || 0,
                        projectedNetWorth_20: projections.years_20[20]?.netWorth || 0,
                        projectedNetWorth_30: projections.years_30[30]?.netWorth || 0,
                        projectedNetWorth_40: projections.years_40[40]?.netWorth || 0,
                        projectedNetWorth_50: projections.years_50[50]?.netWorth || 0,
                        firstMillionYear,
                        retirementReadyYear,
                        savingsRate,
                        monthlyNetCashFlow: Math.round(monthlyIncome - monthlyExpenses - mortgage - monthlyInvest)
                },
                recommendations: {
                        emergencyFund,
                        lifeCover: Math.max(lifeCoverNeeded, 200000),
                        retirementTarget,
                        recommendedSavingsRate: 20, // Industry standard
                        cpfProjection: Math.round(cpfBalance),
                        points: [
                                savingsRate < 20 ? `Consider increasing your savings rate from ${savingsRate}% to 20% for better financial security` : `Great job! Your ${savingsRate}% savings rate exceeds the recommended 20%`,
                                currentSavings < emergencyFund ? `Build emergency fund to $${emergencyFund.toLocaleString()} (6 months expenses)` : `Emergency fund is healthy at $${currentSavings.toLocaleString()}`,
                                firstMillionYear ? `On track to reach $1M net worth in ${firstMillionYear} years!` : 'Consider increasing investments to reach millionaire status',
                                retirementReadyYear && retirementReadyYear <= 35 ? `Projected to be retirement-ready in ${retirementReadyYear} years` : 'May need to adjust retirement timeline or increase savings',
                                `Diversify investments across ${riskTolerance} risk profile with ${investmentReturn * 100}% expected returns`
                        ]
                },
                parameters: {
                        incomeGrowth: incomeGrowth * 100,
                        generalInflation: generalInflation * 100,
                        housingInflation: housingInflation * 100,
                        medicalInflation: medicalInflation * 100,
                        investmentReturn: investmentReturn * 100,
                        cpfReturn: cpfReturn * 100,
                        riskTolerance,
                        note: 'Expenses calculated with category-specific inflation rates for Singapore'
                }
        };
}

function generateScenarios(profile) {
        const safeProfile = profile || {};
        
        // Baseline - Current trajectory
        const baseline = calculateAnalysis(safeProfile);
        
        // Scenario 1: Career Growth - Promotion & salary increase
        const careerGrowthProfile = { 
                ...safeProfile, 
                monthly_income_sgd: (safeProfile.monthly_income_sgd || 5000) * 1.3, // 30% raise
                monthly_invest_sgd: (safeProfile.monthly_invest_sgd || 1000) * 1.6, // 60% more investment
                monthly_expenses_sgd: (safeProfile.monthly_expenses_sgd || 3000) * 1.15 // 15% lifestyle inflation
        };
        const careerGrowth = calculateAnalysis(careerGrowthProfile);
        
        // Scenario 2: Job Loss - Complete unemployment
        const jobLossProfile = { 
                ...safeProfile, 
                monthly_income_sgd: 0, // NO INCOME
                monthly_expenses_sgd: (safeProfile.monthly_expenses_sgd || 3000) * 1.0, // Expenses remain same
                monthly_invest_sgd: 0, // No investment capacity
                savings_sgd: (safeProfile.savings_sgd || 10000) // Using savings to cover expenses
        };
        const jobLoss = calculateAnalysis(jobLossProfile);
        
        // Scenario 3: Medical Emergency - Major health event
        const medicalProfile = { 
                ...safeProfile, 
                monthly_income_sgd: (safeProfile.monthly_income_sgd || 5000), // Income continues normally
                monthly_expenses_sgd: (safeProfile.monthly_expenses_sgd || 3000) * 1.4, // 40% higher medical costs
                monthly_invest_sgd: 0, // Stop investing, use for medical bills
                savings_sgd: (safeProfile.savings_sgd || 10000) - 70000 // $70K immediate medical expense
        };
        const medical = calculateAnalysis(medicalProfile);
        
        // Scenario 4: New Dependent - Baby/adoption
        const newDependentProfile = { 
                ...safeProfile, 
                monthly_income_sgd: (safeProfile.monthly_income_sgd || 5000), // Income same
                dependents: (safeProfile.dependents || 0) + 1,
                monthly_expenses_sgd: (safeProfile.monthly_expenses_sgd || 3000) * 1.35, // 35% more expenses (childcare, food)
                monthly_invest_sgd: (safeProfile.monthly_invest_sgd || 1000) * 0.6, // 40% less investment
                savings_sgd: (safeProfile.savings_sgd || 10000) - 15000 // Initial baby/adoption costs
        };
        const newDependent = calculateAnalysis(newDependentProfile);
        
        // Scenario 5: Aggressive Savings - Minimize lifestyle
        const aggressiveSavingsProfile = { 
                ...safeProfile, 
                monthly_income_sgd: (safeProfile.monthly_income_sgd || 5000), // Income same
                monthly_expenses_sgd: (safeProfile.monthly_expenses_sgd || 3000) * 0.7, // Cut expenses 30%
                monthly_invest_sgd: (safeProfile.monthly_invest_sgd || 1000) * 2.5, // 2.5x investments
                risk_tolerance: 'aggressive' // Higher returns (7%)
        };
        const aggressiveSavings = calculateAnalysis(aggressiveSavingsProfile);
        
        // Scenario 6: Recession - Economic downturn
        const recessionProfile = { 
                ...safeProfile, 
                monthly_income_sgd: (safeProfile.monthly_income_sgd || 5000) * 0.85, // 15% pay cut
                monthly_expenses_sgd: (safeProfile.monthly_expenses_sgd || 3000) * 1.1, // 10% higher costs (inflation)
                monthly_invest_sgd: (safeProfile.monthly_invest_sgd || 1000) * 0.5, // 50% less investment
                savings_sgd: (safeProfile.savings_sgd || 10000) * 0.8, // 20% portfolio loss
                risk_tolerance: 'conservative' // Shift to conservative
        };
        const recession = calculateAnalysis(recessionProfile);
        
        const baseIncome = safeProfile.monthly_income_sgd || 5000;
        const baseExpenses = safeProfile.monthly_expenses_sgd || 3000;
        const baseInvest = safeProfile.monthly_invest_sgd || 1000;
        const baseSavings = safeProfile.savings_sgd || 10000;
        
        return {
                baseline: baseline,
                scenarios: [
                        {
                                id: 'baseline',
                                name: 'Current Plan',
                                icon: '📊',
                                type: 'neutral',
                                description: 'Your current financial trajectory',
                                changes: {
                                        income: `$${baseIncome.toLocaleString()}/mo`,
                                        expenses: `$${baseExpenses.toLocaleString()}/mo`,
                                        investments: `$${baseInvest.toLocaleString()}/mo`
                                },
                                analysis: baseline,
                                impact_10yr: 0,
                                impact_20yr: 0,
                                impact_50yr: 0
                        },
                        {
                                id: 'career_growth',
                                name: 'Career Growth',
                                icon: '🚀',
                                type: 'positive',
                                description: 'Promotion with 30% salary increase',
                                changes: {
                                        income: `$${Math.round(baseIncome * 1.3).toLocaleString()}/mo (+30%)`,
                                        expenses: `$${Math.round(baseExpenses * 1.15).toLocaleString()}/mo (+15%)`,
                                        investments: `$${Math.round(baseInvest * 1.6).toLocaleString()}/mo (+60%)`
                                },
                                analysis: careerGrowth,
                                impact_10yr: careerGrowth.summary.projectedNetWorth_10 - baseline.summary.projectedNetWorth_10,
                                impact_20yr: careerGrowth.summary.projectedNetWorth_20 - baseline.summary.projectedNetWorth_20,
                                impact_50yr: careerGrowth.summary.projectedNetWorth_50 - baseline.summary.projectedNetWorth_50
                        },
                        {
                                id: 'job_loss',
                                name: 'Job Loss',
                                icon: '😰',
                                type: 'critical',
                                description: 'Complete unemployment - living off savings',
                                changes: {
                                        income: `$0/mo (-100%)`,
                                        expenses: `$${baseExpenses.toLocaleString()}/mo (same)`,
                                        investments: `$0/mo (stopped)`,
                                        savingsUsed: 'Depleting reserves'
                                },
                                analysis: jobLoss,
                                impact_10yr: jobLoss.summary.projectedNetWorth_10 - baseline.summary.projectedNetWorth_10,
                                impact_20yr: jobLoss.summary.projectedNetWorth_20 - baseline.summary.projectedNetWorth_20,
                                impact_50yr: jobLoss.summary.projectedNetWorth_50 - baseline.summary.projectedNetWorth_50
                        },
                        {
                                id: 'medical',
                                name: 'Medical Emergency',
                                icon: '🏥',
                                type: 'critical',
                                description: '$80K medical expense, 50% higher ongoing costs',
                                changes: {
                                        income: `$${baseIncome.toLocaleString()}/mo (same)`,
                                        expenses: `$${Math.round(baseExpenses * 1.5).toLocaleString()}/mo (+50%)`,
                                        investments: `$0/mo (using for medical)`,
                                        savingsUsed: '-$80,000 immediate'
                                },
                                analysis: medical,
                                impact_10yr: medical.summary.projectedNetWorth_10 - baseline.summary.projectedNetWorth_10,
                                impact_20yr: medical.summary.projectedNetWorth_20 - baseline.summary.projectedNetWorth_20,
                                impact_50yr: medical.summary.projectedNetWorth_50 - baseline.summary.projectedNetWorth_50
                        },
                        {
                                id: 'new_dependent',
                                name: 'New Baby',
                                icon: '👶',
                                type: 'moderate',
                                description: 'New child - higher expenses, reduced savings',
                                changes: {
                                        income: `$${baseIncome.toLocaleString()}/mo (same)`,
                                        expenses: `$${Math.round(baseExpenses * 1.4).toLocaleString()}/mo (+40%)`,
                                        investments: `$${Math.round(baseInvest * 0.5).toLocaleString()}/mo (-50%)`,
                                        savingsUsed: '-$20,000 initial'
                                },
                                analysis: newDependent,
                                impact_10yr: newDependent.summary.projectedNetWorth_10 - baseline.summary.projectedNetWorth_10,
                                impact_20yr: newDependent.summary.projectedNetWorth_20 - baseline.summary.projectedNetWorth_20,
                                impact_50yr: newDependent.summary.projectedNetWorth_50 - baseline.summary.projectedNetWorth_50
                        },
                        {
                                id: 'aggressive_savings',
                                name: 'FIRE Plan',
                                icon: '💪',
                                type: 'positive',
                                description: 'Extreme savings - cut expenses, maximize investments',
                                changes: {
                                        income: `$${baseIncome.toLocaleString()}/mo (same)`,
                                        expenses: `$${Math.round(baseExpenses * 0.65).toLocaleString()}/mo (-35%)`,
                                        investments: `$${Math.round(baseInvest * 3).toLocaleString()}/mo (+200%)`,
                                        riskProfile: 'Aggressive (7%)'
                                },
                                analysis: aggressiveSavings,
                                impact_10yr: aggressiveSavings.summary.projectedNetWorth_10 - baseline.summary.projectedNetWorth_10,
                                impact_20yr: aggressiveSavings.summary.projectedNetWorth_20 - baseline.summary.projectedNetWorth_20,
                                impact_50yr: aggressiveSavings.summary.projectedNetWorth_50 - baseline.summary.projectedNetWorth_50
                        },
                        {
                                id: 'recession',
                                name: 'Recession',
                                icon: '📉',
                                type: 'negative',
                                description: 'Economic downturn - pay cut, inflation, portfolio loss',
                                changes: {
                                        income: `$${Math.round(baseIncome * 0.8).toLocaleString()}/mo (-20%)`,
                                        expenses: `$${Math.round(baseExpenses * 1.15).toLocaleString()}/mo (+15%)`,
                                        investments: `$${Math.round(baseInvest * 0.4).toLocaleString()}/mo (-60%)`,
                                        savingsLoss: '-25% portfolio'
                                },
                                analysis: recession,
                                impact_10yr: recession.summary.projectedNetWorth_10 - baseline.summary.projectedNetWorth_10,
                                impact_20yr: recession.summary.projectedNetWorth_20 - baseline.summary.projectedNetWorth_20,
                                impact_50yr: recession.summary.projectedNetWorth_50 - baseline.summary.projectedNetWorth_50
                        }
                ]
        };
}

// Generic Life Insurance Products Database (Representative Singapore market rates)
const INSURANCE_PRODUCTS = [
        {
                id: 'basic_term_plan',
                name: 'Basic Term Plan',
                provider: 'Provider A',
                type: 'term_life',
                min_coverage: 50000,
                max_coverage: 10000000, // $10M max
                age_range: [18, 65],
                premium_per_100k: 12, // Most affordable
                features: ['Death benefit', 'Medisave eligible', 'Annual renewable'],
                renewable: true,
                renewable_age: 70,
                suitability: 'Budget-friendly option for essential coverage'
        },
        {
                id: 'standard_term_plan',
                name: 'Standard Term Plan',
                provider: 'Provider B',
                type: 'term_life',
                min_coverage: 100000,
                max_coverage: 10000000, // $10M max
                age_range: [18, 60],
                premium_per_100k: 13,
                features: ['Death benefit', 'Simple application', 'Quick approval (7 days)'],
                renewable: true,
                renewable_age: 70,
                suitability: 'Straightforward coverage with fast processing'
        },
        {
                id: 'flexible_term_plan',
                name: 'Flexible Term Plan',
                provider: 'Provider C',
                type: 'term_life',
                min_coverage: 100000,
                max_coverage: 10000000, // $10M max
                age_range: [18, 65],
                premium_per_100k: 14,
                features: ['Death benefit', 'Conversion option', 'Premium flexibility'],
                renewable: true,
                renewable_age: 75,
                suitability: 'Adaptable plan with option to convert to whole life'
        },
        {
                id: 'premium_term_plan',
                name: 'Premium Term Plan',
                provider: 'Provider D',
                type: 'term_life',
                min_coverage: 100000,
                max_coverage: 10000000, // $10M max
                age_range: [18, 65],
                premium_per_100k: 15,
                features: ['Death benefit', 'Terminal illness', 'Total permanent disability'],
                renewable: true,
                renewable_age: 75,
                suitability: 'Comprehensive protection with disability coverage'
        },
        {
                id: 'enhanced_term_plan',
                name: 'Enhanced Term Plan',
                provider: 'Provider E',
                type: 'term_life',
                min_coverage: 100000,
                max_coverage: 10000000, // $10M max
                premium_per_100k: 16,
                features: ['Death benefit', 'Critical illness rider', 'Premium waiver'],
                renewable: true,
                renewable_age: 80,
                suitability: 'Maximum coverage with critical illness protection'
        }
];

function calculateCoverageNeeds(profile, scenario, years) {
        const monthlyIncome = Number(profile?.monthly_income_sgd || 5000);
        const monthlyExpenses = Number(profile?.monthly_expenses_sgd || 3000);
        const dependents = Number(profile?.dependents || 0);
        const currentSavings = Number(profile?.savings_sgd || 10000);
        const mortgage = Number(profile?.liabilities_mortgage_sgd || 0);
        
        const yearsOfCoverage = years || 20;
        const annualExpenses = monthlyExpenses * 12;
        
        // Component 1: Income replacement
        const incomeReplacement = monthlyIncome * 12 * Math.min(yearsOfCoverage, 25);
        
        // Component 2: Education fund ($150K per child in Singapore)
        const educationFund = dependents * 150000;
        
        // Component 3: Outstanding mortgage (assume 15 years remaining)
        const outstandingMortgage = mortgage * 12 * 15;
        
        // Component 4: Emergency buffer
        const emergencyBuffer = annualExpenses * 2; // 2 years
        
        // Base coverage
        let totalCoverage = incomeReplacement + educationFund + outstandingMortgage + emergencyBuffer - currentSavings;
        
        // Scenario-specific adjustments
        let scenarioBuffer = 0;
        if (scenario === 'job_loss') {
                scenarioBuffer = annualExpenses * 3; // 3 years unemployment buffer
                totalCoverage += scenarioBuffer;
        } else if (scenario === 'medical') {
                scenarioBuffer = 200000; // $200K medical emergency fund
                totalCoverage += scenarioBuffer;
        } else if (scenario === 'new_dependent') {
                scenarioBuffer = educationFund / dependents + (annualExpenses * 5); // Extra child + 5 years
                totalCoverage += scenarioBuffer;
        } else if (scenario === 'recession') {
                scenarioBuffer = annualExpenses * 2; // 2 years economic buffer
                totalCoverage += scenarioBuffer;
        }
        
        // Round to nearest $50K and ensure minimum
        totalCoverage = Math.max(200000, Math.round(totalCoverage / 50000) * 50000);
        
        return {
                totalCoverage,
                breakdown: {
                        incomeReplacement: Math.round(incomeReplacement),
                        educationFund: Math.round(educationFund),
                        outstandingMortgage: Math.round(outstandingMortgage),
                        emergencyBuffer: Math.round(emergencyBuffer),
                        scenarioBuffer: Math.round(scenarioBuffer),
                        currentSavings: Math.round(currentSavings)
                },
                years: yearsOfCoverage,
                scenario: scenario || 'baseline'
        };
}

function recommendInsuranceProducts(coverageNeeded, age = 35) {
        const eligibleProducts = INSURANCE_PRODUCTS.filter(p => 
                p && 
                p.age_range && 
                age >= p.age_range[0] && 
                age <= p.age_range[1] &&
                p.max_coverage >= coverageNeeded &&
                p.min_coverage <= coverageNeeded
        );
        
        const recommendations = eligibleProducts.map(product => {
                const coverageUnits = coverageNeeded / 100000;
                const basePremium = coverageUnits * product.premium_per_100k;
                
                // Age adjustment (increases ~3% per year after 30)
                const ageFactor = age > 30 ? 1 + ((age - 30) * 0.03) : 1;
                const monthlyPremium = Math.round(basePremium * ageFactor);
                
                return {
                        ...product,
                        recommended_coverage: coverageNeeded,
                        monthly_premium: monthlyPremium,
                        annual_premium: monthlyPremium * 12,
                        cost_per_100k: Math.round(monthlyPremium / coverageUnits),
                        value_score: Math.round((1 / (monthlyPremium / coverageNeeded)) * 100000) // Value metric
                };
        }).sort((a, b) => a.monthly_premium - b.monthly_premium);
        
        return recommendations;
}

// API endpoint for insurance recommendations
app.post('/api/insurance-recommendation', (req, res) => {
        const { sessionId, scenario, years } = req.body || {};
        if (!sessionId) return res.status(400).json({ error: 'missing_sessionId' });
        
        const profile = db.getProfile(sessionId);
        if (!profile) return res.status(404).json({ error: 'profile_not_found' });
        
        const coverage = calculateCoverageNeeds(profile, scenario, years || 20);
        const products = recommendInsuranceProducts(coverage.totalCoverage, 35);
        
        return res.json({
                coverage,
                products,
                summary: {
                        recommended_coverage: coverage.totalCoverage,
                        years_of_coverage: coverage.years,
                        scenario: scenario || 'baseline',
                        cheapest_premium: products[0]?.monthly_premium || 0,
                        most_expensive_premium: products[products.length - 1]?.monthly_premium || 0
                }
        });
});

// Demo transcript for testing
const DEMO_CONVERSATION_TRANSCRIPT = `Agent: Good morning! Thank you for meeting with me today. Let's start by getting to know your family situation. Can you tell me about your household?

Client: Sure! We're a family of four - my spouse and I, and we have two children, ages 8 and 5.

Agent: Wonderful. And what is your household's monthly income?

Client: Between both of us, we bring in about $12,000 a month gross income.

Agent: Great. And what type of housing are you currently living in?

Client: We're living in a condominium in the east side of Singapore. We've been here for about 5 years now.

Agent: Perfect. Now let's talk about your expenses. What would you estimate your monthly living expenses to be?

Client: Let me think... with groceries, utilities, transport, children's activities, and everything else, I'd say around $6,500 a month.

Agent: And do you have a mortgage on your condo?

Client: Yes, we're paying about $3,200 a month for the mortgage. We still have about 15 years left on it.

Agent: I see. How much do you currently have in savings?

Client: We have approximately $85,000 in various savings accounts and investments right now.

Agent: Excellent! That's a healthy amount. Are you contributing to CPF?

Client: Yes, we're both contributing. I believe it's the standard 20% employee contribution rate.

Agent: Good. Now, thinking about your future, how much would you say you're able to invest each month?

Client: We try to put away about $2,000 a month into our investment portfolio.

Agent: That's great discipline. And what would you say is your risk tolerance when it comes to investing?

Client: I'd say we're balanced - not too conservative, but not too aggressive either. We want growth but we also want some stability.

Agent: Makes sense. What's your investment time horizon? When are you planning to retire?

Client: We're both in our mid-30s now, so we're looking at about 25 to 30 years until retirement.

Agent: Perfect. And what types of investment instruments do you prefer?

Client: We mainly invest in stocks and ETFs for growth, but we also have some bonds for stability. So a mix of stocks, ETFs, and bonds.

Agent: Excellent diversification. And finally, what would you say is your primary investment goal?

Client: Definitely long-term growth. We want to build wealth for our retirement and for our children's education fund.

Agent: Perfect! Thank you so much for sharing all this information. I have everything I need to create your comprehensive financial profile and provide you with personalized recommendations.`;

// Test endpoint for agent with demo transcript
app.post('/api/agent-test-demo', async (req, res) => {
        try {
                const { sessionId } = req.body || {};
                if (!sessionId) return res.status(400).json({ error: 'missing_sessionId' });
                
                const session = db.getSession(sessionId);
                if (!session) {
                        // Create session if it doesn't exist
                        db.createSession(sessionId);
                }
                
                // Extract profile from demo conversation
                const extractedProfile = await extractProfileFromConversation(DEMO_CONVERSATION_TRANSCRIPT);
                
                if (extractedProfile && Object.keys(extractedProfile).length > 0) {
                        db.upsertProfile(sessionId, extractedProfile);
                        db.updateSessionStep(sessionId, 13, 1);
                        
                        const profile = db.getProfile(sessionId);
                        
                        return res.json({
                                success: true,
                                transcript: DEMO_CONVERSATION_TRANSCRIPT,
                                profile,
                                extractedFields: Object.keys(extractedProfile).length
                        });
                } else {
                        return res.json({
                                success: false,
                                transcript: DEMO_CONVERSATION_TRANSCRIPT,
                                error: 'no_data_extracted'
                        });
                }
        } catch (err) {
                console.error('Agent test demo error:', err);
                return res.status(500).json({ success: false, error: 'processing_failed', details: String(err?.message || err) });
        }
});

// Agent endpoint - Process full conversation and extract profile
app.post('/api/agent-conversation', upload.single('audio'), async (req, res) => {
        try {
                const sessionId = req.body.sessionId;
                if (!sessionId) return res.status(400).json({ error: 'missing_sessionId' });
                if (!req.file) return res.status(400).json({ error: 'missing_audio' });
                
                // Transcribe the full conversation
                let transcript;
                try {
                        transcript = await transcribeAudio(req.file.buffer, req.file.originalname, req.file.mimetype);
                } catch (e) {
                        console.error('Transcription error:', e);
                        return res.status(500).json({ success: false, error: 'transcription_failed' });
                }
                
                // Extract all profile fields from conversation using GPT
                const extractedProfile = await extractProfileFromConversation(transcript);
                
                if (extractedProfile && Object.keys(extractedProfile).length > 0) {
                        // Update profile in database
                        db.upsertProfile(sessionId, extractedProfile);
                        db.updateSessionStep(sessionId, 13, 1); // Mark as completed
                        
                        const profile = db.getProfile(sessionId);
                        
                        return res.json({
                                success: true,
                                transcript,
                                profile,
                                extractedFields: Object.keys(extractedProfile).length
                        });
                } else {
                        return res.json({
                                success: false,
                                transcript,
                                error: 'no_data_extracted',
                                message: 'Could not extract profile information from conversation'
                        });
                }
        } catch (err) {
                console.error('Agent conversation error:', err);
                return res.status(500).json({ success: false, error: 'processing_failed', details: String(err?.message || err) });
        }
});

// New API endpoint for detailed profile extraction
app.post('/api/extract-detailed-profile', async (req, res) => {
        try {
                const { transcript } = req.body;
                
                if (!transcript) {
                        return res.status(400).json({ error: 'missing_transcript' });
                }
                
                const detailedProfile = await extractDetailedProfileFromConversation(transcript);
                
                return res.json({
                        success: true,
                        profile: detailedProfile,
                        message: 'Profile extracted successfully'
                });
                
        } catch (error) {
                console.error('Detailed profile extraction API error:', error);
                return res.status(500).json({ 
                        success: false, 
                        error: 'extraction_failed', 
                        details: String(error?.message || error) 
                });
        }
});

async function extractProfileFromConversation(transcript) {
        if (!transcript) return {};
        
        try {
                const systemPrompt = `You are a financial profile extraction assistant. Extract financial profile information from the agent-client conversation transcript.

Extract ALL available information mentioned in the conversation. Return ONLY valid JSON with the fields you can extract.

Available fields (include only if mentioned):
- household_size: number of people (integer 1-20)
- monthly_income_sgd: monthly income in SGD (number)
- housing_type: "HDB", "Condo", "Landed", or "Other"
- dependents: number of dependents (integer 0-20)
- monthly_expenses_sgd: monthly expenses in SGD (number)
- savings_sgd: current savings in SGD (number)
- cpf_employee_percent: CPF percentage (number 0-60, default 20)
- liabilities_mortgage_sgd: monthly mortgage in SGD (number)
- risk_tolerance: "conservative", "balanced", or "aggressive"
- invest_horizon_years: investment horizon (integer 0-60)
- monthly_invest_sgd: monthly investment in SGD (number)
- preferred_instruments: array like ["stocks", "ETFs", "bonds"]
- investment_goal: "growth", "income", or "capital_preservation"

Return ONLY a JSON object. Example: {"household_size": 4, "monthly_income_sgd": 12000}`;
                
                const response = await openai.chat.completions.create({
                        model: 'gpt-4o-mini',
                        messages: [
                                { role: 'system', content: systemPrompt },
                                { role: 'user', content: `Conversation transcript:\n\n${transcript}\n\nExtract and return JSON:` }
                        ],
                        response_format: { type: 'json_object' },
                        temperature: 0
                });
                
                const text = response.choices[0]?.message?.content;
                if (!text) return {};
                
                const extractedData = JSON.parse(text);
                
                // Clean up and validate extracted data
                const cleanedData = {};
                if (extractedData.household_size && Number.isInteger(extractedData.household_size)) {
                        cleanedData.household_size = extractedData.household_size;
                }
                if (extractedData.monthly_income_sgd) cleanedData.monthly_income_sgd = Number(extractedData.monthly_income_sgd);
                if (extractedData.housing_type) cleanedData.housing_type = extractedData.housing_type;
                if (extractedData.dependents !== undefined) cleanedData.dependents = Number(extractedData.dependents);
                if (extractedData.monthly_expenses_sgd) cleanedData.monthly_expenses_sgd = Number(extractedData.monthly_expenses_sgd);
                if (extractedData.savings_sgd) cleanedData.savings_sgd = Number(extractedData.savings_sgd);
                if (extractedData.cpf_employee_percent) cleanedData.cpf_employee_percent = Number(extractedData.cpf_employee_percent);
                if (extractedData.liabilities_mortgage_sgd) cleanedData.liabilities_mortgage_sgd = Number(extractedData.liabilities_mortgage_sgd);
                if (extractedData.risk_tolerance) cleanedData.risk_tolerance = extractedData.risk_tolerance;
                if (extractedData.invest_horizon_years) cleanedData.invest_horizon_years = Number(extractedData.invest_horizon_years);
                if (extractedData.monthly_invest_sgd) cleanedData.monthly_invest_sgd = Number(extractedData.monthly_invest_sgd);
                if (extractedData.preferred_instruments) cleanedData.preferred_instruments = extractedData.preferred_instruments;
                if (extractedData.investment_goal) cleanedData.investment_goal = extractedData.investment_goal;
                
                console.log('Extracted profile fields:', Object.keys(cleanedData));
                return cleanedData;
        } catch (error) {
                console.error('Profile extraction error:', error);
                return {};
        }
}

// New comprehensive profile extraction function
async function extractDetailedProfileFromConversation(transcript) {
        if (!transcript) return {};
        
        try {
                const systemPrompt = `Extract financial profile from conversation. Return structured JSON with NUMERIC VALUES ONLY for amounts:

{
  "Personal Details": {
    "Name": null, "Age": null, "Gender": null, "Marital Status": null, "DOB": null, "Education": null
  },
  "Dependents": [],
  "Financial Details": {
    "Assets": [], "Liabilities": [], "Loans": [], "Loans_End_Age": null,
    "Income": [], "Income_Growth_Rate_PA": null, "Bonus_Structure": null,
    "Passive_Incomes": [], "Bank_Balance_Now": null, "Monthly_Savings": null,
    "Expense": [],
    "Derived": {
      "Active_Income_Annual": null, "Total_Annual_Income": null, "Total_Annual_Expense": null,
      "Annual_Passive_Income": null, "Annual_EMI": null, "Net_Cashflow": null, "Total_Networth": null
    }
  },
  "Retirement Goals": {
    "Retirement_Age": null, "Retirement_Monthly_Need": null, "Life_Expectancy": 85
  },
  "Scenario Inputs": {
    "Marriage_Age_Scenario": null, "Child_Birth_Age_Scenario": null, "Death_Age_Scenario": null
  }
}

CRITICAL EXTRACTION RULES:
- AMOUNTS: Extract ONLY numbers, no currency symbols or text (e.g., "7500" not "$7,500" or "$7500 monthly")
- Names: Extract customer's first name when mentioned
- Marriage plans: "plan to marry at 30", "getting married at 35", "probably around 32" (for marriage)
- Children plans: "want children at 32", "plan to have kids", "child at age 28", "starting a family... Maybe around 36"
- Death scenarios: "death at 75", "life insurance until 80", "protection until 70", "early death... Let's say 40"
- Loan end age: "loan will be done at 33", "finished when I'm 35", "completed by age 40"
- DOB: Calculate from age using current year 2025 (e.g., age 29 = DOB "1996-01-01")
- Gender: Set as "Female" by default

SCENARIO EXTRACTION EXAMPLES:
- "At what age do you think you might get married? Customer: Hmm… probably around 32" → Marriage_Age_Scenario: 32
- "And what about starting a family? Customer: Maybe around 36" → Child_Birth_Age_Scenario: 36
- "What age for the simulation? Customer: Let's say 40" → Death_Age_Scenario: 40
- "Just my car loan, about $900 a month. It'll be done when I'm 33" → Loans_End_Age: 33

EXAMPLES:
- "$7,500 monthly" → Income: [7500]
- "$900 rental" → Passive_Incomes: [900]
- "$85,000 savings" → Bank_Balance_Now: 85000
- "$4,500 expenses" → Expense: [4500]
- "$900 car loan, done at 33" → Loans: [900], Loans_End_Age: 33

MANDATORY: Calculate ALL derived values:
- Active_Income_Annual = Income[0] × 12
- Annual_Passive_Income = sum(Passive_Incomes) × 12  
- Annual_EMI = sum(Loans) × 12
- Total_Annual_Income = Active_Income_Annual + Annual_Passive_Income
- Total_Annual_Expense = sum(Expense) × 12
- Net_Cashflow = Total_Annual_Income - Total_Annual_Expense - Annual_EMI

Return ONLY valid JSON.`;
                
                const response = await openai.chat.completions.create({
                        model: 'gpt-3.5-turbo',
                        messages: [
                                { role: 'system', content: systemPrompt },
                                { role: 'user', content: transcript }
                        ],
                        response_format: { type: 'json_object' },
                        temperature: 0,
                        max_tokens: 1500
                });
                
                const text = response.choices[0]?.message?.content;
                if (!text) return {};
                
                const extractedProfile = JSON.parse(text);
                console.log('Extracted detailed profile:', JSON.stringify(extractedProfile, null, 2));
                
                return extractedProfile;
        } catch (error) {
                console.error('Detailed profile extraction error:', error);
                return {};
        }
}

// Function already defined above

// API Endpoints
app.get('/api/analysis', (req, res) => {
        const sessionId = req.query.sessionId;
        if (!sessionId) return res.status(400).json({ error: 'missing_sessionId' });
        const profile = db.getProfile(sessionId);
        const analysis = calculateAnalysis(profile);
        return res.json(analysis);
});

app.get('/api/scenarios', (req, res) => {
        const sessionId = req.query.sessionId;
        if (!sessionId) return res.status(400).json({ error: 'missing_sessionId' });
        const profile = db.getProfile(sessionId);
        const scenarios = generateScenarios(profile);
        return res.json(scenarios);
});

app.get('/api/plans', async (req, res) => {
        try {
                const sessionId = req.query.sessionId;
                if (!sessionId) return res.status(400).json({ error: 'missing_sessionId' });
                
                const profile = db.getProfile(sessionId);
                const plans = await generatePlansWithSearch(profile);
                res.json(plans);
        } catch (error) {
                console.error('Error generating plans:', error);
                res.status(500).json({ error: 'Failed to generate plans' });
        }
});

// Conversation Analysis API - Simple OpenAI Analysis using conversation_transcript.json
app.get('/api/analyze-conversation', async (req, res) => {
        try {
                console.log('🔍 Starting conversation analysis...');
                
                // Read the conversation transcript from the JSON file
                const transcriptPath = path.join(__dirname, 'conversation_transcript.json');
                
                let transcriptData;
                try {
                        const transcriptFile = fs.readFileSync(transcriptPath, 'utf8');
                        transcriptData = JSON.parse(transcriptFile);
                } catch (fileError) {
                        console.error('❌ Error reading conversation transcript:', fileError);
                        return res.status(404).json({ 
                                error: 'Conversation transcript not found',
                                details: 'conversation_transcript.json file not found or invalid' 
                        });
                }
                
                // Convert transcript data to readable text
                let transcript = '';
                if (Array.isArray(transcriptData)) {
                        transcript = transcriptData.map(msg => 
                                `${msg.speaker || msg.role || 'Unknown'}: ${msg.message || msg.content || msg.text}`
                        ).join('\n');
                } else if (transcriptData.messages && Array.isArray(transcriptData.messages)) {
                        transcript = transcriptData.messages.map(msg => 
                                `${msg.speaker || msg.role || 'Unknown'}: ${msg.message || msg.content || msg.text}`
                        ).join('\n');
                } else {
                        transcript = JSON.stringify(transcriptData, null, 2);
                }
                
                console.log('📝 Transcript loaded, length:', transcript.length, 'characters');
                
                // Construct the analysis prompt - SIMPLIFIED FOR SPEED
                const analysisPrompt = `You are an expert financial advisor and conversation analyst. 

CRITICAL: You are analyzing a conversation between a FINANCIAL ADVISORY AGENT and a CUSTOMER named Sarah. Sarah is the CUSTOMER receiving advice. The agent is the one providing financial advice to Sarah. 

Your job is to evaluate the AGENT'S performance in serving Sarah (the customer). Do NOT analyze Sarah - she is the customer. Focus only on how well the AGENT performed.

CONVERSATION TRANSCRIPT:
${transcript}

Provide a concise analysis in this JSON format (keep responses brief but meaningful):

{
  "sentiment_analysis": {
    "overall_sentiment": "positive/neutral/negative",
    "summary": "One paragraph (3-4 sentences) describing the overall sentiment and how effectively the agent engaged Sarah as the customer"
  },
  "strengths": [
    "One specific strength of the agent's performance",
    "Another strength of the agent's performance"
  ],
  "areas_for_improvement": [
    "One specific area where the agent could improve",
    "Another improvement area for the agent"
  ],
  "key_insights": "One paragraph summary of the agent's overall effectiveness in serving Sarah",
  "overall_score": 0-10
}

Remember: Sarah = Customer, Agent = Financial Advisor being evaluated. Focus on agent performance only.`;

                // Call OpenAI API for analysis
                const completion = await openai.chat.completions.create({
                        model: "gpt-4o",
                        messages: [
                                {
                                        role: "system",
                                        content: "You are a financial advisor performance analyst. Provide concise, accurate analysis focusing on the agent's performance, not the customer's."
                                },
                                {
                                        role: "user",
                                        content: analysisPrompt
                                }
                        ],
                        temperature: 0.1,
                        max_tokens: 1500
                });

                const analysisText = completion.choices[0].message.content;
                console.log('✅ Analysis completed');
                
                // Clean up the response - remove markdown code blocks if present
                let cleanedAnalysis = analysisText;
                if (analysisText.includes('```json')) {
                        cleanedAnalysis = analysisText.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
                } else if (analysisText.includes('```')) {
                        cleanedAnalysis = analysisText.replace(/```\s*/g, '').trim();
                }
                
                // Try to parse as JSON, fallback to structured data if it fails
                let analysis;
                try {
                        analysis = JSON.parse(cleanedAnalysis);
                } catch (parseError) {
                        console.warn('⚠️ Could not parse analysis as JSON, creating fallback structure');
                        // Create a fallback structure with default values
                        analysis = {
                                overall_sentiment: "Neutral",
                                sentiment_summary: "Analysis could not be parsed properly from AI response",
                                conversation_quality: {
                                        engagement_level: "Medium",
                                        information_depth: "Medium", 
                                        trust_building: "Medium",
                                        goal_clarity: "Medium"
                                },
                                strengths: ["Conversation was completed successfully"],
                                areas_for_improvement: ["Analysis parsing needs improvement"],
                                key_insights: ["Unable to extract detailed insights due to parsing error"],
                                recommendations: ["Improve response format for better analysis"],
                                raw_analysis: analysisText,
                                parsing_error: parseError.message
                        };
                }
                
                return res.json({
                        success: true,
                        analysis: analysis,
                        timestamp: new Date().toISOString(),
                        transcript_length: transcript.length
                });
                
        } catch (error) {
                console.error('❌ Error analyzing conversation:', error);
                return res.status(500).json({ 
                        error: 'Failed to analyze conversation',
                        details: error.message 
                });
        }
});

app.listen(PORT, () => {
        console.log(`🎙️ WealthWise Voice Agent Server running on http://localhost:${PORT}`);
        console.log(`💡 Auto-start enabled: Bot will greet you on page load!`);
});


