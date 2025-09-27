import express from "express";
import cors from "cors";
import QRCode from "qrcode";
import nodemailer from "nodemailer";
import sgTransport from "nodemailer-sendgrid-transport";
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

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error("No permitido por CORS"));
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// Transporter Nodemailer con SendGrid API Key
const transporter = nodemailer.createTransport(
  sgTransport({
    auth: {
      api_key: process.env.EMAIL_PASS  // Aquí va tu API Key de SendGrid
    }
  })
);

// Endpoint de prueba
app.get("/api/test-email", async (req, res) => {
  try {
    await transporter.sendMail({
      from: `"CESI 2025" <jose.acosta@unachi.ac.pa>`,  // remitente verificado
      to: "jose.acosta@unachi.ac.pa",                 // tu correo para prueba
      subject: "Prueba Render + SendGrid",
      text: "¡Funciona el envío desde Render usando SendGrid!"
    });

    res.json({ ok: true, message: "Correo de prueba enviado exitosamente" });
  } catch (error) {
    console.error("Error al enviar correo de prueba:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Endpoint de registro con QR (igual que antes)
app.post("/api/registro", async (req, res) => {
  try {
    const { nombre, correo, cedula } = req.body;
    if (!nombre || !correo || !cedula) return res.status(400).json({ ok: false, error: "Faltan datos obligatorios" });

    const qrDataUrlInline = await QRCode.toDataURL(cedula);
    const qrBufferInline = Buffer.from(qrDataUrlInline.split(",")[1], "base64");
    const qrDataUrlAttach = await QRCode.toDataURL(cedula + "-adjunto");
    const qrBufferAttach = Buffer.from(qrDataUrlAttach.split(",")[1], "base64");

    const logoPath = path.join(process.cwd(), "public", "logo-cesi.png");
    const logoBuffer = fs.readFileSync(logoPath);

    const html = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <img src="cid:logoimage" alt="Logo CESI 2025" style="max-width: 150px;" />
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
      </div>
    `;

    await transporter.sendMail({
      from: `"CESI 2025" <jose.acosta@unachi.ac.pa>`,
      to: correo,
      subject: "Bienvenido a CESI 2025",
      html,
      attachments: [
        { filename: "QR-CESI.png", content: qrBufferAttach, encoding: "base64" },
        { filename: "logo-cesi.png", content: logoBuffer, cid: "logoimage" },
        { filename: "qr-inline.png", content: qrBufferInline, encoding: "base64", cid: "qrimage" }
      ]
    });

    res.json({ ok: true, message: "Correo enviado exitosamente" });
  } catch (error) {
    console.error("Error al enviar correo:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor CESI escuchando en http://localhost:${PORT}`);
});