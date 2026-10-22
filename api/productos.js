
const { neon } = require("@neondatabase/serverless");

module.exports = async function handler(req, res) {
  const allowedOrigins = [
    "https://divanimaquillaje.co",
    "https://www.divanimaquillaje.co"
  ];

  const origin = req.headers.origin;

  // Configurar CORS únicamente para los dominios oficiales de DIVANI.
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Responder a las solicitudes de comprobación CORS.
  if (req.method === "OPTIONS") {
    if (origin && !allowedOrigins.includes(origin)) {
      return res.status(403).json({
        error: "Origen no autorizado"
      });
    }

    return res.status(204).end();
  }

  // Esta ruta solo permite consultas GET.
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, OPTIONS");

    return res.status(405).json({
      error: "Metodo no permitido"
    });
  }

  // Rechazar los orígenes de navegador que no estén autorizados.
  // Las solicitudes sin Origin pueden continuar.
  if (origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({
      error: "Origen no autorizado"
    });
  }

  // Verificar que la conexión a Neon esté configurada.
  if (!process.env.DATABASE_URL) {
    console.error("Falta configurar DATABASE_URL en Vercel");

    return res.status(500).json({
      error: "Falta configurar la conexion de base de datos"
    });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);

    // Consulta de solo lectura: contar los productos de Neon.
    const result = await sql`
      SELECT COUNT(*)::int AS total
      FROM public.productos
    `;

    return res.status(200).json({
      ok: true,
      totalProductos: result[0].total
    });
  } catch (error) {
    // No exponer credenciales ni detalles internos al visitante.
    console.error("Error consultando la tabla de productos en Neon");

    return res.status(500).json({
      error: "No fue posible consultar la base de datos"
    });
  }
};
