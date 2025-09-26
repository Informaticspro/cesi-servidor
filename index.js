// en server.js o index.js de tu backend
import express from "express";
import nodemailer from "nodemailer";

const app = express();

app.get("/api/test-email", async (req, res) => {
  try {
    let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com", // o el servidor que uses
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    let info = await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: "tucorreo@ejemplo.com",
      subject: "Prueba desde Render ✅",
      text: "Si recibes esto, Render sigue funcionando con SMTP",
    });

    res.json({ ok: true, info });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.listen(10000, () => console.log("Servidor corriendo 🚀"));