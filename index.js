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

const allowedOrigins = [
  "http://localhost:5173",
  "https://cesi-2025.netlify.app",
  "capacitor://localhost",
  "http://localhost",
  "https://localhost",
  "file://"
];

// Middleware para loguear el origen recibido (útil para depuración)
app.use((req, res, next) => {
  console.log("Origen recibido en la petición:", req.headers.origin);
  next();
});

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true); // Permite requests sin origen (postman, curl)
    console.log("Allowed origins:", allowedOrigins);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.log("CORS Rejected:", origin);
      return callback(new Error("Origen no permitido por CORS"));
    }
  }
}));

app.options("*", cors()); // habilitar preflight para todas las rutas

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,     // ej: smtp.gmail.com
  port: parseInt(process.env.EMAIL_PORT), // ej: 587
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

app.post("/api/registro", async (req, res) => {
  try {
    const { nombre, correo, cedula } = req.body;

    const qrDataUrl = await QRCode.toDataURL(cedula);

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