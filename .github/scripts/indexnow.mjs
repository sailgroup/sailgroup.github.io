// IndexNow step, part 1: which pages of this build differ from the live site. Runs in CI's
// build job on main only, after `jekyll build` and before the deploy job publishes the
// build, so the live site is still the previous deploy. It prints, in the form GitHub's step
// outputs take ($GITHUB_OUTPUT), the site's host, the IndexNow key and the URLs to report:
//   - every sitemap page whose HTML differs from the live page, or that the live site does
//     not serve yet (a new paper or person);
//   - every page the live sitemap lists and this build does not (removed or renamed).
// Part 2 is in the workflow's deploy job: once the build is published, it sends the list to
// IndexNow (Bing, which shares it with the other IndexNow engines, and Naver), so those
// engines recrawl the pages soon instead of whenever they next pass by. When nothing
// changed (a push of the records only), there is nothing to send.
//
// The key is the file <key>.txt at the site root whose content is its own name, 32 hex
// characters, as IndexNow asks: an engine fetches it to check that the list came from whoever
// controls the site. It is public by design. Keep the file: without it, IndexNow refuses the
// list (the deploy itself is never affected).
//
// Usage: node .github/scripts/indexnow.mjs <built site dir> >> "$GITHUB_OUTPUT"
// No dependencies. The workflow step is continue-on-error, so a failure here (the live site
// unreachable, say) never fails the run; an unreachable page is reported as changed.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const dir = process.argv[2];
if (!dir) {
  console.error("usage: node indexnow.mjs <built site dir>");
  process.exit(2);
}

const locs = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());

const keyFile = readdirSync(dir).find(
  (f) => /^[0-9a-f]{32}\.txt$/.test(f) && readFileSync(join(dir, f), "utf8").trim() === f.slice(0, 32),
);
if (!keyFile) {
  console.error("indexnow: no <key>.txt at the site root, so nothing can be sent");
  process.exit(1);
}

const urls = locs(readFileSync(join(dir, "sitemap.xml"), "utf8"));
if (urls.length === 0) {
  console.error("indexnow: the built sitemap lists no pages");
  process.exit(1);
}
const origin = new URL(urls[0]).origin;

async function get(url) {
  try {
    const r = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(15000) });
    return { status: r.status, body: r.status === 200 ? Buffer.from(await r.arrayBuffer()) : null };
  } catch {
    return { status: 0, body: null };
  }
}

// The built file behind a sitemap URL: /a/b/ is a/b/index.html.
const builtFile = (url) => {
  const path = decodeURIComponent(new URL(url).pathname);
  return join(dir, path.endsWith("/") ? path + "index.html" : path);
};

const changed = [];
const queue = [...urls];
await Promise.all(
  Array.from({ length: 8 }, async () => {
    for (let url = queue.shift(); url; url = queue.shift()) {
      const file = builtFile(url);
      if (!existsSync(file)) continue;
      const live = await get(url);
      if (live.status !== 200 || !live.body.equals(readFileSync(file))) changed.push(url);
    }
  }),
);

const liveSitemap = await get(origin + "/sitemap.xml");
if (liveSitemap.status === 200) {
  const now = new Set(urls);
  for (const url of locs(liveSitemap.body.toString("utf8"))) if (!now.has(url)) changed.push(url);
}

changed.sort();
console.error(`indexnow: ${changed.length} of ${urls.length} sitemap pages are new, changed or removed`);
const out = [`host=${new URL(origin).host}`, `key=${keyFile.slice(0, 32)}`];
if (changed.length > 0) out.push("urls<<INDEXNOW_URLS", ...changed, "INDEXNOW_URLS");
process.stdout.write(out.join("\n") + "\n");
