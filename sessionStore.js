/**
 * Simple in-memory session store.
 * Each incoming phone number gets a session that tracks:
 *   - which question we're currently on
 *   - the answers collected so far
 *   - timestamps for timeout handling
 *
 * For production: replace with Redis or a SQLite file.
 */

const sessions = new Map();

function getSession(phone) {
  return sessions.get(phone) || null;
}

function createSession(phone) {
  const session = {
    phone,
    step: 0,           // index of the next question to ask
    answers: [],       // { question, answer } pairs
    startedAt: Date.now(),
    lastActivityAt: Date.now(),
    status: "screening", // "screening" | "done" | "approved" | "rejected" | "timeout"
  };
  sessions.set(phone, session);
  return session;
}

function updateSession(phone, patch) {
  const session = sessions.get(phone);
  if (!session) return null;
  Object.assign(session, { ...patch, lastActivityAt: Date.now() });
  sessions.set(phone, session);
  return session;
}

function deleteSession(phone) {
  sessions.delete(phone);
}

function getAllSessions() {
  return Array.from(sessions.values());
}

module.exports = { getSession, createSession, updateSession, deleteSession, getAllSessions };
