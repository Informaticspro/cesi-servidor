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

    // Crear mensaje en formato RFC822 (HTML profesional)
    const rawMessage = [
      `To: ${correo}`,
      `From: ${process.env.SENDER_NAME} <${process.env.SENDER_EMAIL}>`,
      `Subject: ✅ Confirmación de registro - CESI 2025`,
      "MIME-Version: 1.0",
      "Content-Type: text/html; charset=UTF-8",
      "",
      `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <h2 style="color: #004d40;">¡Hola ${nombre}!</h2>

        <p>Tu registro al <b>Congreso de Economía CESI 2025</b> ha sido <b>confirmado exitosamente!</b> 🎉.</p>
        
        <p><b>Detalles de tu inscripción:</b></p>
        <ul>
          <li><b>Cédula:</b> ${cedula}</li>
          <li><b>Categoría:</b> ${categoria}</li>
          <li><b>Modalidad:</b> ${modalidad}</li>
        </ul>

        <p>Por favor presenta este código QR al ingresar al evento:</p>
        <div style="text-align: center; margin: 20px 0;">
          <img src="${qrCode}" alt="Código QR" style="width:200px; height:200px;" />
        </div>

        <p style="font-size: 14px; color: #555;">
          📌 Mantente informado y disfruta de nuestro contenido en el canal oficial de la Facultad:<br/>
          <a href="https://www.youtube.com/@FACULTADDEECONOMIAUNACHI" target="_blank">
            👉 Visita nuestro canal de YouTube
          </a>
        </p>

        <p>¡Gracias por ser parte del CESI 2025!</p>
        <hr/>
        <p style="font-size: 12px; color: #888;">
          Este es un correo automático, por favor no responder a este mensaje.
        </p>
      </div>
      `,
    ].join("\n");

    // Codificar mensaje en base64
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

    console.log(`✅ Correo enviado a ${correo}`);
    return true;
  } catch (error) {
    console.error("❌ Error al enviar correo:", error);
    return false;
  }
}

// ---------- Endpoint de registro ----------
app.post("/api/registro", async (req, res) => {
  const { nombre, correo, cedula, categoria, modalidad } = req.body;

  console.log("📩 Nuevo registro recibido:", req.body);

  const enviado = await enviarCorreoAPI({ nombre, correo, cedula, categoria, modalidad });

  if (enviado) {
    res.json({ message: "📧 Correo de confirmación enviado con éxito ✅" });
  } else {
    res.status(500).json({ error: "❌ Ocurrió un error al enviar el correo" });
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
