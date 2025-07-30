import express from "express";
import nodemailer from "nodemailer";
import QRCode from "qrcode";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.static("public"));
app.use(express.json());
const allowedOrigins = ["http://localhost:5173", "https://cesi-2025.netlify.app"];

app.use(cors({
  origin: function(origin, callback) {
    // Permitir solicitudes sin origin (postman, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("Origen no permitido por CORS"));
    }
  }
}));

app.options("*", cors()); // habilitar preflight para todas las rutas
// Configura aquí tu cuenta SMTP real (ejemplo con Gmail o tu proveedor)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,     // smtp.gmail.com
  port: parseInt(process.env.EMAIL_PORT), // 587
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,   // ej: informaticsproservices@gmail.com
    pass: process.env.EMAIL_PASS,   // tu contraseña o app password
  },
});

app.post("/api/registro", async (req, res) => {
  try {
    const { nombre, correo, cedula } = req.body;

    // Genera el QR en base64 con el dato "cedula"
    const qrDataUrl = await QRCode.toDataURL(cedula);

    // Crea el HTML del correo con el logo, texto y QR
    const html = `
      <div style="font-family: Arial, sans-serif; color: #333;">
       <img src="https://jsovuliafimiyxqtsnya.supabase.co/storage/v1/object/public/imagenes//LOGO-CESI.jpg" alt="Logo CESI" style="width: 150px;" />
        <h2>Hola, ${nombre}!</h2>
        <p>Gracias por registrarte en CESI 2025.</p>
        <p>Este es tu código QR para el evento:</p>
        <img src="${qrDataUrl}" alt="Código QR" style="width: 200px; height: 200px;" />
        <p>Pronto recibirás el link para la conferencia virtual.</p>
        <p>¡Nos vemos pronto!</p>
      </div>
    `;

    // Envía el correo
    await transporter.sendMail({
      from: '"CESI 2025" <informaticsproservices@gmail.com>',
      to: correo,
      subject: "Bienvenido a CESI 2025",
      html,
    });

    res.json({ ok: true, message: "Correo enviado exitosamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor CESI escuchando en http://localhost:${PORT}`);
});