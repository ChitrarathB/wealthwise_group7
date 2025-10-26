require('dotenv').config();
const path = require('path');
const express = require('express');
const multer = require('multer');
const { customAlphabet } = require('nanoid');
const { OpenAI } = require('openai');
const { toFile } = require('openai/uploads');
const db = require('./src/db');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const PORT = process.env.PORT || 3000;
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
	return '';
}

async function tts(text) {
	const resp = await openai.audio.speech.create({
		model: 'gpt-4o-mini-tts',
		voice: 'alloy',
		input: text,
		format: 'wav'
	});
	const arrayBuffer = await resp.arrayBuffer();
	return Buffer.from(arrayBuffer);
}

async function transcribeAudio(buffer, originalName, mimeType) {
	let fileLike;
	try {
		if (typeof Blob !== 'undefined') {
			const blob = new Blob([buffer], { type: mimeType || 'application/octet-stream' });
			fileLike = await toFile(blob, originalName || 'audio');
		} else {
			fileLike = await toFile(buffer, originalName || 'audio');
		}
		const tr = await openai.audio.transcriptions.create({
			model: 'gpt-4o-mini-transcribe',
			file: fileLike
		});
		return tr.text || tr?.results?.[0]?.alternatives?.[0]?.transcript || '';
	} catch (e) {
		console.error('transcribeAudio error:', e);
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
		const sessionId = 'demo-session-123';
		const assistantText = "Welcome to your complete WealthWise financial profile! All sections are ready for your review.";
		
		return res.json({ 
			sessionId, 
			assistantText, 
			audio: null, 
			profile: DEMO_PROFILE, 
			currentStep: 13, 
			completed: true, 
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

app.get('/api/analysis', (req, res) => {
	const sessionId = req.query.sessionId;
	if (!sessionId) return res.status(400).json({ error: 'missing_sessionId' });
	const analysis = calculateAnalysis(DEMO_PROFILE);
	return res.json(analysis);
});

app.get('/api/scenarios', (req, res) => {
	const sessionId = req.query.sessionId;
	if (!sessionId) return res.status(400).json({ error: 'missing_sessionId' });
	const scenarios = generateScenarios(DEMO_PROFILE);
	return res.json(scenarios);
});

// Plans endpoint with live search
app.get('/api/plans', async (req, res) => {
	try {
		const sessionId = req.query.sessionId;
		if (!sessionId) return res.status(400).json({ error: 'missing_sessionId' });
		
		const plans = await generatePlansWithSearch(DEMO_PROFILE);
		res.json(plans);
	} catch (error) {
		console.error('Error generating plans:', error);
		res.status(500).json({ error: 'Failed to generate plans' });
	}
});

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

			const confirm = shortConfirmText(step, extraction.value);
			nextStep = step + 1;
			const nextQ = getQuestionByStep(nextStep);
			if (nextQ) {
				assistantText = `${confirm} ${nextQ}`;
			} else {
				assistantText = `${confirm} Thanks! Your basic profile is ready.`;
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

// Demo data for presentation
const DEMO_PROFILE = {
	session_id: 'demo-session-123',
	household_size: 4,
	monthly_income_sgd: 12000,
	housing_type: 'condo',
	dependents: 2,
	monthly_expenses_sgd: 6500,
	savings_sgd: 85000,
	cpf_employee_percent: 20,
	liabilities_mortgage_sgd: 3200,
	risk_tolerance: 'moderate',
	invest_horizon_years: 25,
	monthly_invest_sgd: 2000,
	preferred_instruments: ['stocks', 'ETFs', 'bonds'],
	investment_goal: 'growth',
	updated_at: new Date().toISOString()
};

const DEMO_MESSAGES = [
	{ role: 'assistant', content: "Hi! I'm your Singapore financial profile assistant. Let's get started. How many people are in your household?", timestamp: new Date(Date.now() - 300000).toISOString() },
	{ role: 'user', content: "We are a family of 4 people", timestamp: new Date(Date.now() - 290000).toISOString() },
	{ role: 'assistant', content: "Got it — household size: 4. What's your household's monthly gross income in SGD?", timestamp: new Date(Date.now() - 280000).toISOString() },
	{ role: 'user', content: "Our monthly income is twelve thousand dollars", timestamp: new Date(Date.now() - 270000).toISOString() },
	{ role: 'assistant', content: "Thanks — monthly gross income noted: $12,000 SGD. What type of housing do you live in: HDB, condo, landed, or other?", timestamp: new Date(Date.now() - 260000).toISOString() },
	{ role: 'user', content: "We live in a condominium", timestamp: new Date(Date.now() - 250000).toISOString() },
	{ role: 'assistant', content: "Understood — housing type: Condo. How many dependents do you have?", timestamp: new Date(Date.now() - 240000).toISOString() },
	{ role: 'user', content: "We have 2 children", timestamp: new Date(Date.now() - 230000).toISOString() },
	{ role: 'assistant', content: "Got it — 2 dependents. Roughly what are your monthly living expenses in SGD?", timestamp: new Date(Date.now() - 220000).toISOString() },
	{ role: 'user', content: "About six thousand five hundred per month", timestamp: new Date(Date.now() - 210000).toISOString() },
	{ role: 'assistant', content: "Thanks — monthly expenses: $6,500 SGD. About how much do you currently have in savings (SGD)?", timestamp: new Date(Date.now() - 200000).toISOString() },
	{ role: 'user', content: "We have around eighty-five thousand in savings", timestamp: new Date(Date.now() - 190000).toISOString() },
	{ role: 'assistant', content: "Excellent — savings: $85,000 SGD. What is your CPF employee contribution percent?", timestamp: new Date(Date.now() - 180000).toISOString() },
	{ role: 'user', content: "Twenty percent", timestamp: new Date(Date.now() - 170000).toISOString() },
	{ role: 'assistant', content: "Noted — CPF contribution: 20%. Do you have a monthly mortgage? If yes, how much in SGD?", timestamp: new Date(Date.now() - 160000).toISOString() },
	{ role: 'user', content: "Yes, our mortgage is three thousand two hundred monthly", timestamp: new Date(Date.now() - 150000).toISOString() },
	{ role: 'assistant', content: "Got it — mortgage: $3,200/month. What's your risk tolerance: conservative, moderate, or aggressive?", timestamp: new Date(Date.now() - 140000).toISOString() },
	{ role: 'user', content: "We prefer a moderate risk approach", timestamp: new Date(Date.now() - 130000).toISOString() },
	{ role: 'assistant', content: "Perfect — risk tolerance: Moderate. What's your investment horizon in years?", timestamp: new Date(Date.now() - 120000).toISOString() },
	{ role: 'user', content: "About twenty-five years until retirement", timestamp: new Date(Date.now() - 110000).toISOString() },
	{ role: 'assistant', content: "Great — investment horizon: 25 years. How much can you invest monthly in SGD?", timestamp: new Date(Date.now() - 100000).toISOString() },
	{ role: 'user', content: "We can invest two thousand monthly", timestamp: new Date(Date.now() - 90000).toISOString() },
	{ role: 'assistant', content: "Excellent — monthly investment: $2,000. What investment instruments do you prefer?", timestamp: new Date(Date.now() - 80000).toISOString() },
	{ role: 'user', content: "We like stocks, ETFs, and some bonds for stability", timestamp: new Date(Date.now() - 70000).toISOString() },
	{ role: 'assistant', content: "Perfect — preferred instruments: Stocks, ETFs, Bonds. What's your primary investment goal?", timestamp: new Date(Date.now() - 60000).toISOString() },
	{ role: 'user', content: "Long-term growth for our family's future", timestamp: new Date(Date.now() - 50000).toISOString() },
	{ role: 'assistant', content: "Excellent! Your comprehensive financial profile is now complete. You can explore your Analysis, Scenarios, and personalized Plans in the tabs above.", timestamp: new Date(Date.now() - 40000).toISOString() }
];

app.listen(PORT, () => {
	console.log(`🎭 DEMO Server running on http://localhost:${PORT}`);
	console.log(`📊 Pre-loaded with complete profile data for presentation`);
});


