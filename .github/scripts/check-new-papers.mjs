// Weekly new-paper watch (.github/workflows/new-papers.yml). Reads the PI's ORCID iD from
// _data/pi.yml, asks ORCID's public API for the PI's works, and lists those that are not in
// _data/publications.yml in one GitHub issue, "Papers on ORCID that are not on the site"
// (label new-paper; .github/scripts/report-issue.mjs), which the check closes once none is
// missing.
//
// Compared by DOI (lowercase, without https://doi.org/): a paper on the site is any DOI address
// in its entry (doi, preprint_url, dataset). ORCID groups the records of one work (from
// Crossref, Scopus, the PI); the work is on the site when one of its own DOIs is. Two kinds of
// twin DOI count as the same: a preprint's version DOI and its base (ChemRxiv's ...-v2 and
// ...), and Angewandte Chemie's German and International editions (10.1002/ange.X and
// 10.1002/anie.X, one article). An arXiv id counts as its DOI, 10.48550/arxiv.<id>. A work
// that is listed although another version of it (say the preprint of a journal article) or a
// paper with its title is on the site says so, as its entry may need the new DOI. A work
// without a DOI cannot be compared and is only counted.
//
// A work the lab leaves off the site on purpose: put its DOI in
// .github/scripts/new-paper-ignore.txt.
//
// Usage, from the repository root: node .github/scripts/check-new-papers.mjs [--dry-run]
// (--dry-run prints the issue instead of writing it; no token needed)
import { existsSync, readFileSync } from "node:fs";
import { parse } from "yaml";
import { report, summary } from "./report-issue.mjs";

const dryRun = process.argv.includes("--dry-run");
if (!existsSync("_data/pi.yml")) {
  console.error("check-new-papers: run it from the repository root (it reads _data/)");
  process.exit(2);
}
const read = (file) => parse(readFileSync(file, "utf8"), { uniqueKeys: false, merge: true });

// A DOI as compared, from a bare DOI, a doi: name or a doi.org address; null for anything else.
function doiOf(value) {
  const m = String(value ?? "").trim().match(/^(?:https?:\/\/(?:dx\.|www\.)?doi\.org\/|doi:\s*)?(10\.\d{4,9}\/\S+)$/i);
  if (!m) return null;
  try {
    return decodeURIComponent(m[1]).toLowerCase();
  } catch {
    return m[1].toLowerCase();
  }
}

const orcid = String(read("_data/pi.yml").orcid ?? "").match(/\d{4}-\d{4}-\d{4}-\d{3}[\dX]/i)?.[0];
if (!orcid) {
  console.error("check-new-papers: no ORCID iD in _data/pi.yml (orcid:)");
  process.exit(2);
}

