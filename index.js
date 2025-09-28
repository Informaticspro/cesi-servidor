const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { google } = require("googleapis");
const QRCode = require("qrcode");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ---------- Configuración de Google OAuth2 ----------
const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  "https://developers.google.com/oauthplayground" // redirect_uri usado al generar el token
);

oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

// ---------- Función para enviar correo con Gmail API ----------
async function enviarCorreoAPI({ nombre, correo, cedula, categoria, modalidad }) {
  try {
    // Generar QR con la cédula
    const qrCode = await QRCode.toDataURL(cedula);

    // Crear mensaje en formato RFC822
    const rawMessage = [
      `To: ${correo}`,
      `From: ${process.env.SENDER_NAME} <${process.env.SENDER_EMAIL}>`,
      `Subject: Confirmación de registro CESI 2025`,
      "MIME-Version: 1.0",
      "Content-Type: text/html; charset=UTF-8",
      "",
      `<p>Hola <b>${nombre}</b>,</p>
      <p>Tu registro al <b>CESI 2025</b> fue exitoso 🎉</p>
      <p><b>Cédula:</b> ${cedula}<br/>
      <b>Categoría:</b> ${categoria}<br/>
      <b>Modalidad:</b> ${modalidad}</p>
      <p>Presenta este QR al ingresar:</p>
      <img src="${qrCode}" alt="QR de asistencia" />`,
    ].join("\n");

    // Convertir mensaje a base64
    const encodedMessage = Buffer.from(rawMessage)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    // Enviar con Gmail API
    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });
    await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw: encodedMessage },
    });

    console.log("✅ Correo enviado con Gmail API");
    return true;
  } catch (error) {
    console.error("❌ Error al enviar correo:", error);
    return false;
  }
}

// ---------- Endpoint de registro ----------
app.post("/api/registro", async (req, res) => {
  const { nombre, correo, cedula, categoria, modalidad } = req.body;

  console.log("📩 Nuevo registro:", req.body);

  const enviado = await enviarCorreoAPI({ nombre, correo, cedula, categoria, modalidad });

  if (enviado) {
    res.json({ message: "Correo de confirmación enviado ✅" });
  } else {
    res.status(500).json({ error: "Error al enviar correo ❌" });
  }
});

// ---------- Endpoint de prueba ----------
app.get("/ping", (req, res) => {
  res.json({ message: "Servidor activo 🚀 con Gmail API" });
});

// ---------- Iniciar servidor ----------
app.listen(PORT, () => {
  console.log(`🚀 Servidor CESI escuchando en http://localhost:${PORT}`);
});
