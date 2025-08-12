// Minimal, explainable "spec vs PR" checker (no AI yet).
// It reads a spec file based on a SPEC_ID (e.g., JIRA-123-checkout),
// gets the git diff for this PR, and checks for evidence of keywords from each AC.

import fs from "fs";
import { execSync } from "child_process";

const SPEC_ID = process.env.SPEC_ID || "JIRA-123-checkout";   // e.g., from branch name
const BASE_REF = process.env.BASE_REF || "main";              // PR base branch

const SPEC_PATH = `specs/${SPEC_ID}.md`;
const REPORT_DIR = "reports";
const REPORT_PATH = `${REPORT_DIR}/spec-report.md`;

function readFile(path) {
  try { return fs.readFileSync(path, "utf8"); }
  catch (e) { return null; }
}

function getDiff(baseRef) {
  // Ensure we have the base branch fetched
  try { execSync(`git fetch origin ${baseRef} --depth=1`, { stdio: "ignore" }); } catch {}
  try {
    const diff = execSync(`git diff --unified=0 origin/${baseRef}...HEAD`, { encoding: "utf8" });
    return diff || "";
  } catch (e) {
    return "";
  }
}

function parseACs(specText) {
  // Parse lines like:
  // - AC1: ... [keywords: email, optional]
  const lines = specText.split(/\r?\n/);
  const acs = [];
  for (const line of lines) {
    const m = line.match(/^\s*-\s*AC\d*:\s*(.+?)\s*\[keywords:\s*([^\]]+)\]/i);
    if (m) {
      const desc = m[1].trim();
      const kws = m[2].split(",").map(s => s.trim()).filter(Boolean);
      acs.push({ desc, keywords: kws });
    }
  }
  return acs;
}

function checkEvidence(acs, diffText) {
  const lowerDiff = diffText.toLowerCase();
  const results = acs.map(ac => {
    const hits = [];
    for (const kw of ac.keywords) {
      const needle = kw.toLowerCase();
      if (needle.startsWith('"') && needle.endsWith('"')) {
        // quoted phrase: search without the quotes
        const phrase = needle.slice(1, -1);
        if (lowerDiff.includes(phrase.toLowerCase())) hits.push(kw);
      } else {
        if (lowerDiff.includes(needle)) hits.push(kw);
      }
    }
    // "evidence" = at least one keyword found
    const hasEvidence = hits.length > 0;
    return { ...ac, hits, ok: hasEvidence };
  });
  return results;
}

function writeReport(results, specId) {
  const lines = [];
  lines.push(`# Spec Sentinel Report (${specId})\n`);
  const ok = results.filter(r => r.ok);
  const miss = results.filter(r => !r.ok);

  lines.push(`**Coverage:** ${ok.length}/${results.length} ACs have evidence in the diff.\n`);

  if (miss.length) {
    lines.push(`## ❌ Missing / No evidence`);
    for (const r of miss) lines.push(`- ${r.desc}  \n  keywords: ${r.keywords.join(", ")}`);
    lines.push("");
  }
  if (ok.length) {
    lines.push(`## ✅ With evidence`);
    for (const r of ok) lines.push(`- ${r.desc}  \n  matched: ${r.hits.join(", ")}`);
    lines.push("");
  }

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.writeFileSync(REPORT_PATH, lines.join("\n"));
  console.log(lines.join("\n"));
}

function main() {
  const specText = readFile(SPEC_PATH);
  if (!specText) {
    console.error(`Spec file not found at ${SPEC_PATH}`);
    process.exit(2);
  }
  const acs = parseACs(specText);
  const diffText = getDiff(BASE_REF);
  const results = checkEvidence(acs, diffText);
  writeReport(results, SPEC_ID);

  // Fail if any AC has zero evidence
  const missing = results.filter(r => !r.ok);
  if (missing.length) process.exit(1);
}

main();
