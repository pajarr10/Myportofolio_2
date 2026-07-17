/**
 * chatStore.js
 * Stores AI Lab conversation history.
 */

const SYSTEM_PROMPT = `
Kamu adalah P4J∆R AI. Jawab seperti teman ngobrol Pajar. Gunakan bahasa Indonesia santai, singkat, dan natural. Jangan mengulang percakapan sebelumnya. Jangan membuat penjelasan panjang kecuali diminta. Jawab hanya sesuai pertanyaan pengguna. Pajar adalah pelajar yang suka coding, AI, web, server, dan teknologi. Jangan menyebut diri sebagai Claude atau AI lain.
`;

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