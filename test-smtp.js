import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

async function testSMTP() {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: false, // true si es 465
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      // timeout para pruebas rápidas
      connectionTimeout: 5000,
    });

    // Prueba de conexión
    await transporter.verify();
    console.log("✅ Conexión SMTP exitosa. Render puede enviar correos.");
  } catch (error) {
    console.error("❌ Error de conexión SMTP:", error);
  }
}

testSMTP();