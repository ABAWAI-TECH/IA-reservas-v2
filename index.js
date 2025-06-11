
const express = require("express");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const { Configuration, OpenAIApi } = require("openai");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

// Inicializar Firebase
const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

// Inicializar OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Endpoint de reservas
app.post("/reservar", async (req, res) => {
  const { nombre, servicio, fecha } = req.body;

  if (!nombre || !servicio || !fecha) {
    return res.status(400).json({ error: "Faltan datos necesarios." });
  }

  try {
    // Guardar en Firebase
    await db.collection("reservas").add({
      nombre,
      servicio,
      fecha,
      timestamp: new Date(),
    });

    // Generar respuesta con IA
    const prompt = `Un cliente llamado ${nombre} quiere reservar un servicio de ${servicio} para el día ${fecha}. Responde de forma amable confirmando la reserva.`;

    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    const respuestaIA = response.data.choices[0].message.content;
    res.json({ mensaje: respuestaIA });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al procesar la reserva." });
  }
});

app.get("/", (req, res) => {
  res.send("API de reservas funcionando ✅");
});

app.listen(port, () => {
  console.log(`Servidor escuchando en puerto ${port}`);
});
