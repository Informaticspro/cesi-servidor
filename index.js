const express = require("express");
const cors = require("cors");
const QRCode = require("qrcode");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const { google } = require("googleapis");

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
      subject: "✅ Confirmación de inscripción - CESI 2025",
      html: `
        <h2>Hola ${nombre},</h2>
        <p>¡Gracias por inscribirte al <b>Congreso CESI 2025</b>!</p>
        
        <p><b>Detalles de tu inscripción:</b></p>
        <ul>
          <li><b>Cédula:</b> ${cedula}</li>
          <li><b>Categoría:</b> ${categoria || "No especificada"}</li>
          <li><b>Modalidad:</b> ${modalidad || "No especificada"}</li>
        </ul>

        <p>Tu registro fue completado exitosamente. Presenta este código QR en el evento:</p>
        <img src="${qrCode}" alt="QR Code" style="width:200px; height:200px;" />
        
        <p>⚠️ Si no ves este mensaje en tu bandeja de entrada, revisa también la carpeta <b>SPAM</b>.</p>
        
        <br>
        <p>Atentamente,<br>Comité Organizador CESI 2025</p>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("📩 Correo enviado con ID:", info.messageId);
    return info.messageId;
  } catch (error) {
    console.error("❌ Error al enviar correo:", error);
    throw error;
  }
}

// ---------- Ruta de inscripción ----------
app.post("/api/registro", async (req, res) => {
  try {
    const { nombre, correo, cedula, categoria, modalidad } = req.body;

    if (!nombre || !correo || !cedula) {
      return res.status(400).json({ success: false, error: "Faltan datos" });
    }

    console.log("📝 Nuevo registro:", { nombre, correo, cedula, categoria, modalidad });

    // Enviar correo de confirmación
    const messageId = await enviarCorreo({ nombre, correo, cedula, categoria, modalidad });

    res.json({ success: true, messageId });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ---------- Iniciar servidor ----------
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Servidor CESI escuchando en http://localhost:${PORT}`);
});
