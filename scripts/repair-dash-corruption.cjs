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
        item === "_backups" ||
        item === "_dash_repair_backup"
      ) {
        continue;
      }

      walk(full, out);
    } else if (/\.(tsx|ts)$/.test(full)) {
      out.push(full);
    }
  }

  return out;
}

function looksDashCorrupted(text) {
  const sample = text.slice(0, 1200);

  if (
    sample.includes("-i-m-p-o-r-t-") ||
    sample.includes("-e-x-p-o-r-t-") ||
    sample.includes("-f-r-o-m-") ||
    sample.includes("-r-e-d-i-r-e-c-t-") ||
    sample.includes("-c-r-e-a-t-e-C-l-i-e-n-t-")
  ) {
    return true;
  }

  const hyphens = (sample.match(/-/g) || []).length;
  const letters = (sample.match(/[A-Za-z]/g) || []).length;

  return hyphens > letters * 0.65 && sample.includes("-;-");
}

function decodeDashedLine(line) {
  if (!line.includes("-")) return line;

  const tokens = line.split("-");
  const out = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token !== "") {
      out.push(token);
      continue;
    }

    const isEdge = i === 0 || i === tokens.length - 1;
    if (isEdge) continue;

    let runEnd = i;
    while (runEnd < tokens.length && tokens[runEnd] === "") {
      runEnd++;
    }

    const runLength = runEnd - i;

    if (runLength >= 2) {
      out.push("-".repeat(Math.floor(runLength / 2)));
    }

    i = runEnd - 1;
  }

  return out.join("");
}

function decodeDashedText(text) {
  return text
    .split(/\r?\n/)
    .map((line) => decodeDashedLine(line))
    .join("\n");
}

let repaired = 0;

for (const base of roots) {
  const files = walk(path.join(root, base));

  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");

    if (!looksDashCorrupted(text)) continue;

    const decoded = decodeDashedText(text);

    if (decoded !== text) {
      fs.writeFileSync(file, decoded, "utf8");
      repaired++;
      console.log("Decoded:", path.relative(root, file));
    }
  }
}

console.log(`Done. Repaired ${repaired} file(s).`);