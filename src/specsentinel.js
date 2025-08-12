// src/spec-sentinel.js
const fs = require('fs');
const path = require('path');

// SPEC_ID is set by workflow from branch name, default if missing
const SPEC_ID = process.env.SPEC_ID || 'UNKNOWN';

// Ensure reports folder exists
const reportsDir = path.join(process.cwd(), 'reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// Simple markdown content
const content = `# Spec Sentinel Report

**Spec/Ticket:** ${SPEC_ID}

Status: ✅ Workflow connected and report generated.

> This is a placeholder MVP report. We will later add real checks here.
`;

// Write file
const outPath = path.join(reportsDir, 'spec-report.md');
fs.writeFileSync(outPath, content, 'utf8');

console.log(`Wrote report to ${outPath}`);
