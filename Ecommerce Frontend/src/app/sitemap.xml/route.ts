import getData from "@/api/getData";

export const GET = async () => {
  const products = await getData({
    tableName: "products",
    column: "slug",
  });

  const baseUrl = "https://sfari-jouets.com";

  const urls = products.data?.map(
    (p) => `<url><loc>${baseUrl}/products/${p.slug ?? ""}</loc></url>`
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
  </url>
  ${urls?.join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=UTF-8",
    },
  });
};
