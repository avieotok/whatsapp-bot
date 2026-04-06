const axios = require("axios");

const BASE_URL = "https://graph.facebook.com/v19.0";
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const TOKEN = process.env.WHATSAPP_TOKEN;

/**
 * Send a plain text message via WhatsApp Cloud API
 */
async function sendMessage(to, text) {
  try {
    const res = await axios.post(
      `${BASE_URL}/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text },
      },
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log(`[WA] ✅ Sent to ${to}: "${text.substring(0, 60)}..."`);
    return res.data;
  } catch (err) {
    const msg = err.response?.data?.error?.message || err.message;
    console.error(`[WA] ❌ Failed to send to ${to}: ${msg}`);
    throw err;
  }
}

/**
 * Mark an incoming message as "read" (shows double blue ticks)
 */
async function markAsRead(messageId) {
  try {
    await axios.post(
      `${BASE_URL}/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        status: "read",
        message_id: messageId,
      },
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (_) {
    // Non-critical — ignore silently
  }
}

module.exports = { sendMessage, markAsRead };
