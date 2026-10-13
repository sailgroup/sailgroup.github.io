// Accessibility check of the built site with axe-core. Runs in CI's build job after
// html-proofer: it serves the built folder on a local port, opens every page in Chrome at
// 1280x800 and runs axe-core's WCAG 2.0, 2.1 and 2.2 level A and AA rules, then does the same
// once more on the home page at 390 px wide with the phone menu open. A page is any .html file
// except the redirect stubs (a <meta http-equiv="refresh">: the old /members/<slug>/ and
// /alumni/<slug>/ addresses that _plugins/generate_pages.rb writes) and files that are not
// pages at all (no <html> element, such as a search engine's verification file).
//
// Each violation is listed with its page, axe's rule, its impact and the element's selector,
// plus the rule's explanation on dequeuniversity.com. With A11Y_STRICT=false (the workflow
// sets it on main) violations are only warnings and the step passes, so a content push always
// deploys; otherwise (dev, pull requests, a run on your own machine) they fail the step.
//
// Chrome: the one GitHub's Ubuntu runners carry ($CHROME_BIN, or google-chrome on the PATH),
// so nothing is downloaded. Elsewhere, set CHROME_BIN to the path of a Chrome or Chromium.
//
// Usage: node .github/scripts/check-a11y.mjs <built site dir>
import { appendFileSync, existsSync, readdirSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { delimiter, extname, join, resolve, sep } from "node:path";
import axe from "axe-core";
import puppeteer from "puppeteer-core";

const dir = process.argv[2];
if (!dir || !existsSync(join(dir, "index.html"))) {
  console.error("usage: node check-a11y.mjs <built site dir> (the folder jekyll build wrote)");
  process.exit(2);
}
const root = resolve(dir);
const strict = process.env.A11Y_STRICT !== "false";

// WCAG 2.0, 2.1 and 2.2 at levels A and AA, as axe-core tags its rules. (No axe rule carries
// a "wcag22a" tag: the two level A criteria new in 2.2 need a person to judge them.)
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

// A false alarm is silenced here, with the reason beside it (none so far): a rule id in
// RULES_OFF turns that rule off on every page; a CSS selector in EXCLUDE leaves that element,
// and everything inside it, out of the check.
const RULES_OFF = [];
const EXCLUDE = [];

function findChrome() {
  if (process.env.CHROME_BIN) return process.env.CHROME_BIN;
  for (const name of ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"]) {
    for (const d of (process.env.PATH || "").split(delimiter)) {
      if (d && existsSync(join(d, name))) return join(d, name);
    }
  }
  return null;
}

// Every page of the build as a site path: /news/ for news/index.html, /404.html for 404.html.
function sitePages() {
  const out = [];
  for (const rel of readdirSync(root, { recursive: true })) {
    if (!rel.endsWith(".html")) continue;
    const html = readFileSync(join(root, rel), "utf8");
    if (!/<html[\s>]/i.test(html) || /<meta[^>]+http-equiv=["']?refresh/i.test(html)) continue;
    const path = "/" + rel.split(sep).join("/");
    out.push(path.endsWith("/index.html") ? path.slice(0, -"index.html".length) : path);
  }
  return out.sort();
}

const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript",
  ".json": "application/json", ".xml": "application/xml", ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".gif": "image/gif", ".webp": "image/webp", ".avif": "image/avif", ".ico": "image/x-icon",
  ".woff2": "font/woff2", ".woff": "font/woff", ".pdf": "application/pdf",
};

// The built folder over HTTP on a free local port, the way GitHub Pages serves it: /a/ is
// a/index.html, a folder asked for without its slash is redirected, a missing file is 404.
function serve() {
  const notFound = existsSync(join(root, "404.html")) ? readFileSync(join(root, "404.html")) : "Not found";
  const server = createServer(async (req, res) => {
    try {
      let path = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
      if (path.endsWith("/")) path += "index.html";
      const file = resolve(root, "." + path);
      if (!file.startsWith(root + sep)) throw new Error("outside the site");
      const body = await readFile(file).catch(() => null);
      if (body) {
        res.writeHead(200, { "Content-Type": TYPES[extname(file).toLowerCase()] || "application/octet-stream" });
        res.end(body);
      } else if (existsSync(join(file, "index.html"))) {
        res.writeHead(301, { Location: path + "/" });
        res.end();
      } else {
        res.writeHead(404, { "Content-Type": TYPES[".html"] });
        res.end(notFound);
      }
    } catch {
      res.writeHead(400);
      res.end();
    }
  });
  return new Promise((done) => server.listen(0, "127.0.0.1", () => done(server)));
}

async function launch(executablePath) {
  const options = { executablePath, headless: true };
  try {
    return await puppeteer.launch(options);
  } catch (err) {
    // On Linux, Chrome's sandbox can be unavailable to the runner's user. The pages are this
    // build's own, served from this machine, so Chrome may then run without it.
    if (process.platform !== "linux") throw err;
    console.log(`check-a11y: Chrome did not start with its sandbox (${firstLine(err)}); starting it without`);
    return puppeteer.launch({ ...options, args: ["--no-sandbox"] });
  }
}

// Bypassing the pages' CSP: its Trusted Types would refuse axe's script. The policy allows
// everything the pages themselves load (all of it from the site), so the page is the same.
async function newTab(browser, width, height) {
  const tab = await browser.newPage();
  await tab.setBypassCSP(true);
  await tab.setViewport({ width, height });
  return tab;
}

async function open(tab, base, path) {
  const res = await tab.goto(base + path, { waitUntil: "load", timeout: 30000 });
  if (!res || res.status() !== 200) throw new Error(`the page answered HTTP ${res ? res.status() : "nothing"}`);
  await tab.evaluate(() => document.fonts.ready.then(() => undefined));
}

async function runAxe(tab) {
  await tab.evaluate(axe.source);
  return tab.evaluate(
    (context, options) => window.axe.run(context || document, options).then((r) => r.violations.map((v) => ({
      rule: v.id, impact: v.impact, help: v.help, helpUrl: v.helpUrl.split("?")[0], targets: v.nodes.map((n) => n.target.join(" ")),
    }))),
    EXCLUDE.length ? { exclude: EXCLUDE } : null,
    {
      runOnly: { type: "tag", values: TAGS },
      rules: Object.fromEntries(RULES_OFF.map((id) => [id, { enabled: false }])),
      resultTypes: ["violations"],
    },
  );
}

const firstLine = (err) => String(err?.message ?? err).split("\n")[0];

// A line for GitHub's run page (an annotation); its text must not break the line.
const annotate = (level, text) =>
  console.log(`::${level} title=Accessibility (axe)::${text.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A")}`);

const chrome = findChrome();
if (!chrome || !existsSync(chrome)) {
  console.error(`check-a11y: no Chrome found${chrome ? ` at ${chrome}` : ""}. Set CHROME_BIN to a Chrome or Chromium (GitHub's Ubuntu runners set it).`);
  process.exit(2);
}

const started = Date.now();
const pages = sitePages();
const browser = await launch(chrome).catch((err) => {
  console.error(`check-a11y: Chrome (${chrome}) did not start: ${firstLine(err)}`);
  process.exit(2);
});
const server = await serve();
const base = `http://127.0.0.1:${server.address().port}`;
const found = []; // { page, rule, impact, help, helpUrl, targets }
const failed = []; // pages that could not be checked
try {
  // Every page at a desktop width, four tabs at a time.
  const queue = [...pages];
  await Promise.all(Array.from({ length: 4 }, async () => {
    const tab = await newTab(browser, 1280, 800);
    for (let path = queue.shift(); path; path = queue.shift()) {
      try {
        await open(tab, base, path);
        for (const v of await runAxe(tab)) found.push({ page: path, ...v });
      } catch (err) {
        failed.push(`${path}: ${firstLine(err)}`);
      }
    }
    await tab.close();
  }));

  // The phone menu, opened with its button on the home page.
  const label = "/ (390 px wide, phone menu open)";
  const tab = await newTab(browser, 390, 844);
  try {
    await open(tab, base, "/");
    await tab.click(".nav-toggle");
    await tab.waitForSelector('.nav-toggle[aria-expanded="true"]', { timeout: 5000 });
    for (const v of await runAxe(tab)) found.push({ page: label, ...v });
  } catch (err) {
    failed.push(`${label}: could not open the menu with its button (.nav-toggle): ${firstLine(err)}`);
  }
} finally {
  await browser.close();
  server.closeAllConnections();
  server.close();
}

const seconds = Math.round((Date.now() - started) / 1000);
const nodes = found.reduce((n, v) => n + v.targets.length, 0);
const headline = `axe-core ${axe.version}, WCAG 2.2 A and AA: ${pages.length} pages and the phone menu in ${seconds} s; ` +
  `${found.length} violations (${nodes} elements)${failed.length ? `; ${failed.length} not checked` : ""}`;
console.log(headline);

found.sort((a, b) => a.page.localeCompare(b.page) || a.rule.localeCompare(b.rule));
let page = "";
for (const v of found) {
  if (v.page !== page) console.log(`\n${(page = v.page)}`);
  console.log(`  ${v.rule} (${v.impact}): ${v.help}\n    ${v.targets.join("\n    ")}\n    ${v.helpUrl}`);
}
for (const f of failed) console.log(`\nNot checked: ${f}`);
if (found.length || failed.length) console.log("");
for (const v of found) {
  const at = v.targets.slice(0, 3).join(", ") + (v.targets.length > 3 ? ` and ${v.targets.length - 3} more` : "");
  annotate(strict ? "error" : "warning", `${v.page} ${v.rule} (${v.impact}): ${v.help}, at ${at}`);
}
for (const f of failed) annotate("error", `Not checked: ${f}`);

if (process.env.GITHUB_STEP_SUMMARY) {
  const cell = (s) => String(s).replace(/\|/g, "\\|").replace(/\n/g, " ");
  const rows = found.map((v) => `| ${cell(v.page)} | [${v.rule}](${v.helpUrl}) | ${v.impact} | ${cell(v.targets.join(", "))} |`);
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, [
    `### Accessibility: ${headline}${found.length && !strict ? " (warnings only, on main)" : ""}`,
    "",
    ...(rows.length ? ["| Page | Rule | Impact | Element |", "|---|---|---|---|", ...rows, ""] : []),
    ...failed.map((f) => `- Not checked: ${cell(f)}`),
    "",
  ].join("\n"));
}

process.exitCode = failed.length ? 2 : found.length && strict ? 1 : 0;
