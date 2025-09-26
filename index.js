app.get("/api/test-email", async (req, res) => {
  try {
    await transporter.sendMail({
      from: `"CESI 2025" <${process.env.EMAIL_USER}>`,
      to: "tu_correo_prueba@gmail.com",  // cámbialo por un correo tuyo real
      subject: "Prueba Render SMTP",
      text: "¡Funciona el envío desde Render con Gmail!"
    });

    res.json({ ok: true, message: "Correo de prueba enviado exitosamente" });
  } catch (error) {
    console.error("Error al enviar correo de prueba:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
});