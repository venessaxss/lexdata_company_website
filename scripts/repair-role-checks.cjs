const fs = require("fs");
const path = require("path");

const root = process.cwd();
const roots = ["app", "components", "lib"];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;

  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);

    if (stat.isDirectory()) {
      if (
        item === ".next" ||
        item === "node_modules" ||
        item.startsWith("_")
      ) {
        continue;
      }

      walk(full, out);
    } else if (/\.(ts|tsx)$/.test(full)) {
      out.push(full);
    }
  }

  return out;
}

const replacements = [
  [
    /role\s*!==\s*"admin"\s*&&\s*\(\s*role\s*!==\s*"manager"\s*&&\s*role\s*!==\s*"admin"\s*\)/g,
    'role !== "admin" && role !== "manager"',
  ],
  [
    /role\s*!==\s*'admin'\s*&&\s*\(\s*role\s*!==\s*'manager'\s*&&\s*role\s*!==\s*'admin'\s*\)/g,
    "role !== 'admin' && role !== 'manager'",
  ],
  [
    /role\s*!==\s*"manager"\s*&&\s*\(\s*role\s*!==\s*"admin"\s*&&\s*role\s*!==\s*"manager"\s*\)/g,
    'role !== "admin" && role !== "manager"',
  ],
  [
    /role\s*!==\s*'manager'\s*&&\s*\(\s*role\s*!==\s*'admin'\s*&&\s*role\s*!==\s*'manager'\s*\)/g,
    "role !== 'admin' && role !== 'manager'",
  ],
  [
    /profile\?\.role\s*!==\s*"admin"\s*&&\s*\(\s*profile\?\.role\s*!==\s*"manager"\s*&&\s*profile\?\.role\s*!==\s*"admin"\s*\)/g,
    'profile?.role !== "admin" && profile?.role !== "manager"',
  ],
  [
    /profile\?\.role\s*!==\s*'admin'\s*&&\s*\(\s*profile\?\.role\s*!==\s*'manager'\s*&&\s*profile\?\.role\s*!==\s*'admin'\s*\)/g,
    "profile?.role !== 'admin' && profile?.role !== 'manager'",
  ],
];

const badPatterns = [
  {
    regex: /profile\?\.\(/,
    label: "broken profile?.(...) expression",
  },
  {
    regex: /role\s*!==\s*"admin"\s*&&\s*\(\s*role\s*!==\s*"manager"\s*&&\s*role\s*!==\s*"admin"\s*\)/,
    label: "duplicated role admin check",
  },
  {
    regex: /role\s*!==\s*'admin'\s*&&\s*\(\s*role\s*!==\s*'manager'\s*&&\s*role\s*!==\s*'admin'\s*\)/,
    label: "duplicated role admin check",
  },
  {
    regex: /role\s*!==\s*"manager"\s*&&\s*role\s*!==\s*"admin"\s*&&\s*role\s*!==\s*"admin"/,
    label: "triple duplicated role check",
  },
];

let changed = 0;
const files = roots.flatMap((dir) => walk(path.join(root, dir)));

for (const file of files) {
  let text = fs.readFileSync(file, "utf8");
  const before = text;

  for (const [regex, replacement] of replacements) {
    text = text.replace(regex, replacement);
  }

  if (text !== before) {
    fs.writeFileSync(file, text, "utf8");
    console.log("Fixed:", path.relative(root, file));
    changed++;
  }
}

console.log(`Done. Fixed ${changed} file(s).`);

let failed = false;

for (const file of files) {
  const text = fs.readFileSync(file, "utf8");

  for (const item of badPatterns) {
    if (item.regex.test(text)) {
      console.error("STILL BROKEN:", path.relative(root, file), "-", item.label);
      failed = true;
    }
  }
}

if (failed) {
  process.exit(1);
}