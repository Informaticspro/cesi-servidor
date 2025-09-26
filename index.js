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
  "http://localhost:5173",
  "https://cesi-2025.netlify.app",
  "capacitor://localhost",
  "http://localhost",
  "https://localhost",
];

app.use(cors({
  origin: function (origin, callback) {
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
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

app.post("/api/registro", async (req, res) => {
  try {
    const { nombre, correo, cedula } = req.body;
    if (!nombre || !correo || !cedula) {
      return res.status(400).json({ ok: false, error: "Faltan datos obligatorios" });
    }

    // 1. Generar QR para inline
    const qrDataUrlInline = await QRCode.toDataURL(cedula);
    const qrBufferInline = Buffer.from(qrDataUrlInline.split(",")[1], "base64");

    // 2. Generar QR para adjunto (distinto para que el cliente de correo lo detecte como archivo)
    const qrDataUrlAttach = await QRCode.toDataURL(cedula + "-adjunto");
    const qrBufferAttach = Buffer.from(qrDataUrlAttach.split(",")[1], "base64");

    // 3. Logo desde carpeta local
    const logoPath = path.join(process.cwd(), "public", "logo-cesi.png");
    const logoBuffer = fs.readFileSync(logoPath);

    // 4. HTML del correo
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

    // 5. Enviar correo
    await transporter.sendMail({
      from: `"CESI 2025" <${process.env.EMAIL_USER}>`,
      to: correo,
      subject: "Bienvenido a CESI 2025",
      html,
      attachments: [
        {
          filename: "QR-CESI.png",       // archivo adjunto
          content: qrBufferAttach,
          encoding: "base64"
        },
        {
          filename: "logo-cesi.png",     // logo inline
          content: logoBuffer,
          cid: "logoimage"
        },
        {
          filename: "qr-inline.png",     // QR inline
          content: qrBufferInline,
          encoding: "base64",
          cid: "qrimage"
        }
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