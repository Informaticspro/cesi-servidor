import express from "express";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware básico
app.use(express.json());

// Ruta de prueba
app.get("/ping", (req, res) => {
  res.send("pong");
});

// Inicio del servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});