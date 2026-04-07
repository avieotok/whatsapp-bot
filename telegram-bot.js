require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const store = require("./sessionStore");
const config = require("./questions");

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OWNER_ID = process.env.TELEGRAM_OWNER_ID;
const bot = new TelegramBot(TOKEN, { polling: true });

bot.on("message", async (msg) => {
  if (msg.chat.type !== "private") return;
  const chatId = msg.chat.id.toString();
  const text = msg.text?.trim();
  if (!text) return;

  if (chatId === OWNER_ID) {
    const approveMatch = text.match(/^אשר\s+(\S+)/);
    const rejectMatch = text.match(/^דחה\s+(\S+)/);
    if (approveMatch) {
      store.updateSession(approveMatch[1], { status: "approved" });
      bot.sendMessage(OWNER_ID, `✅ ${approveMatch[1]} אושר.`);
    } else if (rejectMatch) {
      store.updateSession(rejectMatch[1], { status: "rejected" });
      bot.sendMessage(OWNER_ID, `🚫 ${rejectMatch[1]} נדחה.`);
    }
    return;
  }

  let session = store.getSession(chatId);
  if (!session || ["done","approved","rejected"].includes(session.status)) {
    store.deleteSession(chatId);
    session = store.createSession(chatId);
    bot.sendMessage(chatId, config.welcomeMessage);
    bot.sendMessage(chatId, `שאלה 1/${config.questions.length}:\n${config.questions[0]
