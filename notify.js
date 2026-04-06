const { sendMessage } = require("./whatsapp");

/**
 * Send a WhatsApp notification to the bot owner
 * when someone finishes the screening flow.
 *
 * The message includes:
 *  - Caller's phone number
 *  - All Q&A pairs
 *  - A reminder of the admin API commands
 */
async function notifyOwner(session) {
  const ownerPhone = process.env.OWNER_PHONE;
  if (!ownerPhone) {
    console.warn("[Notify] OWNER_PHONE not set — skipping notification");
    return;
  }

  const qaLines = session.answers
    .map((a, i) => `${i + 1}. ${a.question}\n   → ${a.answer}`)
    .join("\n\n");

  const msg =
    `📬 פנייה חדשה ממתינה לאישור!\n\n` +
    `📱 מספר: ${session.phone}\n` +
    `🕐 הגיע: ${new Date().toLocaleString("he-IL")}\n\n` +
    `─────────────────\n` +
    `${qaLines}\n` +
    `─────────────────\n\n` +
    `לאישור: שלח *אשר ${session.phone}*\n` +
    `לדחייה: שלח *דחה ${session.phone}*`;

  await sendMessage(ownerPhone, msg);
}

/**
 * Optional: also notify via Telegram
 * Requires TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in .env
 */
async function notifyTelegram(session) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  try {
    const axios = require("axios");
    const qaLines = session.answers
      .map((a, i) => `${i + 1}. *${a.question}*\n→ ${a.answer}`)
      .join("\n\n");

    const text =
      `📬 *פנייה חדשה* ממתינה לאישור!\n\n` +
      `📱 ${session.phone}\n\n` +
      `${qaLines}\n\n` +
      `השתמש בלוח הבקרה לאישור/דחייה.`;

    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
    });
  } catch (err) {
    console.warn("[Telegram] Failed to notify:", err.message);
  }
}

module.exports = { notifyOwner, notifyTelegram };
