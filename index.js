import express from "express";
import { google } from "googleapis";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import QRCode from "qrcode";

dotenv.config();

const app = express();
app.use(express.json());

// Configuración OAuth2 con Google API
const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET
);

oAuth2Client.setCredentials({
  refresh_token: process.env.REFRESH_TOKEN,
});

// 📩 Función para enviar correo con QR adjunto
async function enviarCorreoConQR({ to, nombre, cedula }) {
  try {
    const accessToken = await oAuth2Client.getAccessToken();

    // Generar código QR (ejemplo: cedula como contenido)
    const qrCodeDataUrl = await QRCode.toDataURL(cedula);

    // Transporter Gmail API
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

    const mailOptions = {
      from: `"${process.env.SENDER_NAME}" <${process.env.SENDER_EMAIL}>`,
      to,
      subject: "🎟️ Confirmación de inscripción - CESI 2025",
      text: `Hola ${nombre}, tu inscripción al CESI 2025 ha sido confirmada. Adjuntamos tu código QR.`,
      html: `
        <h2>¡Hola ${nombre}!</h2>
        <p>🎉 Gracias por inscribirte en el <b>CESI 2025</b>.</p>
        <p>Tu cédula: <b>${cedula}</b></p>
        <p>Adjuntamos tu código QR para el ingreso al evento.</p>
        <br/>
        <p>Saludos,<br/>Equipo CESI 2025</p>
        <p style="color:red;font-size:0.9em">⚠️ Si no ves este correo, revisa tu carpeta de SPAM o Correo No Deseado.</p>
      `,
      attachments: [
        {
          filename: `QR_${cedula}.png`,
          content: qrCodeDataUrl.split("base64,")[1],
          encoding: "base64",
        },
      ],
    };

    const result = await transporter.sendMail(mailOptions);
    return result;
  } catch (error) {
    console.error("❌ Error enviando correo:", error);
    throw error;
  }
}

// 📍 Endpoint de inscripción
app.post("/api/inscribir", async (req, res) => {
  const { nombre, correo, cedula } = req.body;

  try {
    const resultado = await enviarCorreoConQR({
      to: correo,
      nombre,
      cedula,
    });

    res.json({
      success: true,
      message: "✅ Inscripción confirmada, correo enviado.",
      result: resultado,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "❌ Error al enviar el correo",
      error: error.message,
    });
  }
});

// 🚀 Iniciar servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor CESI corriendo en puerto ${PORT}`);
});
