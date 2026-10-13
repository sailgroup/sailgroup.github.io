// Monthly link check (.github/workflows/link-check.yml). Every outside link the site shows is
// read from the data files (not from the built pages) and checked once; the ones that need a
// look go into one GitHub issue, label link-check (.github/scripts/report-issue.mjs).
//
// Read: _data/publications.yml (each paper's doi, preprint_url, code, dataset), people.yml and
// pi.yml (Scholar, GitHub, ORCID, LinkedIn, website, related labs), navigation.yml, news.yml,
// positions.yml and member_pubs/*.yml. Any value that is a whole http(s) address counts, so a
// field added later is checked too; so does a bare DOI (10.xxxx/...) in a doi field.
//
// Checked one request at a time per host, with a pause in between; 15 s timeout, and two
// retries after a pause when there is no answer, a server error or 429.
//   - A DOI through doi.org's handle API, which says whether the DOI is registered, instead of
//     the publisher's page (publishers often refuse scripts).
//   - GitHub (a person, organization or repository) through GitHub's API; an ORCID iD through
//     ORCID's (orcid.org answers 200 even for an iD that does not exist); a figshare.com item
//     through figshare's (the site answers scripts with a challenge page).
//   - Anything else: HEAD, then GET if HEAD is not answered with 2xx (some servers refuse or
//     mishandle HEAD). A Google document that ends on Google's sign-in page needs a look: it is
//     probably no longer shared.
// "Could not check", listed but never opening the issue by itself: 401, 403 or 429 from a site
// that refuses scripted visits (Google Scholar, LinkedIn, ResearchGate, figshare, publishers),
// or a sign-in page on one of those; 429 or LinkedIn's 999 anywhere; 202 (a challenge page
// instead of the page); Google's robot check; an API that does not answer. A sign-in page on
// any other site needs a look (the page is no longer public).
//
// A false alarm (the link works in a browser): add it to .github/scripts/link-check-ignore.txt.
//
// Usage, from the repository root: node .github/scripts/check-links.mjs [--dry-run]
// (--dry-run prints the issue instead of writing it; no token needed)
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { parse } from "yaml";
import { report, summary } from "./report-issue.mjs";

const dryRun = process.argv.includes("--dry-run");
if (!existsSync("_data/publications.yml")) {
  console.error("check-links: run it from the repository root (it reads _data/)");
  process.exit(2);
}
const UA = "sail-link-check/1.0 (+https://sail.kookmin.ac.kr; a monthly check of the site's own links)";
const PAUSE = 1000; // ms between two requests to one host
const TIMEOUT = 15000;
const RETRIES = 2;

// Sites that refuse scripted visits although the page works in a browser (and its subdomains).
const WALLED = [
  "scholar.google.com", "linkedin.com", "researchgate.net", "figshare.com",
  "pubs.acs.org", "pubs.rsc.org", "wiley.com", "sciencedirect.com", "elsevier.com",
  "springer.com", "nature.com", "science.org", "tandfonline.com", "oup.com", "iop.org",
  "aip.org", "mdpi.com", "cell.com", "pnas.org", "chemrxiv.org", "biorxiv.org",
];
const walled = (host) => WALLED.some((d) => host === d || host.endsWith("." + d));

// Data files and how to name an entry of each (a file holding a map names it by its key).
const SOURCES = [
  ["_data/publications.yml", (p) => `paper ${p.id}`],
  ["_data/people.yml", (p) => p.name],
  ["_data/pi.yml"],
  ["_data/navigation.yml", (n) => n.name],
  ["_data/news.yml", (n) => `${n.date}, ${n.title}`],
  ["_data/positions.yml"],
  ...readdirSync("_data/member_pubs").filter((f) => f.endsWith(".yml")).sort()
    .map((f) => [`_data/member_pubs/${f}`, (p) => p.title]),
];

function asUrl(value, field) {
  if (/^https?:\/\/\S+$/i.test(value)) return value;
  if (field === "doi" && /^10\.\d{4,9}\/\S+$/.test(value)) return `https://doi.org/${value}`;
  return null;
}

// Every link in one data file, as { file, entry, field, url }.
function linksIn(file, name) {
  const data = parse(readFileSync(file, "utf8"), { uniqueKeys: false, merge: true });
  const out = [];
  const named = (v) => v && typeof v === "object" && !Array.isArray(v) && (v.name || v.title);
  const walk = (value, entry, field) => {
    if (typeof value === "string") {
      const url = asUrl(value.trim(), field);
      if (url) out.push({ file, entry, field, url });
    } else if (Array.isArray(value)) {
      for (const v of value) walk(v, named(v) ? `${entry}: ${named(v)}` : entry, field);
    } else if (value && typeof value === "object") {
      for (const [k, v] of Object.entries(value)) walk(v, entry, k);
    }
  };
  if (Array.isArray(data)) for (const item of data) walk(item, String(name(item) ?? "(unnamed entry)"), "");
  else if (data && typeof data === "object") for (const [k, v] of Object.entries(data)) walk(v, k, k);
  return out;
}

