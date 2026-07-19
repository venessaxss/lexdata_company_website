const fs = require("fs");
const path = require("path");

const root = process.cwd();
const roots = ["app"];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;

  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);

    if (stat.isDirectory()) {
      if (item === ".next" || item === "node_modules" || item.startsWith("_")) {
        continue;
      }

      walk(full, out);
    } else if (/\.(ts|tsx)$/.test(full)) {
      out.push(full);
    }
  }

  return out;
}

function ensureAuthImport(text, name) {
  if (!text.includes(`${name}(`)) return text;

  const authImportRegex = /import\s*\{([^}]+)\}\s*from\s*["']@\/lib\/auth["'];/m;
  const existing = text.match(authImportRegex);

  if (existing) {
    const names = existing[1].split(",").map((item) => item.trim());

    if (names.includes(name)) {
      return text;
    }

    const nextNames = [...names, name].filter(Boolean).join(", ");

    return text.replace(authImportRegex, `import { ${nextNames} } from "@/lib/auth";`);
  }

  const importLine = `import { ${name} } from "@/lib/auth";\n`;

  if (text.startsWith('"use server";\n\n')) {
    return text.replace('"use server";\n\n', `"use server";\n\n${importLine}`);
  }

  if (text.startsWith("'use server';\n\n")) {
    return text.replace("'use server';\n\n", `'use server';\n\n${importLine}`);
  }

  return importLine + text;
}

let changed = 0;

for (const base of roots) {
  for (const file of walk(path.join(root, base))) {
    let text = fs.readFileSync(file, "utf8");
    const before = text;

    text = ensureAuthImport(text, "requireAdminOrManager");
    text = ensureAuthImport(text, "requireAdmin");
    text = ensureAuthImport(text, "requireProfile");
    text = ensureAuthImport(text, "requireManagerOrAdmin");

    if (text !== before) {
      fs.writeFileSync(file, text, "utf8");
      console.log("Fixed imports:", path.relative(root, file));
      changed++;
    }
  }
}

console.log(`Done. Fixed ${changed} file(s).`);