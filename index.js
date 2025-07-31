import express from "express";
import cors from "cors";
import QRCode from "qrcode";
import nodemailer from "nodemailer";
import dotenv from "dotenv";


dotenv.config();





const app = express();
const PORT = process.env.PORT || 3001;


app.use(cors({
  origin: ["http://localhost:5173", "https://cesi-2025.netlify.app"]
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

 const html = `
  <div style="font-family: Arial, sans-serif; color: #333;">
    <img 
      src="https://jsovuliafimiyxqtsnya.supabase.co/storage/v1/object/public/imagenes/LOGO-CESI.jpg" 
      alt="Logo CESI 2025" 
      style="max-width: 150px; margin-bottom: 20px;" 
    />
    <h2>Hola, ${nombre}!</h2>
    <p>Gracias por registrarte en CESI 2025.</p>
    <p>Este es tu código QR para el evento:</p>
    <img src="${qrDataUrl}" alt="Código QR" style="width: 200px; height: 200px;" />
    <p>Pronto recibirás el link para la conferencia virtual.</p>
    <p>¡Nos vemos pronto!</p>
  </div>
`;

    await transporter.sendMail({
      from: `"CESI 2025" <${process.env.EMAIL_USER}>`,
      to: correo,
      subject: "Bienvenido a CESI 2025",
      html,
    });

    res.json({ ok: true, message: "Correo enviado exitosamente" });
  } catch (error) {
    console.error("Error al enviar correo:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});