// .github/scripts/link-check-ignore.txt: one address per line; a line ending in * covers every
// address that starts with it; # starts a comment.
function ignored() {
  const file = ".github/scripts/link-check-ignore.txt";
  if (!existsSync(file)) return () => false;
  const lines = readFileSync(file, "utf8").split(/\r?\n/).map((l) => l.replace(/(^|\s)#.*$/, "").trim()).filter(Boolean);
  return (url) => lines.some((l) => (l.endsWith("*") ? url.startsWith(l.slice(0, -1)) : url === l));
}

// How to check one address: the host asked (for pacing), the address asked, and the kind.
function plan(url) {
  const u = new URL(url);
  const host = u.hostname.toLowerCase();
  const parts = u.pathname.split("/").filter(Boolean);
  if (/^(dx\.|www\.)?doi\.org$/.test(host) && /^10\.\d{4,9}$/.test(parts[0] || "")) {
    const doi = parts.map((p) => encodeURIComponent(decodeURIComponent(p))).join("/");
    return { host: "doi.org", kind: "doi", target: `https://doi.org/api/handles/${doi}` };
  }
  if (/^(www\.)?github\.com$/.test(host) && (parts.length === 1 || parts.length === 2)) {
    const target = parts.length === 1 ? `users/${parts[0]}` : `repos/${parts[0]}/${parts[1].replace(/\.git$/, "")}`;
    return { host: "api.github.com", kind: "api", target: `https://api.github.com/${target}` };
  }
  const orcid = /^(www\.)?orcid\.org$/.test(host) && u.pathname.match(/^\/(\d{4}-\d{4}-\d{4}-\d{3}[\dX])\/?$/i);
  if (orcid) return { host: "pub.orcid.org", kind: "api", target: `https://pub.orcid.org/v3.0/${orcid[1].toUpperCase()}/person` };
  const fig = /(^|\.)figshare\.com$/.test(host) && u.pathname.match(/^\/articles\/(?:[^/]+\/)*?(\d+)(?:\/(\d+))?\/?$/);
  if (fig) return { host: "api.figshare.com", kind: "api", target: `https://api.figshare.com/v2/articles/${fig[1]}${fig[2] ? `/versions/${fig[2]}` : ""}` };
  return { host, kind: "page", target: url };
}

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

async function request(url, method, readBody) {
  const headers = { "User-Agent": UA, Accept: "text/html,application/json;q=0.9,*/*;q=0.8" };
  // The token goes to GitHub's API only (more requests per hour), never to another site.
  if (process.env.GH_TOKEN && new URL(url).hostname === "api.github.com") headers.Authorization = `Bearer ${process.env.GH_TOKEN}`;
  try {
    const res = await fetch(url, { method, headers, redirect: "follow", signal: AbortSignal.timeout(TIMEOUT) });
    const body = readBody ? await res.text() : "";
    if (!readBody) await res.body?.cancel();
    return { status: res.status, url: res.url, body };
  } catch (err) {
    return { status: 0, error: err.name === "TimeoutError" ? "no answer in 15 s" : err.cause?.code || err.message };
  }
}

// One attempt: { state: "ok" | "broken" | "unknown", status, retry }.
async function attempt(p) {
  if (p.kind === "doi") {
    const r = await request(p.target, "GET", true);
    let code = null;
    try { code = JSON.parse(r.body).responseCode; } catch {}
    if (r.status === 200 && code === 1) return { state: "ok" };
    if (r.status === 404 || code === 100) return { state: "broken", status: "not a registered DOI (doi.org)" };
    return { state: "unknown", status: `doi.org did not answer (${r.status ? `HTTP ${r.status}` : r.error})`, retry: true };
  }
  if (p.kind === "api") {
    const r = await request(p.target, "GET", false);
    const api = new URL(p.target).hostname;
    if (r.status === 200) return { state: "ok" };
    if (r.status === 404 || r.status === 410) return { state: "broken", status: `not found (HTTP ${r.status} from ${api})` };
    if (r.status >= 400 && r.status < 500 && r.status !== 403 && r.status !== 429) return { state: "broken", status: `HTTP ${r.status} from ${api}` };
    return { state: "unknown", status: `${api} did not answer (${r.status ? `HTTP ${r.status}` : r.error})`, retry: true };
  }
  if (p.kind === "invalid") return { state: "broken", status: "not a valid address" };
  const host = p.host;
  let r = await request(p.target, "HEAD", false);
  if (!(r.status >= 200 && r.status < 300 && r.status !== 202)) r = await request(p.target, "GET", false);
  const status = r.status ? `HTTP ${r.status}` : r.error;
  const end = r.url ? new URL(r.url) : null;
  if (end && /^\/sorry\//.test(end.pathname)) return { state: "unknown", status: `${status}, ends on a robot check page` };
  if (end && end.hostname === "accounts.google.com") return { state: "broken", status: "opens Google's sign-in page (no longer shared?)" };
  if (end && /\/(authwall|login|signin)\b/i.test(end.pathname)) {
    return walled(host)
      ? { state: "unknown", status: `${status}, ends on a sign-in page (the site refuses scripts)` }
      : { state: "broken", status: `${status}, ends on a sign-in page (no longer public?)` };
  }
  if (r.status === 202 || r.status === 999) return { state: "unknown", status: `${status} (the site answers scripts with a challenge)` };
  if (r.status >= 200 && r.status < 300) return { state: "ok" };
  if (r.status === 429) return { state: "unknown", status: `${status} (too many requests)`, retry: true };
  if ((r.status === 401 || r.status === 403) && walled(host)) return { state: "unknown", status: `${status} (the site refuses scripts)` };
  if (r.status >= 400 && r.status < 500) return { state: "broken", status };
  return { state: "broken", status, retry: true }; // a server error or no answer
}

async function check(p) {
  for (let n = 0; ; n++) {
    const r = await attempt(p).catch((err) => ({ state: "unknown", status: `check failed: ${err.message}` }));
    if (!r.retry || n === RETRIES) return r;
    await sleep(5000 * (n + 1));
  }
}

// Collect, then check each address once (hosts side by side, one request at a time per host).
const isIgnored = ignored();
const places = new Map(); // url -> [{ file, entry, field }]
for (const [file, name] of SOURCES) {
  for (const l of linksIn(file, name)) {
    if (isIgnored(l.url)) continue;
    if (!places.has(l.url)) places.set(l.url, []);
    places.get(l.url).push(l);
  }
}
const byHost = new Map();
for (const url of places.keys()) {
  let p;
  try {
    p = { url, ...plan(url) };
  } catch {
    p = { url, host: "", kind: "invalid" }; // a malformed address or %-escape
  }
  if (!byHost.has(p.host)) byHost.set(p.host, []);
  byHost.get(p.host).push(p);
}
const started = Date.now();
const results = [];
await Promise.all([...byHost.values()].map(async (queue) => {
  for (const [i, p] of queue.entries()) {
    if (i > 0) await sleep(PAUSE);
    results.push({ ...p, ...(await check(p)) });
  }
}));

// The report: the links that need a look, then the ones that could not be checked.
const broken = results.filter((r) => r.state === "broken").sort((a, b) => a.url.localeCompare(b.url));
const unknown = results.filter((r) => r.state === "unknown").sort((a, b) => a.url.localeCompare(b.url));
const kinds = results.reduce((n, r) => ({ ...n, [r.host]: (n[r.host] || 0) + 1 }), {});
const cell = (s) => String(s).replace(/\|/g, "\\|");
const rows = (list) => list.flatMap((r) => places.get(r.url).map((pl) =>
  `| \`${pl.file}\` | ${cell(pl.entry === pl.field ? pl.entry : `${pl.entry} (${pl.field})`)} | ${cell(r.url)} | ${cell(r.status)} |`));
const table = (list, head) => [`| File | Entry | Link | ${head} |`, "|---|---|---|---|", ...rows(list)].join("\n");
const counted = `${results.length} links from ${SOURCES.length} data files, in ${Math.round((Date.now() - started) / 1000)} s ` +
  `(${kinds["doi.org"] || 0} DOIs through doi.org, ${kinds["api.github.com"] || 0} GitHub addresses through GitHub's API, ` +
  `${kinds["pub.orcid.org"] || 0} ORCID iDs through ORCID's)`;
const n = broken.length;
const title = `Link check: ${n} link${n === 1 ? "" : "s"} need${n === 1 ? "s" : ""} a look`;
const body = [
  `The monthly link check found ${n} link${n === 1 ? "" : "s"} in the site's data that failed. Open each in a browser: ` +
    "if it is broken, correct or remove it in the data file named (or ask whoever it belongs to); if it works, the check " +
    "was wrong, so add the address to `.github/scripts/link-check-ignore.txt`.",
  "",
  table(broken, "Status"),
  ...(unknown.length ? [
    "",
    `<details><summary>${unknown.length} more could not be checked (the site refuses scripted visits, or did not answer); open them by hand now and then</summary>`,
    "",
    table(unknown, "Answer"),
    "",
    "</details>",
  ] : []),
  "",
  `Checked: ${counted}.`,
].join("\n");
const closeNote = `The link check of ${new Date().toISOString().slice(0, 10)} found nothing to fix: ${results.length - unknown.length} ` +
  `of ${results.length} links answered${unknown.length ? ` and ${unknown.length} could not be checked (the site refuses scripted visits)` : ""}.`;

console.log(`check-links: ${counted}: ${n} need a look, ${unknown.length} could not be checked`);
const runSummary = n ? `### ${title}\n\n${body}` : `### Link check: nothing to fix\n\n${closeNote}\n\n${unknown.length ? table(unknown, "Answer") : ""}`;
summary(runSummary);
if (dryRun && !n && unknown.length) console.log(`Could not be checked:\n${table(unknown, "Answer")}\n`);
await report({
  label: "link-check",
  labelColor: "d93f0b",
  labelDescription: "Opened and closed by the monthly link check",
  open: n > 0,
  title,
  body,
  closeNote,
  dryRun,
}).catch((err) => {
  console.error(`check-links: ${err.message}`);
  process.exitCode = 1;
});
