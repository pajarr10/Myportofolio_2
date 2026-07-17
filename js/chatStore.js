/**
 * chatStore.js
 * Holds AI Lab conversation history for the lifetime of the tab.
 *
 * The store is deliberately isolated behind this small interface
 * (getAll / append / clear) so it can later be swapped for a
 * localStorage- or database-backed implementation without touching
 * any of the chat logic in chat.js — just replace the implementation
 * below and keep the same three exports.
 */

let history = [
  { role: 'system', content: 'Kamu adalah asisten kecil di lab AI portofolio P4J∆R (Muhammad Fajar). Jawab singkat, ramah, dan jujur soal keterbatasanmu.' },
];

export function getAll() {
  return history;
}

export function append(message) {
  history.push(message);
  return history;
}

export function clear() {
  history = [history[0]]; // keep the system message, drop the rest
  return history;
}
