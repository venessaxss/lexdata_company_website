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

let changed = 0;

for (const file of walk(base)) {
  let text = fs.readFileSync(file, "utf8");
  const before = text;

  // The manager layout now handles login, so manager subpages should not force /login again.
  text = text.replace(/if\s*\([^)]+\)\s*redirect\("\/login[^"]*"\);?/g, "");
  text = text.replace(/if\s*\([^)]+\)\s*redirect\('\/login[^']*'\);?/g, "");

  // Fix duplicated/corrupted admin-manager role checks.
  text = text.replace(
    /role\s*!==\s*"admin"\s*&&\s*\(\s*role\s*!==\s*"manager"\s*&&\s*role\s*!==\s*"admin"\s*\)/g,
    'role !== "admin" && role !== "manager"'
  );

  text = text.replace(
    /role\s*!==\s*'admin'\s*&&\s*\(\s*role\s*!==\s*'manager'\s*&&\s*role\s*!==\s*'admin'\s*\)/g,
    "role !== 'admin' && role !== 'manager'"
  );

  text = text.replace(
    /profile\?\.role\s*!==\s*"admin"\s*&&\s*\(\s*profile\?\.role\s*!==\s*"manager"\s*&&\s*profile\?\.role\s*!==\s*"admin"\s*\)/g,
    'profile?.role !== "admin" && profile?.role !== "manager"'
  );

  if (text !== before) {
    fs.writeFileSync(file, text, "utf8");
    console.log("Patched:", path.relative(root, file));
    changed++;
  }
}

console.log(`Done. Patched ${changed} manager file(s).`);