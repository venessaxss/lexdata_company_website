const fs = require("fs");
const path = require("path");

const root = process.cwd();

const files = [
  ["app/dashboard/page.tsx", "/dashboard"],
  ["app/dashboard/my-learning/page.tsx", "/dashboard/my-learning"],
  ["app/dashboard/profile/page.tsx", "/dashboard/profile"],
  ["app/manager/page.tsx", "/manager"],
  ["app/manager/course-enrollments/page.tsx", "/manager/course-enrollments"],
  ["app/manager/member-profiles/page.tsx", "/manager/member-profiles"],
  ["app/manager/notices/page.tsx", "/manager/notices"],
  ["app/manager/team/page.tsx", "/manager/team"],
  ["app/manager/workshops/page.tsx", "/manager/workshops"],
  ["app/admin/events/page.tsx", "/admin/events"],
  ["app/admin/homepage-content/page.tsx", "/admin/homepage-content"],
  ["app/my/courses/page.tsx", "/my/courses"],
  ["app/my/payments/page.tsx", "/my/payments"],
  ["app/my/workshops/page.tsx", "/my/workshops"],
];

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

for (const [relativePath, nextPath] of files) {
  const fullPath = path.join(root, relativePath);

  if (!fs.existsSync(fullPath)) {
    console.log("Missing:", relativePath);
    continue;
  }

  let text = fs.readFileSync(fullPath, "utf8");
  const before = text;

  const encodedNext = encodeURIComponent(nextPath);
  const newRedirect = `redirect("/login?next=${encodedNext}")`;

  text = text.replace(/redirect\("\/login\?redirect=[^"]*"\)/g, newRedirect);
  text = text.replace(/redirect\('\/login\?redirect=[^']*'\)/g, newRedirect);
  text = text.replace(/redirect\("\/login"\)/g, newRedirect);
  text = text.replace(/redirect\('\/login'\)/g, newRedirect);

  if (text !== before) {
    fs.writeFileSync(fullPath, text, "utf8");
    console.log("Patched:", relativePath, "->", nextPath);
  } else {
    console.log("No change:", relativePath);
  }
}