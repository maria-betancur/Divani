
const { neon } = require("@neondatabase/serverless");

module.exports = async function handler(req, res) {
  const allowedOrigins = [
    "https://divanimaquillaje.co",
    "https://www.divanimaquillaje.co"
  ];

  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    if (origin && !allowedOrigins.includes(origin)) {
      return res.status(403).json({ error: "Origen no autorizado" });
    }
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, OPTIONS");
    return res.status(405).json({ error: "Metodo no permitido" });
  }

  if (origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({ error: "Origen no autorizado" });
  }

  if (!process.env.DATABASE_URL) {
    console.error("Falta configurar DATABASE_URL en Vercel");
    return res.status(500).json({
      error: "Falta configurar la conexion de base de datos"
    });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);

    const result = await sql`
      SELECT
        identificación AS id,
        nombre,
        categorías AS categoria,
        precio,
        "URL" AS url,
        descuento,
        promoción AS promo,
        destacado,
        visible,
        datos_originales
      FROM public.productos
      ORDER BY nombre ASC
    `;

    const productos = result.map((row) => {
      const original =
        row.datos_originales &&
        typeof row.datos_originales === "object"
          ? row.datos_originales
          : {};

      return {
        ...original,
        id: row.id,
        nombre: row.nombre,
        categoria: row.categoria,
        precio: row.precio,
        url: row.url,
        descuento: row.descuento,
        promo: row.promo,
        destacado: row.destacado,
        visible: row.visible
      };
    });

    const body = JSON.stringify({
      ok: true,
      totalProductos: productos.length,
      productos
    });

    const bytes = Buffer.byteLength(body, "utf8");
    const maxBytes = 5 * 1024 * 1024;

    if (bytes > maxBytes) {
      return res.status(413).json({
        error: "El catalogo supera el limite de respuesta de 5 MB",
        bytes,
        maxBytes
      });
    }

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");

    return res.status(200).send(body);
  } catch (error) {
    console.error("Error consultando la tabla de productos en Neon");
    return res.status(500).json({
      error: "No fue posible consultar la base de datos"
    });
  }
};
