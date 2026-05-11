const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const config = require('./config.json');
const Anthropic = require('@anthropic-ai/sdk');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY
});

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', qr => {
    console.log('=== SCAN THIS QR CODE ===');
    qrcode.generate(qr, {small: true});
    console.log('=== QR END ===');
});

client.on('ready', () => {
    console.log('WhatsApp Connected - yaman real estate ready');
});

client.on('message', async msg => {
    if (msg.fromMe) return;

    const today = new Date().toLocaleDateString('ar-LB', { weekday: 'long' });
    if (today === process.env.DAY_OFF) {
        await msg.reply(`عذراً نحن اليوم ${process.env.DAY_OFF} عطلة. منرجع نخدمك بكرا من ${config.working_hours.start}. للطوارئ: ${config.phone}`);
        return;
    }

    const systemPrompt = `انت ${config.bot_name} من ${config.company_name} بـ ${config.address}.
    خدماتك: ${config.services.join('، ')}.
    دوامك: ${config.working_hours.days.join('، ')} من ${config.working_hours.start} للـ ${config.working_hours.end}.
    رقم التواصل: ${config.phone}
    هدفك: تحجز موعد كشف عقاري خلال ${config.booking_duration_minutes} دقيقة.
    اسأل عن: نوع الخدمة، الميزانية، المنطقة، الموعد المناسب.
    رد باللهجة اللبنانية، محترم ومختصر. سؤال واحد كل مرة.`;

    try {
        const completion = await anthropic.messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 300,
            system: systemPrompt,
            messages: [{role: "user", content: msg.body}],
        });
        await msg.reply(completion.content[0].text);
    } catch (error) {
        console.log('Error:', error);
        await msg.reply('صار خطأ. تواصل معنا: ' + config.phone);
    }
});

app.get('/', (req, res) => {
    res.send('yaman real estate bot is running ✅');
});

app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
    client.initialize();
});

module.exports = app;
