const fs = require("fs");
const path = require("path");

const root = process.cwd();

const files = [
  "app/manager/page.tsx",
  "app/manager/notices/page.tsx",
  "app/manager/team/page.tsx",
  "app/manager/workshops/page.tsx",
  "app/manager/notices/actions.ts",
  "app/manager/team/actions.ts",
  "app/manager/workshops/actions.ts",
];

function cleanFile(relativePath) {
  const fullPath = path.join(root, relativePath);

  if (!fs.existsSync(fullPath)) {
    console.log("Missing:", relativePath);
    return;
  }

  let text = fs.readFileSync(fullPath, "utf8");
  const before = text;

  // Remove blocks like:
  // if (!user) {
  //   redirect("/login?next=...");
  // }
  text = text.replace(
    /if\s*\(\s*!\s*user\s*\)\s*\{\s*redirect\(["']\/login\?next=[^"']*["']\);\s*\}/g,
    ""
  );

  // Remove one-line checks like:
  // if (!user) redirect("/login?next=...");
  text = text.replace(
    /if\s*\(\s*!\s*user\s*\)\s*redirect\(["']\/login\?next=[^"']*["']\);?/g,
    ""
  );

  // Remove blocks like:
  // if (!userData.user) redirect("/login?next=...");
  text = text.replace(
    /if\s*\(\s*!\s*userData\.user\s*\)\s*redirect\(["']\/login\?next=[^"']*["']\);?/g,
    ""
  );

  // Remove any remaining direct login redirect line.
  text = text.replace(
    /^\s*redirect\(["']\/login\?next=[^"']*["']\);\s*$/gm,
    ""
  );

  if (text !== before) {
    fs.writeFileSync(fullPath, text, "utf8");
    console.log("Cleaned:", relativePath);
  } else {
    console.log("No change:", relativePath);
  }
}

for (const file of files) {
  cleanFile(file);
}