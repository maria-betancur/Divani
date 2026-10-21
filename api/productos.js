
const { neon } = require("@neondatabase/serverless");

module.exports = async function handler(req, res) {
  const allowedOrigins = [
    "https://divanimaquillaje.co",
    "https://www.divanimaquillaje.co"
  ];

  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }

  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, OPTIONS");
    return res.status(405).json({ error: "Metodo no permitido" });
  }

  if (!allowedOrigins.includes(origin)) {
    return res.status(403).json({ error: "Origen no autorizado" });
  }

  if (!process.env.DATABASE_URL) {
    return res.status(500).json({
      error: "Falta configurar la conexion de base de datos"
    });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    const result = await sql`
      SELECT COUNT(*)::int AS total
      FROM public.productos
    `;

    return res.status(200).json({
      ok: true,
      totalProductos: result[0].total
    });
  } catch (error) {
    console.error("Error consultando Neon");
    return res.status(500).json({
      error: "No fue posible consultar la base de datos"
    });
  }
};
