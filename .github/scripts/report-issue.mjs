// The one GitHub issue a scheduled check keeps (the link check, the new-paper watch), written
// with GitHub's REST API and the workflow's own token. The check opens it when it finds
// something, updates it while it still does (with a comment when the list changes, since an
// edited description notifies nobody), and closes it with a comment once it finds nothing. The
// issue is found by its label, so its title and text may be edited by hand in between.
// With dryRun nothing is written: the issue's title and text are printed instead.
//
// Environment (GitHub Actions sets it): GH_TOKEN (the workflow passes github.token),
// GITHUB_REPOSITORY (owner/name), GITHUB_API_URL, and GITHUB_SERVER_URL with GITHUB_RUN_ID for
// the run's link.
import { appendFileSync } from "node:fs";

const RUN_MARK = "<!-- run -->"; // what follows it changes on every run, so it is not compared

async function gh(method, path, body) {
  const res = await fetch(`${process.env.GITHUB_API_URL || "https://api.github.com"}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.GH_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "sail-site-checks",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30000),
  });
  if (res.status === 404 && method === "GET") return null;
  if (!res.ok) throw new Error(`GitHub API ${method} ${path}: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
  return res.status === 204 ? null : res.json();
}

// Adds Markdown to the run's summary page (only inside GitHub Actions).
export function summary(markdown) {
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown + "\n");
}

// open: true when the check found something (then title and body are the issue's), false when
// it found nothing (then an open issue is closed with closeNote).
export async function report({ label, labelColor, labelDescription, open, title, body, closeNote, dryRun }) {
  const env = process.env;
  const date = new Date().toISOString().slice(0, 10);
  const run = env.GITHUB_RUN_ID ? ` ([run](${env.GITHUB_SERVER_URL}/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}))` : "";
  const footer = `${RUN_MARK}\nChecked on ${date}${run}. Each check updates this issue, and the first one that finds nothing closes it.`;
  const text = `${body}\n\n${footer}`;
  if (dryRun) {
    console.log(open
      ? `Dry run: would open or update the issue labelled "${label}":\n\nTitle: ${title}\n\n${text}`
      : `Dry run: nothing to report; would close the open issue labelled "${label}", if any, saying:\n${closeNote}`);
    return;
  }
  const repo = env.GITHUB_REPOSITORY;
  if (!env.GH_TOKEN || !repo) throw new Error("GH_TOKEN and GITHUB_REPOSITORY must be set (or run with --dry-run)");

  const listed = await gh("GET", `/repos/${repo}/issues?state=open&labels=${encodeURIComponent(label)}&per_page=20`);
  const issue = listed.filter((i) => !i.pull_request).sort((a, b) => a.number - b.number)[0];
  if (!open) {
    if (!issue) return console.log(`No open "${label}" issue, so nothing to close.`);
    await gh("POST", `/repos/${repo}/issues/${issue.number}/comments`, { body: `${closeNote}${run}` });
    await gh("PATCH", `/repos/${repo}/issues/${issue.number}`, { state: "closed", state_reason: "completed" });
    return console.log(`Closed issue #${issue.number}.`);
  }
  if (issue) {
    const norm = (s) => s.replace(/\r\n/g, "\n").trim();
    const changed = norm((issue.body || "").split(RUN_MARK)[0]) !== norm(body);
    await gh("PATCH", `/repos/${repo}/issues/${issue.number}`, { title, body: text });
    if (changed) {
      await gh("POST", `/repos/${repo}/issues/${issue.number}/comments`, {
        body: `The check of ${date} found a different list${run}; the description above is up to date.`,
      });
    }
    return console.log(`Updated issue #${issue.number}${changed ? " (the list changed, so it also got a comment)" : ""}.`);
  }
  if (!(await gh("GET", `/repos/${repo}/labels/${encodeURIComponent(label)}`))) {
    await gh("POST", `/repos/${repo}/labels`, { name: label, color: labelColor, description: labelDescription });
  }
  const created = await gh("POST", `/repos/${repo}/issues`, { title, body: text, labels: [label] });
  console.log(`Opened issue #${created.number}.`);
}
