const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { google } = require("googleapis");
const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ---------- Configuración de Google OAuth2 ----------
const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
);

oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

// ---------- Función para enviar correo ----------
async function enviarCorreoAPI({ nombre, correo, cedula, categoria, modalidad }) {
  try {
    // Generar QR como Buffer
    const qrBuffer = await QRCode.toBuffer(cedula);

    // Leer logo desde carpeta public
    const logoPath = path.join(__dirname, "public", "logo-cesi.png");
    const logoBuffer = fs.readFileSync(logoPath);

    // Asunto codificado en UTF-8
    const subject = "✅ Confirmación de registro - Congreso CESI 2025";
    const encodedSubject = `=?UTF-8?B?${Buffer.from(subject).toString("base64")}?=`;

    // HTML del correo
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="cid:logoCesi" alt="Logo CESI" style="max-width: 220px;" />
        </div>

        <h2 style="color: #004d40;">Estimado/a ${nombre},</h2>

        <p>
          Nos complace informarle que su <b>registro al Congreso de Economía CESI 2025</b>
          ha sido <b>confirmado exitosamente</b>. 🎉
        </p>
        
        <p><b>Detalles de su inscripción:</b></p>
        <ul>
          <li><b>Cédula:</b> ${cedula}</li>
          <li><b>Categoría:</b> ${categoria || "No especificada"}</li>
          <li><b>Modalidad:</b> ${modalidad || "No especificada"}</li>
        </ul>

        <p>Por favor presente este código QR al momento de ingresar al evento:</p>
        <div style="text-align: center; margin: 20px 0;">
          <img src="cid:qrimage" alt="Código QR" style="width:200px; height:200px;" />
        </div>

        <p style="font-size: 14px; color: #555;">
          📌 Manténgase informado y disfrute de nuestro contenido en el canal oficial de la Facultad:<br/>
          <a href="https://www.youtube.com/@FACULTADDEECONOMIAUNACHI" target="_blank">
            👉 Visite nuestro canal de YouTube
          </a>
        </p>

        <p>Le agradecemos por ser parte del <b>CESI 2025</b>. ¡Nos vemos en el congreso!</p>

        <hr/>
        <p style="font-size: 12px; color: #888; text-align: center;">
          Este es un correo automático, por favor no responder a este mensaje.
        </p>
      </div>
    `;

    // Crear mensaje MIME
    const boundary = "boundary-example";
    const rawMessage = [
      `To: ${correo}`,
      `From: ${process.env.SENDER_NAME} <${process.env.SENDER_EMAIL}>`,
      `Subject: ${encodedSubject}`,
      "MIME-Version: 1.0",
      `Content-Type: multipart/related; boundary="${boundary}"`,
      "",
      `--${boundary}`,
      "Content-Type: text/html; charset=UTF-8",
      "",
      htmlBody,
      "",
      `--${boundary}`,
      "Content-Type: image/png",
      "Content-Transfer-Encoding: base64",
      "Content-ID: <qrimage>",
      "",
      qrBuffer.toString("base64"),
      "",
      `--${boundary}`,
      "Content-Type: image/png",
      "Content-Transfer-Encoding: base64",
      "Content-ID: <logoCesi>",
      "",
      logoBuffer.toString("base64"),
      `--${boundary}--`
    ].join("\n");

    // Codificar mensaje en base64URL
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
  res.json({ message: "Servidor activo 🚀 con Gmail API y correo profesional" });
});

// ---------- Iniciar servidor ----------
app.listen(PORT, () => {
  console.log(`🚀 Servidor CESI escuchando en http://localhost:${PORT}`);
});
