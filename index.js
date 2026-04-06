require("dotenv").config();

const express = require("express");
const { handleMessage, expireTimedOutSessions } = require("./botFlow");
const store = require("./sessionStore");

const app = express();
app.use(express.json());

// ════════════════════════════════════════════════════════════
//  WEBHOOK — Meta verifies this endpoint when you register it
// ════════════════════════════════════════════════════════════
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log("[Webhook] ✅ Verified by Meta");
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

// ════════════════════════════════════════════════════════════
//  WEBHOOK — Receives incoming WhatsApp messages
// ════════════════════════════════════════════════════════════
app.post("/webhook", async (req, res) => {
  // Always respond 200 immediately so Meta doesn't retry
  res.sendStatus(200);

  try {
    const entry = req.body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    // Ignore status updates (message delivered / read receipts)
    if (!value?.messages) return;

    const message = value.messages[0];
    const from = message.from; // sender's phone number

    // Only handle text messages for now
    if (message.type !== "text") {
      console.log(`[Webhook] Skipping non-text message from ${from} (type: ${message.type})`);
      return;
    }

    const text = message.text.body.trim();
    const messageId = message.id;

    console.log(`[Webhook] 📩 Message from ${from}: "${text}"`);

    await handleMessage({ from, text, messageId });

  } catch (err) {
    console.error("[Webhook] ❌ Error processing message:", err.message);
  }
});

// ════════════════════════════════════════════════════════════
//  ADMIN API — simple REST endpoints for the dashboard
// ════════════════════════════════════════════════════════════

// List all sessions
app.get("/admin/sessions", (req, res) => {
  res.json(store.getAllSessions());
});

// Get pending sessions (completed screening, waiting for owner decision)
app.get("/admin/pending", (req, res) => {
  const pending = store.getAllSessions().filter((s) => s.status === "done");
  res.json(pending);
});

// Approve a contact
app.post("/admin/approve/:phone", async (req, res) => {
  const { phone } = req.params;
  store.updateSession(phone, { status: "approved" });
  res.json({ ok: true, phone, status: "approved" });
});

// Reject a contact
app.post("/admin/reject/:phone", async (req, res) => {
  const { phone } = req.params;
  store.updateSession(phone, { status: "rejected" });
  res.json({ ok: true, phone, status: "rejected" });
});

// Health check
app.get("/health", (_, res) => res.json({ status: "ok", uptime: process.uptime() }));

// ════════════════════════════════════════════════════════════
//  BACKGROUND: expire timed-out sessions every hour
// ════════════════════════════════════════════════════════════
setInterval(expireTimedOutSessions, 60 * 60 * 1000);

// ════════════════════════════════════════════════════════════
//  START
// ════════════════════════════════════════════════════════════
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════╗
║   WhatsApp Screening Bot — Running        ║
║   Port: ${PORT}                              ║
║   Webhook: POST /webhook                  ║
║   Admin:   GET  /admin/pending            ║
╚═══════════════════════════════════════════╝
  `);
});
