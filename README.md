# בוט סינון WhatsApp

בוט שמסנן פניות נכנסות: שואל שאלות מותאמות אישית, ואחרי שמישהו עונה — שולח לך התראה ואתה מחליט אם לאשר.

---

## מבנה הפרויקט

```
whatsapp-bot/
├── config/
│   └── questions.js       ← ✏️  ערוך כאן את השאלות שלך
├── src/
│   ├── index.js           ← שרת Express + Webhook
│   ├── botFlow.js         ← לוגיקת הסינון
│   ├── whatsapp.js        ← שליחת הודעות דרך Meta API
│   ├── notify.js          ← שליחת התראה לבעל הבוט
│   └── sessionStore.js    ← שמירת מצב השיחות
├── .env.example           ← העתק ל-.env ומלא
└── package.json
```

---

## הגדרה מהירה (3 שלבים)

### שלב 1 — חשבון Meta Developer

1. כנס ל-[developers.facebook.com](https://developers.facebook.com)
2. צור אפליקציה חדשה → בחר **Business**
3. הוסף מוצר → **WhatsApp**
4. תחת **API Setup** קבל:
   - `Phone Number ID` → שמור ב-.env בשדה `WHATSAPP_PHONE_NUMBER_ID`
   - `Temporary Access Token` (או צור Permanent Token) → `WHATSAPP_TOKEN`

---

### שלב 2 — פריסת השרת (חינמי ב-Railway)

```bash
# 1. Clone / העלה את הפרויקט ל-GitHub

# 2. כנס ל- railway.app → New Project → Deploy from GitHub

# 3. הוסף את משתני הסביבה מ-.env.example בממשק Railway

# 4. Railway ייתן לך URL כמו:
#    https://whatsapp-bot-production.up.railway.app
```

**חלופה חינמית:** [render.com](https://render.com) — Web Service → בחר repo → הוסף env vars.

---

### שלב 3 — חיבור Webhook ב-Meta

1. ב-Meta Developer Console → WhatsApp → Configuration → Webhook
2. הדבק את ה-URL שלך:
   ```
   https://YOUR-SERVER-URL/webhook
   ```
3. ב-**Verify Token** הכנס את אותו המחרוזת שבחרת ב-`WHATSAPP_VERIFY_TOKEN`
4. לחץ **Verify and Save**
5. Subscribe ל-**messages**

---

## שינוי השאלות

ערוך את הקובץ `config/questions.js`:

```js
module.exports = {
  welcomeMessage: "שלום! יש לי כמה שאלות לפני שנמשיך...",

  questions: [
    "מה שמך המלא?",
    "מה הסיבה לפנייתך?",
    "האם אתה לקוח קיים?",
  ],

  thankYouMessage: "תודה! נחזור אליך בקרוב.",
  timeoutHours: 24,
};
```

---

## קבלת התראות

### אופציה א׳ — WhatsApp לנייד שלך
הבוט שולח הודעת WhatsApp ישירות למספר ב-`OWNER_PHONE`.

כשמגיעה פנייה תקבל:
```
📬 פנייה חדשה ממתינה לאישור!

📱 מספר: 972541234567
🕐 הגיע: 6.4.2026, 14:32

─────────────────
1. מה שמך המלא?
   → דני כהן

2. מה הסיבה לפנייתך?
   → מעוניין בהצעת מחיר
─────────────────

לאישור: שלח *אשר 972541234567*
לדחייה: שלח *דחה 972541234567*
```

### אופציה ב׳ — Telegram (אופציונלי)
מלא `TELEGRAM_BOT_TOKEN` ו-`TELEGRAM_CHAT_ID` ב-.env.

---

## Admin API

| Method | Path | תיאור |
|--------|------|--------|
| GET | `/admin/pending` | רשימת פניות שממתינות |
| POST | `/admin/approve/:phone` | אישור פנייה |
| POST | `/admin/reject/:phone` | דחיית פנייה |
| GET | `/admin/sessions` | כל השיחות |
| GET | `/health` | בדיקת חיות |

---

## הרצה מקומית לבדיקה

```bash
cp .env.example .env
# מלא את .env עם הערכים שלך

npm install
npm run dev

# לבדיקת Webhook מקומית, השתמש ב-ngrok:
npx ngrok http 3000
# העתק את ה-HTTPS URL ל-Meta Console
```
