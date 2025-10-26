require('dotenv').config();
const { OpenAI } = require('openai');
const { toFile } = require('openai/uploads');
const fs = require('fs');

async function main() {
	const filePath = process.argv[2];
	if (!filePath || !fs.existsSync(filePath)) {
		console.error('Usage: node scripts/test_transcribe.js <path-to-audio>');
		process.exit(1);
	}
	const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
	const buffer = fs.readFileSync(filePath);
	const file = await toFile(buffer, filePath);
	const tr = await openai.audio.transcriptions.create({
		model: 'gpt-4o-mini-transcribe',
		file
	});
	console.log(tr);
}

main().catch((e) => { console.error(e); process.exit(1); });


