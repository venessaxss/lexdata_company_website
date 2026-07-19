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

function clean(text) {
  let out = text;

  // Remove multi-line blocks:
  // if (...) {
  //   redirect("/login?next=...");
  // }
  out = out.replace(
    /if\s*\([^\)]*\)\s*\{\s*redirect\(["']\/login(?:\?next=[^"']*)?["']\);\s*\}/g,
    ""
  );

  // Remove one-line blocks:
  // if (...) redirect("/login?next=...");
  out = out.replace(
    /if\s*\([^\)]*\)\s*redirect\(["']\/login(?:\?next=[^"']*)?["']\);?/g,
    ""
  );

  // Remove remaining direct login redirect lines.
  out = out.replace(
    /^\s*redirect\(["']\/login(?:\?next=[^"']*)?["']\);\s*$/gm,
    ""
  );

  // Repair duplicated role checks created by earlier bad patch.
  out = out.replace(
    /role\s*!==\s*"admin"\s*&&\s*\(\s*role\s*!==\s*"manager"\s*&&\s*role\s*!==\s*"admin"\s*\)/g,
    'role !== "admin" && role !== "manager"'
  );

  out = out.replace(
    /role\s*!==\s*'admin'\s*&&\s*\(\s*role\s*!==\s*'manager'\s*&&\s*role\s*!==\s*'admin'\s*\)/g,
    "role !== 'admin' && role !== 'manager'"
  );

  out = out.replace(
    /profile\?\.role\s*!==\s*"admin"\s*&&\s*\(\s*profile\?\.role\s*!==\s*"manager"\s*&&\s*profile\?\.role\s*!==\s*"admin"\s*\)/g,
    'profile?.role !== "admin" && profile?.role !== "manager"'
  );

  return out;
}

let changed = 0;

for (const file of walk(base)) {
  const before = fs.readFileSync(file, "utf8");
  const after = clean(before);

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

  if (/redirect\(["']\/login/.test(text)) {
    console.error("STILL HAS LOGIN REDIRECT:", path.relative(root, file));
    failed = true;
  }

  if (/profile\?\.\(/.test(text)) {
    console.error("STILL HAS BROKEN profile?.(...) PATTERN:", path.relative(root, file));
    failed = true;
  }

  if (/role\s*!==\s*"admin"\s*&&\s*\(\s*role\s*!==\s*"manager"\s*&&\s*role\s*!==\s*"admin"\s*\)/.test(text)) {
    console.error("STILL HAS DUPLICATED ROLE CHECK:", path.relative(root, file));
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}