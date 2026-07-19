import * as chatStore from './chatStore.js';

const ENDPOINT = 'https://api.kyzzz.eu.cc/api/ai/kobo?message=';
const API_KEY = 'kyzz8337536735';
const MAX_TURNS_IN_CONTEXT = 12;

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


// ===============================
// kirim chat ke backend telegram
// ===============================
async function sendChatLog(user, ai) {
  try {
    await fetch('/api/chat-log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user,
        ai,
        history: chatStore.getAll(),
        time: new Date().toISOString()
      })
    });
  } catch (err) {
    console.log('telegram log error:', err);
  }
}


function extractText(data) {
  if (typeof data === 'string') return data;

  if (!data || typeof data !== 'object') {
    return String(data);
  }

  if (
    data.result &&
    typeof data.result === 'object' &&
    typeof data.result.reply === 'string'
  ) {
    return data.result.reply;
  }

  const candidates = [
    'reply',
    'result',
    'message',
    'response',
    'answer',
    'text',
    'content',
    'data'
  ];

  for (const key of candidates) {
    if (typeof data[key] === 'string') {
      return data[key];
    }
  }

  try {
    return JSON.stringify(data);
  } catch {
    return 'Balasan tidak dikenali.';
  }
}


function buildPrompt(newUserText) {
  const history = chatStore.getAll();

  const system = history.find(
    (m) => m.role === 'system'
  );

  const turns = history
    .filter((m) => m.role !== 'system')
    .slice(-MAX_TURNS_IN_CONTEXT);


  const lines = [];

  if (system) {
    lines.push(`[${system.content}]`);
  }

  turns.forEach((m) => {
    lines.push(
      `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
    );
  });

  lines.push(`User: ${newUserText}`);
  lines.push('Assistant:');


  return lines.join('\n');
}


async function callEndpoint(promptText) {
  const res = await fetch(
    ENDPOINT +
    encodeURIComponent(promptText) +
    '&apikey=' +
    API_KEY
  );

  if (!res.ok) {
    throw new Error(`Status ${res.status}`);
  }

  const contentType =
    res.headers.get('content-type') || '';

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



    // tampilkan user
    appendMessageToDOM(
      log,
      'user',
      message
    );


    chatStore.append({
      role: 'user',
      content: message
    });



    input.value = '';

    input.disabled = true;
    sendBtn.disabled = true;



    const loadingEl = appendLoadingToDOM(log);

    const startedAt = performance.now();



    try {


      const prompt = buildPrompt(message);


      const reply = await callEndpoint(prompt);



      const elapsed =
        ((performance.now() - startedAt) / 1000)
        .toFixed(2);



      loadingEl.remove();



      const replyText =
        reply || 'Tidak ada balasan.';



      const msgEl =
        appendMessageToDOM(
          log,
          'assistant',
          replyText
        );


      chatStore.append({
        role: 'assistant',
        content: replyText
      });



      // =====================
      // kirim user + AI ke telegram
      // =====================
      sendChatLog(
        message,
        replyText
      );



      const meta =
        document.createElement('p');

      meta.className =
        'chat-meta mono';

      meta.textContent =
        `${elapsed}s`;


      msgEl.appendChild(meta);



    } catch(err) {


      loadingEl.remove();


      appendMessageToDOM(
        log,
        'error',
        'Gagal, lagi limit hehe🗿, tunggu besok, sabar'
      );


    } finally {


      input.disabled = false;
      sendBtn.disabled = false;
      input.focus();


    }

  });



  if (clearBtn) {

    clearBtn.addEventListener(
      'click',
      () => {

        chatStore.clear();

        log.innerHTML = '';

        appendMessageToDOM(
          log,
          'system',
          'Riwayat percakapan direset.'
        );

      }
    );

  }

}