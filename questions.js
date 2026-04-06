/**
 * ╔══════════════════════════════════════════════════╗
 *  EDIT THIS FILE to customize your screening bot
 * ╚══════════════════════════════════════════════════╝
 */

module.exports = {

  // Message sent when someone writes to you for the first time
  welcomeMessage:
    "שלום! 👋 אני עוזר אוטומטי.\n" +
    "לפני שאעביר את פנייתך, יש לי כמה שאלות קצרות. אנא ענה בקצרה על כל אחת.",

  // Questions asked one by one, in order
  questions: [
    "מה שמך המלא?",
    "מה הסיבה שאתה פונה אליי?",
    "האם אתה לקוח קיים אצלי, או לקוח חדש?",
    "מה מספר הטלפון שלך לחזרה?",
  ],

  // Sent after all questions are answered
  thankYouMessage:
    "תודה רבה! 🙏\n" +
    "פנייתך הועברה. נחזור אליך בהקדם האפשרי.",

  // Sent if user doesn't reply within timeoutHours
  timeoutMessage:
    "לא קיבלנו תשובה מלאה לשאלות שלנו.\n" +
    "אם תרצה לפנות שוב — פשוט שלח הודעה.",

  // How many hours to wait before marking conversation as timed-out
  timeoutHours: 24,
};
