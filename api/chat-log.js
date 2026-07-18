export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'method not allowed'
    });
  }

  try {
    const {
      user,
      ai,
      time
    } = req.body;


    const text = `
🤖 P4J∆R-AI CHAT

👤 USER:
${user}

🧠 AI:
${ai}

🕒 ${time}
`;


    const response = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text: text
        })
      }
    );


    const result = await response.json();


    if (!result.ok) {
      return res.status(500).json({
        error: result.description
      });
    }


    return res.json({
      success: true
    });


  } catch (err) {

    return res.status(500).json({
      error: err.message
    });

  }
}