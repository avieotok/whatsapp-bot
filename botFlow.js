const { sendMessage, markAsRead } = require("./whatsapp");
const { notifyOwner, notifyTelegram } = require("./notify");
const store = require("./sessionStore");
const config = require("./questions");
const OWNER_PHONE = process.env.OWNER_PHONE;

/**
 * Main entry point called for every incoming WhatsApp message.
 */
async function handleMessage({ from, text, messageId }) {
  await markAsRead(messageId);

  // ── Owner commands ──────────────────────────────────────────────────────
  // If the owner writes "אשר <phone>" or "דחה <phone>", handle it
  if (from === OWNER_PHONE) {
    return handleOwnerCommand(text);
  }

  // ── Regular user flow ────────────────────────────────────────────────────
  let session = store.getSession(from);

  // Brand new contact
  if (!session) {
    session = store.createSession(from);
    await sendMessage(from, config.welcomeMessage);
    await askQuestion(from, session.step);
    return;
  }

  // Already done / approved / rejected — restart the session
  if (["done", "approved", "rejected", "timeout"].includes(session.status)) {
    store.deleteSession(from);
    session = store.createSession(from);
    await sendMessage(from, config.welcomeMessage);
    await askQuestion(from, session.step);
    return;
  }

  // Record the answer to the current question
  const currentQuestion = config.questions[session.step];
  session = store.updateSession(from, {
    answers: [...session.answers, { question: currentQuestion, answer: text }],
    step: session.step + 1,
  });

  // More questions remain
  if (session.step < config.questions.length) {
    await askQuestion(from, session.step);
    return;
  }

  // All questions answered — wrap up
  store.updateSession(from, { status: "done" });
  await sendMessage(from, config.thankYouMessage);

  // Notify the owner
  const finalSession = store.getSession(from);
  await notifyOwner(finalSession);
  await notifyTelegram(finalSession);

  console.log(`[Flow] ✅ ${from} completed screening`);
}

/**
 * Send question number `index` to `phone`.
 */
async function askQuestion(phone, index) {
  const q = config.questions[index];
  if (!q) return;
  // Add a question counter prefix
  const total = config.questions.length;
  await sendMessage(phone, `שאלה ${index + 1}/${total}:\n${q}`);
}

/**
 * Parse and execute owner commands: "אשר <phone>" / "דחה <phone>"
 */
async function handleOwnerCommand(text) {
  const normalized = text.trim();

  const approveMatch = normalized.match(/^אשר\s+(\S+)/);
  const rejectMatch = normalized.match(/^דחה\s+(\S+)/);

  if (approveMatch) {
    const phone = approveMatch[1];
    store.updateSession(phone, { status: "approved" });
    await sendMessage(OWNER_PHONE, `✅ ${phone} אושר. תוכל לכתוב לו ישירות עכשיו.`);
    return;
  }

  if (rejectMatch) {
    const phone = rejectMatch[1];
    store.updateSession(phone, { status: "rejected" });
    await sendMessage(OWNER_PHONE, `🚫 ${phone} נדחה.`);
    return;
  }

  // Unknown owner message — echo help
  await sendMessage(
    OWNER_PHONE,
    `פקודות זמינות:\n• *אשר <מספר>* — לאשר פנייה\n• *דחה <מספר>* — לדחות פנייה`
  );
}

/**
 * Background job: expire sessions that timed out.
 * Call this on an interval (e.g. every hour).
 */
function expireTimedOutSessions() {
  const limitMs = config.timeoutHours * 60 * 60 * 1000;
  const now = Date.now();

  store.getAllSessions().forEach(async (session) => {
    if (
      session.status === "screening" &&
      now - session.lastActivityAt > limitMs
    ) {
      store.updateSession(session.phone, { status: "timeout" });
      await sendMessage(session.phone, config.timeoutMessage).catch(() => {});
      console.log(`[Timeout] ⏰ Session expired: ${session.phone}`);
    }
  });
}

module.exports = { handleMessage, expireTimedOutSessions };
