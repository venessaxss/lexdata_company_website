const fs = require("fs");
const path = require("path");

const root = process.cwd();
const protectedRoots = ["app/dashboard", "app/manager", "app/admin", "app/my", "app/speaker"];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(full)) out.push(full);
  }
  return out;
}

let failed = false;
for (const dir of protectedRoots) {
  for (const file of walk(path.join(root, dir))) {
    const rel = path.relative(root, file).replace(/\\/g, "/");
    const text = fs.readFileSync(file, "utf8");
    if (/redirect\(["']\/login/.test(text)) {
      console.error("Direct login redirect inside protected route:", rel);
      failed = true;
    }
    if (/\/login\?redirect=/.test(text)) {
      console.error("Old login redirect query inside protected route:", rel);
      failed = true;
    }
    if (/profile\?\.\(/.test(text)) {
      console.error("Broken profile?.(...) expression:", rel);
      failed = true;
    }
  }
}

if (failed) process.exit(1);
console.log("Protected auth scan passed.");
