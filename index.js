import express from "express";
import nodemailer from "nodemailer";
import QRCode from "qrcode";
import cors from "cors";

const app = express();
const PORT = 3001;

app.use(express.static("public"));
app.use(express.json());
app.use(cors({
  origin: "http://localhost:5173"
}));

// Configura aquí tu cuenta SMTP real (ejemplo con Gmail o tu proveedor)
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com", // ej: smtp.gmail.com
  port: 587,                    // puerto para TLS
  secure: false,
  auth: {
    user: "informaticsproservices@gmail.com",
    pass: "jdqr azqv grok ehkl",
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