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


const allowedOrigins = [
  "http://localhost:5173",           // dev web local
  "https://cesi-2025.netlify.app",  // web deploy
  "capacitor://localhost",           // apk Capacitor Android/iOS
  "http://localhost"                 // apk dev local
];

app.use(cors({
  origin: function (origin, callback) {
    // Permite requests sin origin (ej: apps móviles nativas)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error("No permitido por CORS"));
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));


app.use(express.json());



const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

app.post("/api/registro", async (req, res) => {
  try {
    const { nombre, correo, cedula } = req.body;
    if (!nombre || !correo || !cedula) {
      return res.status(400).json({ ok: false, error: "Faltan datos obligatorios" });
    }

    const qrDataUrl = await QRCode.toDataURL(cedula);
const logoPublicUrl = "https://jsovuliafimiyxqtsnya.supabase.co/storage/v1/object/public/imagenes/LOGO-CESI.jpg";

const html = `
  <div style="font-family: Arial, sans-serif; color: #333;">
    <img src="${logoPublicUrl}" alt="Logo CESI 2025" style="max-width: 150px;" />
        <h2>Hola, ${nombre}!</h2>
        <p>Gracias por registrarte en CESI 2025.</p>
        <p>Este es tu código QR:</p>
        <img src="${qrDataUrl}" alt="Código QR" style="width: 200px;" />
            <p>
            Visita nuestro canal oficial en 
            <a href="https://www.youtube.com/@FACULTADDEECONOMIAUNACHI" target="_blank" style="color: #1a73e8; text-decoration: none;">
           YouTube
            </a>
            </p>
      </div>
    `;

 
await transporter.sendMail({
  from: `"CESI 2025" <${process.env.EMAIL_USER}>`,
  to: correo,
  subject: "Bienvenido a CESI 2025",
  html
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