// What two DOIs of one article share (the twins named at the top).
const key = (doi) => doi.replace(/[-/]v\d+$/, "").replace(/^10\.1002\/ange\./, "10.1002/anie.");
// A title as compared: letters and digits only (ORCID may write U+2010 where the site has -).
const plain = (title) => String(title ?? "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

const byKey = new Map(); // DOI key -> paper id
const byTitle = new Map(); // plain title -> paper id
for (const paper of read("_data/publications.yml")) {
  for (const value of Object.values(paper)) {
    const doi = doiOf(value);
    if (doi) byKey.set(key(doi), paper.id);
  }
  byTitle.set(plain(paper.title), paper.id);
}

// .github/scripts/new-paper-ignore.txt: one DOI per line (bare or as a doi.org address);
// # starts a comment.
const ignoreFile = ".github/scripts/new-paper-ignore.txt";
const ignored = new Set(existsSync(ignoreFile)
  ? readFileSync(ignoreFile, "utf8").split(/\r?\n/).map((l) => doiOf(l.replace(/(^|\s)#.*$/, ""))).filter(Boolean).map(key)
  : []);

// The PI's works; two more tries, a little later, if ORCID does not answer or is busy.
async function works() {
  for (let n = 0; ; n++) {
    const res = await fetch(`https://pub.orcid.org/v3.0/${orcid}/works`, {
      headers: { Accept: "application/json", "User-Agent": "sail-new-paper-watch/1.0 (+https://sail.kookmin.ac.kr)" },
      signal: AbortSignal.timeout(30000),
    }).catch((err) => ({ ok: false, status: 0, err }));
    if (res.ok) return (await res.json()).group || [];
    const lasting = res.status >= 400 && res.status < 500 && res.status !== 429;
    if (n === 2 || lasting) throw new Error(res.status ? `ORCID answered HTTP ${res.status}` : `no answer (${res.err.message})`);
    await new Promise((done) => setTimeout(done, 10000 * (n + 1)));
  }
}

const groups = await works().catch((err) => {
  console.error(`check-new-papers: could not read the works of ORCID ${orcid}: ${err.message}`);
  process.exit(1);
});

const ids = (holder) => holder?.["external-ids"]?.["external-id"] || [];
// A work's DOIs with the given relationship ("self": its own; "version-of": another version's).
function doisOf(group, relationship) {
  const out = [];
  for (const e of [...ids(group), ...(group["work-summary"] || []).flatMap(ids)]) {
    if (e["external-id-relationship"] !== relationship) continue;
    const value = String(e["external-id-normalized"]?.value || e["external-id-value"] || "").trim();
    const doi = e["external-id-type"] === "doi" ? doiOf(value)
      : e["external-id-type"] === "arxiv" ? `10.48550/arxiv.${value.replace(/^arxiv:/i, "").replace(/v\d+$/i, "").toLowerCase()}`
      : null;
    if (doi && !out.includes(doi)) out.push(doi);
  }
  return out;
}

const missing = [];
let withoutDoi = 0;
for (const group of groups) {
  const own = doisOf(group, "self");
  if (!own.length) {
    withoutDoi++;
    continue;
  }
  if (own.some((d) => byKey.has(key(d)) || ignored.has(key(d)))) continue;
  const r = group["work-summary"]?.[0] || {};
  const title = r.title?.title?.value || "(no title)";
  const other = doisOf(group, "version-of").find((d) => byKey.has(key(d)));
  const note = other ? `another version of it is paper ${byKey.get(key(other))} on the site`
    : byTitle.has(plain(title)) ? `paper ${byTitle.get(plain(title))} on the site has this title` : "";
  missing.push({
    title: note ? `${title} (${note})` : title,
    journal: r["journal-title"]?.value || "",
    year: r["publication-date"]?.year?.value || "",
    type: (r.type || "").replace(/-/g, " "),
    doi: own[0],
  });
}
missing.sort((a, b) => String(b.year).localeCompare(String(a.year)) || a.title.localeCompare(b.title));

const cell = (s) => String(s).replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
const n = missing.length;
const body = [
  `The PI's ORCID record ([${orcid}](https://orcid.org/${orcid})) lists ${n} work${n === 1 ? "" : "s"} whose DOI is not in ` +
    "`_data/publications.yml`:",
  "",
  "| Title | Journal | Year | Type | DOI |",
  "|---|---|---|---|---|",
  ...missing.map((m) => `| ${cell(m.title)} | ${cell(m.journal)} | ${m.year} | ${cell(m.type)} | [${m.doi}](https://doi.org/${m.doi}) |`),
  "",
  "Add each one to `_data/publications.yml` (CONTRIBUTING, \"Add a publication\"); once all are there, the next check " +
    "closes this issue. A work the lab leaves off the site on purpose: add its DOI to `.github/scripts/new-paper-ignore.txt`.",
].join("\n");
const closeNote = `Every work on the PI's ORCID record that has a DOI is now on the site${ignored.size ? " or in new-paper-ignore.txt" : ""}.`;

console.log(`check-new-papers: ORCID ${orcid}: ${groups.length} works, ${withoutDoi} without a DOI (not compared), ` +
  `${byKey.size} DOIs on the site, ${ignored.size} ignored; ${n} not on the site`);
summary(n ? `### Papers on ORCID that are not on the site\n\n${body}` : `### New papers: none missing\n\n${closeNote}`);
await report({
  label: "new-paper",
  labelColor: "0e8a16",
  labelDescription: "Opened and closed by the weekly new-paper watch",
  open: n > 0,
  title: "Papers on ORCID that are not on the site",
  body,
  closeNote,
  dryRun,
}).catch((err) => {
  console.error(`check-new-papers: ${err.message}`);
  process.exitCode = 1;
});
