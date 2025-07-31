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

app.use(cors({
  origin: ["http://localhost:5173", "https://cesi-2025.netlify.app"]
}));
app.use(express.json());

const logoPath = path.join(__dirname, "public", "logo-cesi.png"); // 👈 Ajuste robusto

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

    const html = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <img src="cid:logo_cesi" alt="Logo CESI 2025" style="max-width: 150px;" />
        <h2>Hola, ${nombre}!</h2>
        <p>Gracias por registrarte en CESI 2025.</p>
        <p>Este es tu código QR:</p>
        <img src="${qrDataUrl}" alt="Código QR" style="width: 200px;" />
      </div>
    `;

    await transporter.sendMail({
      from: `"CESI 2025" <${process.env.EMAIL_USER}>`,
      to: correo,
      subject: "Bienvenido a CESI 2025",
      html,
      attachments: [
        {
          filename: "logo-cesi.png",
          path: logoPath,           // 👈 usa "path" directamente
          cid: "logo_cesi"          // 👈 debe coincidir con el src="cid:logo_cesi"
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