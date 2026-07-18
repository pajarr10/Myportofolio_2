/**
 * chat.js
 * AI Lab chat UI + logic. Keeps full conversation context in memory
 * for the session (see chatStore.js) so replies stay coherent turn
 * to turn, instead of treating every message as a fresh question.
 *
 * The upstream endpoint only accepts a single `text` query param, so
 * we flatten the role-tagged history into one prompt string before
 * each request. If the endpoint is later upgraded to accept a real
 * `messages: [{role, content}]` array, only `buildRequestBody()` and
 * `callEndpoint()` need to change — the store and rendering stay the
 * same.
 */

import * as chatStore from './chatStore.js';

const ENDPOINT = 'https://api.kyzzz.eu.cc/api/ai/kobo?message=';
const API_KEY = 'kyzz8337536735';
const MAX_TURNS_IN_CONTEXT = 12; // keep the prompt from growing unbounded

function roleLabel(role) {
  if (role === 'user') return 'ANDA';
  if (role === 'assistant') return 'P4J∆R-AI';
  if (role === 'error') return 'ERROR';
  return 'SYSTEM';
}

function appendMessageToDOM(chatLog, role, text) {
  const wrap = document.createElement('div');
  wrap.className = `chat-msg chat-${role}`;

  const roleEl = document.createElement('p');
  roleEl.className = 'mono chat-role';
  roleEl.textContent = roleLabel(role);

  const textEl = document.createElement('p');
  textEl.className = 'chat-text';
  textEl.textContent = text;

  wrap.appendChild(roleEl);
  wrap.appendChild(textEl);
  chatLog.appendChild(wrap);
  chatLog.scrollTop = chatLog.scrollHeight;
  return wrap;
}

function appendLoadingToDOM(chatLog) {
  const wrap = document.createElement('div');
  wrap.className = 'chat-msg chat-ai';

  const roleEl = document.createElement('p');
  roleEl.className = 'mono chat-role';
  roleEl.textContent = roleLabel('assistant');

  const dots = document.createElement('div');
  dots.className = 'chat-loading';
  dots.innerHTML = '<span></span><span></span><span></span>';

  wrap.appendChild(roleEl);
  wrap.appendChild(dots);
  chatLog.appendChild(wrap);
  chatLog.scrollTop = chatLog.scrollHeight;
  return wrap;
}

function extractText(data) {
  if (typeof data === 'string') return data;
  if (!data || typeof data !== 'object') return String(data);
  const candidates = ['result', 'message', 'response', 'answer', 'text', 'content', 'data'];
  for (const key of candidates) {
    if (typeof data[key] === 'string') return data[key];
  }
  try {
    return JSON.stringify(data);
  } catch {
    return 'Balasan diterima, tapi formatnya tidak dikenali.';
  }
}

/**
 * Flattens role-tagged history into a single prompt string, keeping
 * only the most recent turns so the request doesn't grow forever.
 */
function buildPrompt(newUserText) {
  const history = chatStore.getAll();
  const system = history.find((m) => m.role === 'system');
  const turns = history.filter((m) => m.role !== 'system').slice(-MAX_TURNS_IN_CONTEXT);

  const lines = [];
  if (system) lines.push(`[${system.content}]`);
  turns.forEach((m) => {
    lines.push(`${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`);
  });
  lines.push(`User: ${newUserText}`);
  lines.push('Assistant:');

  return lines.join('\n');
}

async function callEndpoint(promptText) {
  const res = await fetch(ENDPOINT + encodeURIComponent(promptText) + '&apikey=' + API_KEY);
  if (!res.ok) throw new Error(`Status ${res.status}`);

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return extractText(await res.json());
  }
  return res.text();
}

export function initChat() {
  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');
  const log = document.getElementById('chat-log');
  const clearBtn = document.getElementById('chat-clear');
  const sendBtn = document.getElementById('chat-send');

  if (!form || !input || !log) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = input.value.trim();
    if (!message) return;

    appendMessageToDOM(log, 'user', message);
    chatStore.append({ role: 'user', content: message });

    input.value = '';
    input.disabled = true;
    sendBtn.disabled = true;

    const loadingEl = appendLoadingToDOM(log);
    const startedAt = performance.now();

    try {
      const prompt = buildPrompt(message);
      const reply = await callEndpoint(prompt);
      const elapsed = ((performance.now() - startedAt) / 1000).toFixed(2);

      loadingEl.remove();
      const replyText = reply || 'Tidak ada balasan.';
      const msgEl = appendMessageToDOM(log, 'assistant', replyText);
      chatStore.append({ role: 'assistant', content: replyText });

      const meta = document.createElement('p');
      meta.className = 'chat-meta mono';
      meta.textContent = `${elapsed}s`;
      msgEl.appendChild(meta);
    } catch (err) {
      loadingEl.remove();
      appendMessageToDOM(log, 'error', 'Gagal menghubungi lab. Coba lagi sebentar lagi — koneksi atau server mungkin sedang sibuk.');
    } finally {
      input.disabled = false;
      sendBtn.disabled = false;
      input.focus();
    }
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      chatStore.clear();
      log.innerHTML = '';
      appendMessageToDOM(log, 'system', 'Lab dibersihkan. Riwayat percakapan direset.');
    });
  }
}
