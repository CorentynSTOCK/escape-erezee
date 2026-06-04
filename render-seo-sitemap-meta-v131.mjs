import { readFile, writeFile } from 'node:fs/promises';

const VERSION = 131;

async function patchTextFile(filePath, patcher) {
  const input = await readFile(filePath, 'utf8');
  const output = patcher(input);
  if (output !== input) await writeFile(filePath, output, 'utf8');
}

function buildSitemapXml(routes, origin) {
  const lastmod = new Date().toISOString().slice(0, 10);
  const staticPages = [
    { url: `${origin}/`, priority: '1.0', changefreq: 'weekly' },
    { url: `${origin}/escape-game-exterieur-ardenne.html`, priority: '0.9', changefreq: 'monthly' },
    { url: `${origin}/activite-famille-ardenne.html`, priority: '0.85', changefreq: 'monthly' },
    { url: `${origin}/chasse-au-tresor-ardenne.html`, priority: '0.85', changefreq: 'monthly' },
    { url: `${origin}/activite-touristique-erezee.html`, priority: '0.85', changefreq: 'monthly' },
    { url: `${origin}/activite-pres-de-durbuy.html`, priority: '0.85', changefreq: 'monthly' },
    { url: `${origin}/blog/`, priority: '0.8', changefreq: 'weekly' },
    { url: `${origin}/blog/que-faire-a-erezee.html`, priority: '0.75', changefreq: 'monthly' },
    { url: `${origin}/blog/que-faire-pres-de-durbuy.html`, priority: '0.75', changefreq: 'monthly' },
    { url: `${origin}/blog/activites-familiales-ardenne-belge.html`, priority: '0.75', changefreq: 'monthly' },
    { url: `${origin}/blog/top-10-activites-exterieures-ardenne.html`, priority: '0.75', changefreq: 'monthly' },
    { url: `${origin}/blog/que-faire-vacances-ardenne.html`, priority: '0.75', changefreq: 'monthly' },
  ];
  const routePages = (Array.isArray(routes) ? routes : []).map((route) => ({
    url: `${origin}${getRoutePublicPath(route)}`,
    priority: '0.9',
    changefreq: 'weekly',
  }));
  const seen = new Set();
  const entries = [...staticPages, ...routePages].filter((entry) => {
    if (!entry.url || seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map((entry) => `  <url>
    <loc>${escapeXml(entry.url)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join("\n")}
</urlset>
`;
}

function patchServer(server) {
  if (server.includes('seo-sitemap-meta-v131')) return server;
  const replacement = `/* seo-sitemap-meta-v131 */\n${buildSitemapXml.toString()}\n\nasync function handleSeoRequest`;
  const pattern = /function buildSitemapXml\(routes, origin\) \{[\s\S]*?\n\}\n\nasync function handleSeoRequest/;
  if (!pattern.test(server)) {
    throw new Error(`Patch v${VERSION} introuvable: fonction buildSitemapXml`);
  }
  return server.replace(pattern, replacement);
}

await patchTextFile('server.mjs', patchServer);

console.log(`SEO sitemap metadata v${VERSION} applied.`);
