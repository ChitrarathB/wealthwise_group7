import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'data.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS sessions (
	session_id TEXT PRIMARY KEY,
	created_at TEXT DEFAULT (datetime('now')),
	current_step INTEGER DEFAULT 0,
	completed INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS profiles (
	session_id TEXT PRIMARY KEY,
	household_size INTEGER,
	monthly_income_sgd REAL,
	housing_type TEXT,
	-- New fields will be added via ALTER TABLE if missing
	dependents INTEGER,
	monthly_expenses_sgd REAL,
	savings_sgd REAL,
	cpf_employee_percent REAL,
	liabilities_mortgage_sgd REAL,
	risk_tolerance TEXT,
	updated_at TEXT DEFAULT (datetime('now')),
	FOREIGN KEY(session_id) REFERENCES sessions(session_id)
);
CREATE TABLE IF NOT EXISTS messages (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	session_id TEXT,
	role TEXT CHECK(role IN ('user','assistant','system')),
	content TEXT,
	created_at TEXT DEFAULT (datetime('now')),
	FOREIGN KEY(session_id) REFERENCES sessions(session_id)
);
`);

// Ensure new columns exist (idempotent migrations)
function ensureProfileColumn(columnName, columnType) {
	const info = db.prepare("PRAGMA table_info('profiles')").all();
	const exists = info.some((c) => c.name === columnName);
	if (!exists) {
		try {
			db.exec(`ALTER TABLE profiles ADD COLUMN ${columnName} ${columnType}`);
		} catch (_) {
			// ignore if concurrent or already added
		}
	}
}

ensureProfileColumn('dependents', 'INTEGER');
ensureProfileColumn('monthly_expenses_sgd', 'REAL');
ensureProfileColumn('savings_sgd', 'REAL');
ensureProfileColumn('cpf_employee_percent', 'REAL');
ensureProfileColumn('liabilities_mortgage_sgd', 'REAL');
ensureProfileColumn('risk_tolerance', 'TEXT');
ensureProfileColumn('invest_horizon_years', 'INTEGER');
ensureProfileColumn('monthly_invest_sgd', 'REAL');
ensureProfileColumn('preferred_instruments', 'TEXT');
ensureProfileColumn('investment_goal', 'TEXT');

function createSession(sessionId) {
	const stmt = db.prepare('INSERT INTO sessions (session_id) VALUES (?)');
	stmt.run(sessionId);
}

function getSession(sessionId) {
	const stmt = db.prepare('SELECT * FROM sessions WHERE session_id = ?');
	return stmt.get(sessionId);
}

function updateSessionStep(sessionId, step, completed) {
	const stmt = db.prepare('UPDATE sessions SET current_step = ?, completed = ? WHERE session_id = ?');
	stmt.run(step, completed ? 1 : 0, sessionId);
}

function upsertProfile(sessionId, fields) {
	const current = getProfile(sessionId);
	if (!current) {
		const stmt = db.prepare(`
		INSERT INTO profiles (
			session_id, 
			household_size, 
			monthly_income_sgd, 
			housing_type, 
			dependents, 
			monthly_expenses_sgd, 
			savings_sgd, 
			cpf_employee_percent, 
			liabilities_mortgage_sgd, 
			risk_tolerance,
			invest_horizon_years,
			monthly_invest_sgd,
			preferred_instruments,
			investment_goal,
			updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
	`);
		
		const preferredInstruments = Array.isArray(fields.preferred_instruments) 
			? JSON.stringify(fields.preferred_instruments) 
			: fields.preferred_instruments;
			
		stmt.run(
			sessionId,
			fields.household_size ?? null,
			fields.monthly_income_sgd ?? null,
			fields.housing_type ?? null,
			fields.dependents ?? null,
			fields.monthly_expenses_sgd ?? null,
			fields.savings_sgd ?? null,
			fields.cpf_employee_percent ?? null,
			fields.liabilities_mortgage_sgd ?? null,
			fields.risk_tolerance ?? null,
			fields.invest_horizon_years ?? null,
			fields.monthly_invest_sgd ?? null,
			preferredInstruments,
			fields.investment_goal ?? null
		);
		return;
	}
	const preferredInstruments = fields.preferred_instruments ?? current.preferred_instruments;
	const merged = {
		household_size: fields.household_size ?? current.household_size ?? null,
		monthly_income_sgd: fields.monthly_income_sgd ?? current.monthly_income_sgd ?? null,
		housing_type: fields.housing_type ?? current.housing_type ?? null,
		dependents: fields.dependents ?? current.dependents ?? null,
		monthly_expenses_sgd: fields.monthly_expenses_sgd ?? current.monthly_expenses_sgd ?? null,
		savings_sgd: fields.savings_sgd ?? current.savings_sgd ?? null,
		cpf_employee_percent: fields.cpf_employee_percent ?? current.cpf_employee_percent ?? null,
		liabilities_mortgage_sgd: fields.liabilities_mortgage_sgd ?? current.liabilities_mortgage_sgd ?? null,
		risk_tolerance: fields.risk_tolerance ?? current.risk_tolerance ?? null,
		invest_horizon_years: fields.invest_horizon_years ?? current.invest_horizon_years ?? null,
		monthly_invest_sgd: fields.monthly_invest_sgd ?? current.monthly_invest_sgd ?? null,
		preferred_instruments: Array.isArray(preferredInstruments) ? JSON.stringify(preferredInstruments) : preferredInstruments,
		investment_goal: fields.investment_goal ?? current.investment_goal ?? null
	};
	const stmt = db.prepare(`
		UPDATE profiles SET 
			household_size = ?,
			monthly_income_sgd = ?,
			housing_type = ?,
			dependents = ?,
			monthly_expenses_sgd = ?,
			savings_sgd = ?,
			cpf_employee_percent = ?,
			liabilities_mortgage_sgd = ?,
			risk_tolerance = ?,
			invest_horizon_years = ?,
			monthly_invest_sgd = ?,
			preferred_instruments = ?,
			investment_goal = ?,
			updated_at = datetime('now')
		WHERE session_id = ?
	`);
	stmt.run(
		merged.household_size,
		merged.monthly_income_sgd,
		merged.housing_type,
		merged.dependents,
		merged.monthly_expenses_sgd,
		merged.savings_sgd,
		merged.cpf_employee_percent,
		merged.liabilities_mortgage_sgd,
		merged.risk_tolerance,
		merged.invest_horizon_years,
		merged.monthly_invest_sgd,
		Array.isArray(merged.preferred_instruments) ? JSON.stringify(merged.preferred_instruments) : merged.preferred_instruments,
		merged.investment_goal,
		sessionId
	);
}

function getProfile(sessionId) {
	const stmt = db.prepare('SELECT * FROM profiles WHERE session_id = ?');
	return stmt.get(sessionId);
}

function addMessage(sessionId, role, content) {
	const stmt = db.prepare('INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)');
	stmt.run(sessionId, role, content);
}

function getMessages(sessionId, limit = 50) {
	const stmt = db.prepare('SELECT role, content, created_at FROM messages WHERE session_id = ? ORDER BY id DESC LIMIT ?');
	return stmt.all(sessionId, limit).reverse();
}

export default {
	createSession,
	getSession,
	updateSessionStep,
	upsertProfile,
	getProfile,
	addMessage,
	getMessages
};


