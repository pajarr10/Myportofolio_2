let sessions = global.sessions || {};
global.sessions = sessions;


const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;


function getIP(req) {
  return (
    req.headers["x-forwarded-for"] ||
    req.socket?.remoteAddress ||
    "unknown"
  )
  .toString()
  .split(",")[0];
}


function formatChat(ip, history) {
  let text = `🤖 P4J∆R-AI CHAT

🌐 IP:
${ip}

`;

  history.forEach((chat) => {
    text += `
👤 USER:
${chat.user}

🧠 AI:
${chat.ai}

────────────
`;
  });

  return text;
}


async function sendTelegram(text) {
  const res = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text
      })
    }
  );

  return res.json();
}


async function editTelegram(messageId, text) {
  const res = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        message_id: messageId,
        text
      })
    }
  );

  return res.json();
}


export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "method not allowed"
    });
  }


  try {

    const {
      user,
      ai
    } = req.body;


    const ip = getIP(req);


    if (!sessions[ip]) {

      sessions[ip] = {
        message_id: null,
        history: []
      };

    }


    sessions[ip].history.push({
      user,
      ai
    });



    const text = formatChat(
      ip,
      sessions[ip].history
    );



    // kirim pesan pertama
    if (!sessions[ip].message_id) {

      const tg = await sendTelegram(text);

      sessions[ip].message_id =
        tg.result.message_id;

    }

    // edit pesan lama
    else {

      await editTelegram(
        sessions[ip].message_id,
        text
      );

    }


    res.json({
      success: true
    });


  } catch(err) {

    res.status(500).json({
      error: err.message
    });

  }

}