$ErrorActionPreference = "Stop"

$root = Get-Location
$patchRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backup = Join-Path $root "_visual_restore_backup_ellipsus"
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

New-Item -ItemType Directory -Force $backup | Out-Null
New-Item -ItemType Directory -Force "app" | Out-Null
New-Item -ItemType Directory -Force "components\site" | Out-Null

function Backup-File($relativePath) {
  $src = Join-Path $root $relativePath
  if (Test-Path $src) {
    $dst = Join-Path $backup $relativePath
    New-Item -ItemType Directory -Force (Split-Path -Parent $dst) | Out-Null
    Copy-Item $src $dst -Force
  }
}

Backup-File "app\layout.tsx"
Backup-File "app\page.tsx"
Backup-File "app\globals.css"
Backup-File "components\IntegratedHomePage.tsx"
Backup-File "components\PaperRevealShell.tsx"
Backup-File "components\site\PaperMotion.tsx"
Backup-File "components\site\scribbles.tsx"

Copy-Item (Join-Path $patchRoot "app\page.tsx") "app\page.tsx" -Force
Copy-Item (Join-Path $patchRoot "app\paper-theme.css") "app\paper-theme.css" -Force
Copy-Item (Join-Path $patchRoot "components\site\PaperMotion.tsx") "components\site\PaperMotion.tsx" -Force
Copy-Item (Join-Path $patchRoot "components\site\scribbles.tsx") "components\site\scribbles.tsx" -Force

# Ensure paper theme is imported at the very top of globals.css.
$globalsPath = Join-Path $root "app\globals.css"
if (!(Test-Path $globalsPath)) {
  [System.IO.File]::WriteAllText($globalsPath, '@import "./paper-theme.css";' + "`r`n" + '@import "tailwindcss";' + "`r`n", $utf8NoBom)
} else {
  $globals = [System.IO.File]::ReadAllText($globalsPath)
  if ($globals -notmatch '@import\s+["'']\.\/paper-theme\.css["'']') {
    $globals = '@import "./paper-theme.css";' + "`r`n" + $globals
    [System.IO.File]::WriteAllText($globalsPath, $globals, $utf8NoBom)
  }
}

# Rebuild layout to restore the paper/ink effect and remove wrappers that caused huge blank regions.
$navImport = 'import LexPaperNavbar from "@/components/LexPaperNavbar";'
$navTag = '<LexPaperNavbar />'
if (!(Test-Path (Join-Path $root "components\LexPaperNavbar.tsx"))) {
  $navImport = 'import Navbar from "@/components/Navbar";'
  $navTag = '<Navbar />'
}

$authImport = ""
$authTag = ""
if (Test-Path (Join-Path $root "components\AuthSync.tsx")) {
  $authImport = 'import AuthSync from "@/components/AuthSync";' + "`r`n"
  $authTag = "        <AuthSync />`r`n"
}

$layout = @"
import type { Metadata } from "next";
$navImport
$authImport`import VisitTracker from "@/components/VisitTracker";
import AutoTranslator from "@/components/AutoTranslator";
import { PaperMotion } from "@/components/site/PaperMotion";
import { site } from "@/lib/site";
import { getServerI18n } from "@/lib/language-server";
import "./globals.css";

export const metadata: Metadata = {
  title: `${site.name} | Data-driven Research Training Platform`,
  description: site.tagline,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { language, direction } = await getServerI18n();

  return (
    <html lang={language} dir={direction}>
      <body className="lex-paper-site">
        <PaperMotion />
$authTag        <VisitTracker />
        <AutoTranslator language={language} />
        $navTag
        {children}
      </body>
    </html>
  );
}
"@

[System.IO.File]::WriteAllText((Join-Path $root "app\layout.tsx"), $layout, $utf8NoBom)

Write-Host "Applied Ellipsus-style visual restore. Backup saved to: $backup"
