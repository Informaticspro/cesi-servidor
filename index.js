import express from "express";
import cors from "cors";
import QRCode from "qrcode";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: ["http://localhost:5173", "https://cesi-2025.netlify.app"]
}));
app.use(express.json());

app.post("/api/registro", async (req, res) => {
  try {
    const { nombre, correo, cedula } = req.body;
    if (!nombre || !correo || !cedula) {
      return res.status(400).json({ ok: false, error: "Faltan datos" });
    }

    // Genera QR base64 solo con cédula
    const qrDataUrl = await QRCode.toDataURL(cedula);

    // Responde con qrDataUrl sin enviar correo
    res.json({
      ok: true,
      message: "QR generado (correo deshabilitado)",
      qrDataUrl,
    });
  } catch (error) {
    console.error("Error en /api/registro:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});