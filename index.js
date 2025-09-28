import express from "express";
import cors from "cors";
import QRCode from "qrcode";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 🌍 Orígenes permitidos
const allowedOrigins = [
  "http://localhost:5173",
  "https://cesi-2025.netlify.app",
  "capacitor://localhost",
  "http://localhost",
  "https://localhost",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error("No permitido por CORS"));
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// 📧 Transporter Nodemailer con Gmail OAuth2
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: process.env.SENDER_EMAIL,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

// 🔍 Endpoint de prueba
app.get("/api/test-email", async (req, res) => {
  try {
    await transporter.sendMail({
      from: `"${process.env.SENDER_NAME}" <${process.env.SENDER_EMAIL}>`,
      to: process.env.SENDER_EMAIL, // se envía a ti mismo
      subject: "Prueba CESI 2025 ✔",
      text: "¡Funciona el envío desde Render usando Gmail API con OAuth2!",
    });

    res.json({ ok: true, message: "Correo de prueba enviado exitosamente" });
  } catch (error) {
    console.error("❌ Error al enviar correo de prueba:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// 📝 Endpoint de registro con QR
app.post("/api/registro", async (req, res) => {
  try {
    const { nombre, correo, cedula } = req.body;
    if (!nombre || !correo || !cedula) {
      return res
        .status(400)
        .json({ ok: false, error: "Faltan datos obligatorios" });
    }

    // 🔑 Generar QR (inline + adjunto)
    const qrDataUrlInline = await QRCode.toDataURL(cedula);
    const qrBufferInline = Buffer.from(qrDataUrlInline.split(",")[1], "base64");

    const qrDataUrlAttach = await QRCode.toDataURL(cedula + "-adjunto");
    const qrBufferAttach = Buffer.from(qrDataUrlAttach.split(",")[1], "base64");

    // 📌 Logo local opcional (si existe en /public)
    const logoPath = path.join(process.cwd(), "public", "logo-cesi.png");
    const logoBuffer = fs.existsSync(logoPath)
      ? fs.readFileSync(logoPath)
      : null;

    // 📨 HTML del correo
    const html = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        ${logoBuffer ? `<img src="cid:logoimage" alt="Logo CESI 2025" style="max-width: 150px;" />` : ""}
        <h2>Hola, ${nombre}!</h2>
        <p>Gracias por registrarte en <b>CESI 2025</b>.</p>
        <p>Este es tu código QR:</p>
        <img src="cid:qrimage" alt="Código QR" style="width: 200px;" />
        <br /><br />
        <p>
          Visita nuestro canal oficial en 
          <a href="https://www.youtube.com/@FACULTADDEECONOMIAUNACHI" target="_blank" style="color: #1a73e8; text-decoration: none;">
            YouTube
          </a>
        </p>
        <p style="color:#d93025;">
          ⚠️ Si no ves este correo en tu bandeja principal, revisa la carpeta <b>Spam</b> o <b>Correo no deseado</b>.
        </p>
      </div>
    `;

    // 📎 Configuración del correo
    await transporter.sendMail({
      from: `"${process.env.SENDER_NAME}" <${process.env.SENDER_EMAIL}>`,
      to: correo,
      subject: "Bienvenido a CESI 2025",
      html,
      attachments: [
        { filename: "QR-CESI.png", content: qrBufferAttach, encoding: "base64" },
        logoBuffer
          ? { filename: "logo-cesi.png", content: logoBuffer, cid: "logoimage" }
          : null,
        {
          filename: "qr-inline.png",
          content: qrBufferInline,
          encoding: "base64",
          cid: "qrimage",
        },
      ].filter(Boolean), // elimina null si no hay logo
    });

    res.json({ ok: true, message: "Correo enviado exitosamente" });
  } catch (error) {
    console.error("❌ Error al enviar correo:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor CESI escuchando en http://localhost:${PORT}`);
});
