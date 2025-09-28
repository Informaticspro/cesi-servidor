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

// Orígenes permitidos
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

// ✅ Nodemailer con OAuth2
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

// Endpoint de prueba
app.get("/api/test-email", async (req, res) => {
  try {
    await transporter.sendMail({
      from: `"${process.env.SENDER_NAME}" <${process.env.SENDER_EMAIL}>`,
      to: process.env.SENDER_EMAIL,
      subject: "Prueba Render + Gmail API ✔",
      text: "¡Funciona el envío desde Render usando Gmail API con OAuth2!",
    });

    res.json({ ok: true, message: "Correo de prueba enviado exitosamente" });
  } catch (error) {
    console.error("Error al enviar correo de prueba:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Endpoint de registro con QR
app.post("/api/registro", async (req, res) => {
  console.log("📩 Datos recibidos en /api/registro:", req.body);

  try {
    const { nombre, correo, cedula } = req.body;
    if (!nombre || !correo || !cedula) {
      return res
        .status(400)
        .json({ ok: false, error: "Faltan datos obligatorios" });
    }

    // Generar QR
    const qrDataUrlInline = await QRCode.toDataURL(cedula);
    const qrBufferInline = Buffer.from(qrDataUrlInline.split(",")[1], "base64");

    const html = `
      <h2>Hola, ${nombre}!</h2>
      <p>Gracias por registrarte en <b>CESI 2025</b>.</p>
      <p>Este es tu código QR:</p>
      <img src="cid:qrimage" style="width:200px;" />
    `;

    await transporter.sendMail({
      from: `"${process.env.SENDER_NAME}" <${process.env.SENDER_EMAIL}>`,
      to: correo,
      subject: "Bienvenido a CESI 2025",
      html,
      attachments: [
        {
          filename: "qr-inline.png",
          content: qrBufferInline,
          encoding: "base64",
          cid: "qrimage",
        },
      ],
    });

    res.json({ ok: true, message: "Correo enviado exitosamente" });
  } catch (error) {
    console.error("❌ Error en /api/registro:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ✅ Importante: escuchar en 0.0.0.0 (Render necesita esto)
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Servidor CESI escuchando en http://0.0.0.0:${PORT}`);
});