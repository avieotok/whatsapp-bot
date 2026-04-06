require("dotenv").config();
const express = require("express");
const app = express();
app.use(express.json());
const { sendMessage, markAsRead } = require("./whatsapp");
const { notifyOwner, notifyTelegram } = require("./notify");
const store = require("./sessionStore");
const config = require("./questions");
const OWNER_PHONE = process.env.OWNER_PHONE;
async function handleMessage({ from, text, messageId }) {
  await markAsRead(messageId);
  if (from === OWNER_PHONE) return handleOwnerCommand(text);
  let session = store.getSession(from);
  if (!session) {
    session = store.createSession(from);
    await sendMessage(from, config.welcomeMessage);
    await askQuestion(from, session.step);
    return;
  }
  if (["done","approved","rejected","timeout"].includes(session.status)) {
    store.deleteSession(from);
    session = store.createSession(from);
    await sendMessage(from, config.welcomeMessage);
    await askQuestion(from, session.step);
    return;
  }
  const currentQuestion = config.questions[session.step];
  session = store.updateSession(from, {
    answers: [...session.answers, { question: currentQuestion, answer: text }],
    step: session.step + 1,
  });
  if (session.step < config.questions.length) { await askQuestion(from, session.step); return; }
  store.updateSession(from, { status: "done" });
  await sendMessage(from, config.thankYouMessage);
  await notifyOwner(store.getSession(from));
  await notifyTelegram(store.getSession(from));
}
async function askQuestion(phone, index) {
  const q = config.questions[index];
  if (!q) return;
  await sendMessage(phone, `שאלה ${index+1}/${config.questions.length}:\n${q}`);
}
async function handleOwnerCommand(text) {
  const n = text.trim();
  const a = n.match(/^אשר\s+(\S+)/);
  const r = n.match(/^דחה\s+(\S+)/);
  if (a) { store.updateSession(a[1], {status:"approved"}); await sendMessage(OWNER_PHONE, `✅ ${a[1]} אושר.`); return; }
  if (r) { store.updateSession(r[1], {status:"rejected"}); await sendMessage(OWNER_PHONE, `🚫 ${r[1]} נדחה.`); return; }
  await sendMessage(OWNER_PHONE, `פקודות:\n• אשר <מספר>\n• דחה <מספר>`);
}
app.get("/webhook", (req, res) => {
  if (req.query["hub.mode"]==="subscribe" && req.query["hub.verify_token"]===process.env.WHATSAPP_VERIFY_TOKEN)
    return res.status(200).send(req.query["hub.challenge"]);
  res.sendStatus(403);
});
app.post("/webhook", async (req, res) => {
  res.sendStatus(200);
  try {
    const msg = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!msg || msg.type!=="text") return;
    await handleMessage({ from: msg.from, text: msg.text.body.trim(), messageId: msg.id });
  } catch(e) { console.error(e.message); }
});
app.get("/health", (_,res) => res.json({status:"ok"}));
app.listen(process.env.PORT||10000, () => console.log("Bot running!")); 

