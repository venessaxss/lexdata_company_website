const fs = require("fs");
const path = require("path");

const root = process.cwd();

const targetRoots = [
  "app/admin",
  "app/manager",
  "app/dashboard",
  "app/my",
  "app/speaker",
];

const helperNames = [
  "requireManagerOrAdmin",
  "requireAdminOrManager",
  "requireAdmin",
  "requireProfile",
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

function removeFunctionBlock(text, name) {
  let searchFrom = 0;
  let out = text;

  while (true) {
    const pattern = new RegExp(`(?:async\\s+)?function\\s+${name}\\s*\\(`, "g");
    pattern.lastIndex = searchFrom;

    const match = pattern.exec(out);
    if (!match) break;

    const start = match.index;
    const openBrace = out.indexOf("{", pattern.lastIndex);
    if (openBrace === -1) break;

    let depth = 0;
    let end = -1;

    for (let i = openBrace; i < out.length; i++) {
      const ch = out[i];

      if (ch === "{") depth++;
      if (ch === "}") depth--;

      if (depth === 0) {
        end = i + 1;
        break;
      }
    }

    if (end === -1) break;

    while (end < out.length && /\s/.test(out[end])) {
      end++;
    }

    out = out.slice(0, start) + out.slice(end);
    searchFrom = start;
  }

  return out;
}

function ensureAuthImport(text, names) {
  const used = names.filter((name) => text.includes(`${name}(`));
  if (used.length === 0) return text;

  const authImportRegex = /import\s*\{([^}]+)\}\s*from\s*["']@\/lib\/auth["'];/m;
  const existing = text.match(authImportRegex);

  if (existing) {
    const current = existing[1]
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const merged = Array.from(new Set([...current, ...used])).sort();

    return text.replace(
      authImportRegex,
      `import { ${merged.join(", ")} } from "@/lib/auth";`
    );
  }

  const line = `import { ${used.sort().join(", ")} } from "@/lib/auth";\n`;

  if (text.startsWith('"use server";\n\n')) {
    return text.replace('"use server";\n\n', `"use server";\n\n${line}`);
  }

  return line + text;
}

function removeUnusedImports(text) {
  let out = text;

  out = out.replace(/^import\s*\{\s*redirect\s*\}\s*from\s*["']next\/navigation["'];\s*$/gm, (line) => {
    const withoutThisLine = out.replace(line, "");
    return withoutThisLine.includes("redirect(") ? line : "";
  });

  out = out.replace(/^import\s*\{\s*createClient\s*\}\s*from\s*["']@\/lib\/supabase\/server["'];\s*$/gm, (line) => {
    const withoutThisLine = out.replace(line, "");
    return withoutThisLine.includes("createClient(") ? line : "";
  });

  return out;
}

let changed = 0;

for (const rootDir of targetRoots) {
  for (const file of walk(path.join(root, rootDir))) {
    let text = fs.readFileSync(file, "utf8");
    const before = text;

    for (const name of helperNames) {
      text = removeFunctionBlock(text, name);
    }

    text = ensureAuthImport(text, helperNames);
    text = removeUnusedImports(text);

    text = text.replace(/\n{3,}/g, "\n\n");

    if (text !== before) {
      fs.writeFileSync(file, text, "utf8");
      console.log("Fixed duplicate helper:", path.relative(root, file));
      changed++;
    }
  }
}

console.log(`Done. Fixed ${changed} file(s).`);