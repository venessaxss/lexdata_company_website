$ErrorActionPreference = "Stop"

$root = (Get-Location).Path
$tsconfigPath = Join-Path $root "tsconfig.json"

if (-not (Test-Path -LiteralPath $tsconfigPath)) {
    throw "Run this from the LexData project root. tsconfig.json was not found."
}

$utf8 = New-Object System.Text.UTF8Encoding($false)
$tempScript = Join-Path $env:TEMP "lexdata-fix-patch-exclude.cjs"

$nodeScript = @'
const fs = require("fs");
const path = require("path");
const ts = require(require.resolve("typescript", { paths: [process.cwd()] }));

const file = path.join(process.cwd(), "tsconfig.json");
const source = fs.readFileSync(file, "utf8");
const parsed = ts.parseConfigFileTextToJson(file, source);

if (parsed.error) {
  throw new Error(
    ts.flattenDiagnosticMessageText(parsed.error.messageText, "\n")
  );
}

const config = parsed.config || {};
const current = Array.isArray(config.exclude) ? config.exclude : [];

config.exclude = Array.from(new Set([
  ...current,
  "separate-participant-documents-patch",
  "separate-participant-documents-patch/**"
]));

fs.writeFileSync(
  file,
  JSON.stringify(config, null, 2) + "\n",
  "utf8"
);
'@

[System.IO.File]::WriteAllText($tempScript, $nodeScript, $utf8)

try {
    node $tempScript
    if ($LASTEXITCODE -ne 0) {
        throw "Could not update tsconfig.json."
    }
}
finally {
    Remove-Item -LiteralPath $tempScript -Force -ErrorAction SilentlyContinue
}

Remove-Item -LiteralPath (Join-Path $root ".next") -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "[OK] Excluded separate-participant-documents-patch from TypeScript." -ForegroundColor Green
Write-Host ""
Write-Host "Now run:" -ForegroundColor Yellow
Write-Host "  npm.cmd run typecheck"
