const fs = require("fs");
const path = require("path");

const root = process.cwd();

const protectedRoots = [
  "app/dashboard",
  "app/manager",
  "app/admin",
  "app/my",
  "app/speaker",
];

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

function cleanText(text) {
  let out = text;

  // Replace direct login redirects with unauthorized to preserve TypeScript narrowing.
  // After this, only proxy.ts sends users to /login.
  out = out.replace(
    /redirect\(["']\/login(?:\?[^"']*)?["']\)/g,
    'redirect("/unauthorized")'
  );

  // Fix old redirect query name in links, if any.
  out = out.replace(/\/login\?redirect=/g, "/login?next=");

  // Repair corrupted role checks caused by older broad patch scripts.
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

  out = out.replace(
    /profile\?\.role\s*!==\s*'admin'\s*&&\s*\(\s*profile\?\.role\s*!==\s*'manager'\s*&&\s*profile\?\.role\s*!==\s*'admin'\s*\)/g,
    "profile?.role !== 'admin' && profile?.role !== 'manager'"
  );

  return out;
}

let changed = 0;

for (const dir of protectedRoots) {
  for (const file of walk(path.join(root, dir))) {
    const before = fs.readFileSync(file, "utf8");
    const after = cleanText(before);

    if (after !== before) {
      fs.writeFileSync(file, after, "utf8");
      console.log("Cleaned:", path.relative(root, file));
      changed++;
    }
  }
}

console.log(`Done. Cleaned ${changed} protected file(s).`);

let failed = false;

for (const dir of protectedRoots) {
  for (const file of walk(path.join(root, dir))) {
    const text = fs.readFileSync(file, "utf8");
    const rel = path.relative(root, file);

    if (/redirect\(["']\/login/.test(text)) {
      console.error("Forbidden direct login redirect:", rel);
      failed = true;
    }

    if (/\/login\?redirect=/.test(text)) {
      console.error("Old redirect query found:", rel);
      failed = true;
    }

    if (/profile\?\.\(/.test(text)) {
      console.error("Broken profile?.(...) expression:", rel);
      failed = true;
    }

    if (/role\s*!==\s*"admin"\s*&&\s*\(\s*role\s*!==\s*"manager"\s*&&\s*role\s*!==\s*"admin"\s*\)/.test(text)) {
      console.error("Broken duplicated role check:", rel);
      failed = true;
    }
  }
}

if (failed) {
  process.exit(1);
}