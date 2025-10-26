require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');

async function main() {
	const text = process.argv.slice(2).join(' ').trim() || 'test';
    const out = path.resolve(process.cwd(), `tts_${Date.now()}.mp3`);
	const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const resp = await openai.audio.speech.create({
		model: 'gpt-4o-mini-tts',
		voice: 'alloy',
		input: text,
		format: 'mp3'
	});
	const buf = Buffer.from(await resp.arrayBuffer());
	fs.writeFileSync(out, buf);
	console.log(out);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});


