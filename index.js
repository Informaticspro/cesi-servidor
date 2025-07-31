import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors({ origin: "*" }));
app.use(express.json());

// Endpoint de prueba
app.get("/ping", (req, res) => {
  res.send("pong");
});

// ✅ Nuevo endpoint /api/registro básico
app.post("/api/registro", (req, res) => {
  const { nombre, correo, cedula } = req.body;

  if (!nombre || !correo || !cedula) {
    return res.status(400).json({ ok: false, message: "Faltan datos." });
  }

  res.status(200).json({
    ok: true,
    message: `Recibido: ${nombre}, ${correo}, ${cedula}`,
  });
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});