/**
 * chatStore.js
 */

async function loadPrompt() {
  const res = await fetch("/prompt.txt");
  return await res.text();
}

const SYSTEM_PROMPT = await loadPrompt();

let history = [
  {
    role: "system",
    content: SYSTEM_PROMPT,
  },
];

export function getAll() {
  return history;
}

export function append(message) {
  history.push(message);
  return history;
}

export function clear() {
  history = [
    {
      role: "system",
      content: SYSTEM_PROMPT,
    },
  ];

  return history;
}