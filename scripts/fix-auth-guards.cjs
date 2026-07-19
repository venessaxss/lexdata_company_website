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
    } else if (/\.(tsx|ts)$/.test(full)) {
      out.push(full);
    }
  }

  return out;
}

function routeFromFile(file) {
  const rel = path.relative(root, file).replace(/\\/g, "/");

  let route = rel
    .replace(/^app/, "")
    .replace(/\/page\.tsx$/, "")
    .replace(/\/layout\.tsx$/, "")
    .replace(/\/route\.ts$/, "")
    .replace(/\[([^\]]+)\]/g, "$1");

  if (!route || route === "") route = "/dashboard";
  return route;
}

let changed = 0;

for (const base of protectedRoots) {
  const files = walk(path.join(root, base));

  for (const file of files) {
    let text = fs.readFileSync(file, "utf8");
    const before = text;
    const route = routeFromFile(file);
    const next = encodeURIComponent(route);

    // Old redirect query name:
    text = text.replace(/redirect\("\/login\?redirect=[^"]*"\)/g, `redirect("/login?next=${next}")`);
    text = text.replace(/redirect\('\/login\?redirect=[^']*'\)/g, `redirect("/login?next=${next}")`);

    // Plain /login redirects:
    text = text.replace(/redirect\("\/login"\)/g, `redirect("/login?next=${next}")`);
    text = text.replace(/redirect\('\/login'\)/g, `redirect("/login?next=${next}")`);

    // Old manager-only role checks should allow admin too.
    text = text.replace(/requireRole\(\["manager"\]\)/g, 'requireRole(["admin", "manager"])');
    text = text.replace(/requireRole\(\['manager'\]\)/g, 'requireRole(["admin", "manager"])');

    text = text.replace(
      /profile\?\.role !== "manager"/g,
      '(profile?.role !== "manager" && profile?.role !== "admin")'
    );

    text = text.replace(
      /profile\?\.role !== 'manager'/g,
      "(profile?.role !== 'manager' && profile?.role !== 'admin')"
    );

    text = text.replace(
      /role !== "manager"/g,
      '(role !== "manager" && role !== "admin")'
    );

    text = text.replace(
      /role !== 'manager'/g,
      "(role !== 'manager' && role !== 'admin')"
    );

    if (text !== before) {
      fs.writeFileSync(file, text, "utf8");
      console.log("Patched:", path.relative(root, file));
      changed++;
    }
  }
}

console.log(`Done. Patched ${changed} file(s).`);