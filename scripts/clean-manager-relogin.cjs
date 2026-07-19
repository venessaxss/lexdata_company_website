const fs = require("fs");
const path = require("path");

const root = process.cwd();
const base = path.join(root, "app", "manager");

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;

  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);

    if (stat.isDirectory()) {
      walk(full, out);
    } else if (/\.(ts|tsx)$/.test(full)) {
      out.push(full);
    }
  }

  return out;
}

function cleanManagerFile(text) {
  let out = text;

  // Remove full blocks like:
  // if (!user) {
  //   redirect("/login?next=...");
  // }
  out = out.replace(
    /if\s*\([^\)]*\)\s*\{\s*redirect\(["']\/login[^"']*["']\);\s*\}/g,
    ""
  );

  // Remove one-line checks:
  // if (!user) redirect("/login?next=...");
  out = out.replace(
    /if\s*\([^\)]*\)\s*redirect\(["']\/login[^"']*["']\);?/g,
    ""
  );

  // Remove any remaining standalone direct login redirect line.
  out = out.replace(
    /^\s*redirect\(["']\/login[^"']*["']\);\s*$/gm,
    ""
  );

  // Repair the duplicated role-check corruption from earlier patches.
  out = out.replace(
    /role\s*!==\s*"admin"\s*&&\s*\(\s*role\s*!==\s*"manager"\s*&&\s*role\s*!==\s*"admin"\s*\)/g,
    'role !== "admin" && role !== "manager"'
  );

  out = out.replace(
    /role\s*!==\s*'admin'\s*&&\s*\(\s*role\s*!==\s*'manager'\s*&&\s*role\s*!==\s*'admin'\s*\)/g,
    "role !== 'admin' && role !== 'manager'"
  );

  out = out.replace(
    /profile\?\.\(/g,
    "profile?.role && profile?.role.includes("
  );

  return out;
}

let changed = 0;

for (const file of walk(base)) {
  const before = fs.readFileSync(file, "utf8");
  const after = cleanManagerFile(before);

  if (after !== before) {
    fs.writeFileSync(file, after, "utf8");
    console.log("Cleaned:", path.relative(root, file));
    changed++;
  }
}

console.log(`Done. Cleaned ${changed} manager file(s).`);

let failed = false;

for (const file of walk(base)) {
  const text = fs.readFileSync(file, "utf8");
  const rel = path.relative(root, file);

  if (/redirect\(["']\/login/.test(text)) {
    console.error("Still has direct login redirect:", rel);
    failed = true;
  }

  if (/profile\?\.\(/.test(text)) {
    console.error("Still has broken profile?.(...) expression:", rel);
    failed = true;
  }

  if (/role\s*!==\s*"admin"\s*&&\s*\(\s*role\s*!==\s*"manager"\s*&&\s*role\s*!==\s*"admin"\s*\)/.test(text)) {
    console.error("Still has duplicated role check:", rel);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}