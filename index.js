const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { google } = require("googleapis");
const nodemailer = require("nodemailer");
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

// ---------- Función para enviar correo ----------
async function enviarCorreo({ nombre, correo, cedula, categoria, modalidad }) {
  try {
    const accessToken = await oAuth2Client.getAccessToken();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.SENDER_EMAIL,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
        accessToken: accessToken.token,
      },
    });

    // Generar QR con la cédula
    const qrCode = await QRCode.toDataURL(cedula);

    const mailOptions = {
      from: `"${process.env.SENDER_NAME}" <${process.env.SENDER_EMAIL}>`,
      to: correo,
      subject: "📩 Confirmación de inscripción - Congreso CESI 2025",
      html: `
        <h2>¡Hola ${nombre}!</h2>
        <p>Gracias por inscribirte al <b>Congreso de Economía, Sociedad e Innovación (CESI 2025)</b>.</p>
        <p><b>Cédula:</b> ${cedula}</p>
        <p><b>Categoría:</b> ${categoria}</p>
        <p><b>Modalidad:</b> ${modalidad}</p>
        <p>Este es tu código QR de confirmación:</p>
        <img src="${qrCode}" alt="QR Code" />
        <br/><br/>
        <p>⚠️ Revisa tu bandeja de <b>SPAM o correo no deseado</b> si no ves este correo en tu bandeja principal.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Correo enviado a:", correo);
  } catch (error) {
    console.error("❌ Error enviando correo:", error);
    throw error;
  }
}

// ---------- Endpoint para registrar y enviar correo ----------
app.post("/api/registro", async (req, res) => {
  try {
    const { nombre, correo, cedula, categoria, modalidad } = req.body;

    if (!nombre || !correo || !cedula) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    await enviarCorreo({ nombre, correo, cedula, categoria, modalidad });

    res.status(200).json({ message: "✅ Registro exitoso y correo enviado" });
  } catch (error) {
    console.error("❌ Error en /api/registro:", error);
    res.status(500).json({ error: "Error al registrar y enviar correo" });
  }
});

// ---------- Endpoint de prueba ----------
app.get("/ping", (req, res) => {
  res.json({ message: "🏓 Servidor CESI activo" });
});

// ---------- Iniciar servidor ----------
app.listen(PORT, () => {
  console.log(`🚀 Servidor CESI escuchando en http://localhost:${PORT}`);
});
