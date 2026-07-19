const fs = require("fs");
const path = require("path");

const root = process.cwd();

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

for (const file of walk(path.join(root, "app")).concat(walk(path.join(root, "components")))) {
  let text = fs.readFileSync(file, "utf8");
  const before = text;

  text = text.replace(/鈫\?/g, "-&gt;");
  text = text.replace(/鈫/g, "-&gt;");
  text = text.replace(/鈥搟/g, "-{");
  text = text.replace(/鈥?/g, "-");
  text = text.replace(/Open\s*-&gt;\/p>/g, "Open -&gt;</p>");
  text = text.replace(/\{showingFrom\}-\{showingTo\}\s+of\s+\{totalRecords\}/g, "{showingFrom}-{showingTo} of {totalRecords}");
  text = text.replace(/\{showingFrom\}[^A-Za-z0-9{]*showingTo\}\s+of\s+\{totalRecords\}/g, "{showingFrom}-{showingTo} of {totalRecords}");

  if (text !== before) {
    fs.writeFileSync(file, text, "utf8");
    console.log("Fixed mojibake:", path.relative(root, file));
  }
}

function writePage(relativePath, target) {
  const full = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(full), { recursive: true });

  const code = `import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Page() {
  redirect("${target}");
}
`;

  fs.writeFileSync(full, code, "utf8");
  console.log("Replaced broken route:", relativePath, "->", target);
}

writePage(path.join("app", "admin", "courses", "[id]", "edit", "page.tsx"), "/admin/courses");
writePage(path.join("app", "admin", "courses", "[id]", "lessons", "page.tsx"), "/admin/courses");
writePage(path.join("app", "admin", "workshops", "[id]", "delete", "page.tsx"), "/admin/workshops");
writePage(path.join("app", "admin", "workshops", "[id]", "edit", "page.tsx"), "/admin/workshops");
writePage(path.join("app", "admin", "workshops", "subsessions", "[id]", "edit", "page.tsx"), "/admin/workshops");