# Repository instructions

## Node runtime security

Container builds use Node.js 22.23.4 or a newer security patch in the same major to address CVE-2026-111497. Keep exact patched image tags and local runtime pins aligned. Rebuild and redeploy every affected image; restarting an existing image does not update Node.
