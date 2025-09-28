import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  try {
    // Configurar transporte con Gmail API (OAuth2)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.SENDER_EMAIL,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
      },
    });

    // Enviar correo de prueba
    const info = await transporter.sendMail({
      from: `"${process.env.SENDER_NAME}" <${process.env.SENDER_EMAIL}>`,
      to: process.env.SENDER_EMAIL, // te lo envías a ti mismo
      subject: "Prueba Gmail API OAuth2 ✔",
      text: "Si ves este correo, Gmail API con OAuth2 funciona correctamente 🚀",
    });

    console.log("✅ Correo enviado:", info.messageId);
  } catch (error) {
    console.error("❌ Error al enviar correo:", error);
  }
}

main();