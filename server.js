import express from "express";
import dotenv from "dotenv";

dotenv.config();
const port = process.env.PORT;

const app = express();
app.use(express.json());

// WhatsApp API credentials
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

// ------ 1️⃣ VERIFY WEBHOOK (Facebook Challenge) ------
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// ------ 2️⃣ RECEIVE MESSAGE & SEND REPLY ------
app.post("/webhook", async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const message = changes?.value?.messages?.[0];

    if (!message) return res.sendStatus(200);

    const from = message.from; // user number
    const text = message.text?.body?.trim(); // message content

    // Default menu
    let reply = 
      "👋 *Welcome! Please choose an option:*\n\n" +
      "1️⃣ Price List\n" +
      "2️⃣ Customer Support\n" +
      "3️⃣ Contact Information\n";

    // Menu Logic
    if (text === "1") reply = "💰 *Price List*: \n- Product A: $10\n- Product B: $20\n- Product C: $30";
    if (text === "2") reply = "📞 *Support*: A support agent will contact you soon.";
    if (text === "3") reply = "📧 *Contact*: \nEmail: example@mail.com\nPhone: +92 3XX XXXXXXX";

    // Send reply through WhatsApp API
    await axios.post(
      `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: from,
        text: { body: reply },
      },
      {
        headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` },
      }
    );

    res.sendStatus(200);
  } catch (error) {
    console.log("Error: ", error.response?.data || error);
    res.sendStatus(500);
  }
});

app.get("/", (req, res) => {
    res.json({message: "Server is running fine"})
})

app.listen(port, () => {
    console.log(`🚀 WhatsApp Bot running on port:${port}`)
});