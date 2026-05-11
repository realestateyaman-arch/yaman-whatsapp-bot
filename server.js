const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { Anthropic } = require('@anthropic-ai/sdk');

// 1. شغل Claude
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// 2. شغل واتساب مع الحل تبع Render
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ],
    }
});

// 3. بس يجهز QR اطبعو بالـ Logs
client.on('qr', qr => {
    console.log('Scan this QR Code to link WhatsApp:');
    qrcode.generate(qr, { small: true });
});

// 4. بس يشبك
client.on('ready', () => {
    console.log('Client is ready! البوت شغال ✅');
});

// 5. بس توصلك رسالة
client.on('message', async msg => {
    console.log('Message received:', msg.body);

    // تجاهل رسايلك انت والجروبات
    if (msg.fromMe || msg.from.includes('@g.us')) return;

    try {
        // ابعت للعميل "عم يكتب..."
        const chat = await msg.getChat();
        chat.sendStateTyping();

        // اسأل Claude
        const response = await anthropic.messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 300,
            system: "انت موظف مبيعات عند Yaman Real Estate. جاوب باحتراف واختصار باللهجة اللبنانية. اسأل عن الميزانية والمنطقة والمساحة. لا تعطي وعود كاذبة.",
            messages: [{
                role: "user",
                content: msg.body
            }]
        });

        const reply = response.content[0].text;

        // رد على الزبون
        msg.reply(reply);

    } catch (error) {
        console.error('Error:', error);
        msg.reply('عذراً صار خطأ تقني. فيك تتواصل مع يمان دغري على 76088855');
    }
});

// 6. شغل البوت
client.initialize();

// 7. عشان Render ما يفكر السيرفر واقع
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Yaman WhatsApp Bot is running ✅');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
