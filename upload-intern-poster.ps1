param(
    [string]$PosterPath = "",
    [string]$PosterName = "cisma-lexdata-intern-poster"
)

$ErrorActionPreference = "Stop"

$root = (Get-Location).Path
$contentPath = Join-Path $root "content\internHiring.ts"
$componentPath = Join-Path $root "components\InternHiringSlider.tsx"
$packageJsonPath = Join-Path $root "package.json"

foreach ($path in @($contentPath, $componentPath, $packageJsonPath)) {
    if (-not (Test-Path -LiteralPath $path)) {
        throw "Cannot find required file: $path`nRun this script from the project root after installing the internship slider."
    }
}

if (-not $PosterPath) {
    Add-Type -AssemblyName System.Windows.Forms

    $dialog = New-Object System.Windows.Forms.OpenFileDialog
    $dialog.Title = "Choose the CISMA and LexData internship poster"
    $dialog.Filter = "Poster images (*.png;*.jpg;*.jpeg;*.webp)|*.png;*.jpg;*.jpeg;*.webp"
    $dialog.Multiselect = $false

    $result = $dialog.ShowDialog()

    if ($result -ne [System.Windows.Forms.DialogResult]::OK) {
        Write-Host "Poster selection cancelled." -ForegroundColor Yellow
        exit 0
    }

    $PosterPath = $dialog.FileName
}

$resolvedPoster = (Resolve-Path -LiteralPath $PosterPath).Path
$extension = [System.IO.Path]::GetExtension($resolvedPoster).ToLowerInvariant()

$allowedExtensions = @(
    ".png",
    ".jpg",
    ".jpeg",
    ".webp"
)

if ($extension -notin $allowedExtensions) {
    throw "Unsupported poster format: $extension. Use PNG, JPG, JPEG, or WebP."
}

$safeName = [regex]::Replace(
    $PosterName.ToLowerInvariant(),
    "[^a-z0-9_-]+",
    "-"
).Trim("-")

if (-not $safeName) {
    $safeName = "cisma-lexdata-intern-poster"
}

$posterDirectory = Join-Path $root "public\posters"
New-Item -ItemType Directory -Path $posterDirectory -Force | Out-Null

$destinationFileName = "$safeName$extension"
$destinationPath = Join-Path $posterDirectory $destinationFileName
$publicPosterPath = "/posters/$destinationFileName"

Copy-Item `
    -LiteralPath $resolvedPoster `
    -Destination $destinationPath `
    -Force

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupRoot = Join-Path $root "_backups\intern-poster-$timestamp"
$utf8 = New-Object System.Text.UTF8Encoding($false)

foreach ($source in @($contentPath, $componentPath)) {
    $relative = $source.Substring($root.Length).TrimStart("\", "/")
    $backup = Join-Path $backupRoot $relative

    New-Item -ItemType Directory `
        -Path (Split-Path -Parent $backup) `
        -Force |
        Out-Null

    Copy-Item `
        -LiteralPath $source `
        -Destination $backup `
        -Force
}

# ============================================================
# Update internship content
# ============================================================

$contentSource = [System.IO.File]::ReadAllText(
    $contentPath,
    [System.Text.Encoding]::UTF8
)

if ($contentSource -notmatch 'poster\?\s*:\s*string') {
    $contentSource = [regex]::Replace(
        $contentSource,
        '(export type InternHiringSlide\s*=\s*\{)',
        '$1' + "`r`n  poster?: string;",
        1
    )
}

if ($contentSource -match 'id:\s*"open-call"[\s\S]*?poster:\s*"[^"]*"') {
    $contentSource = [regex]::Replace(
        $contentSource,
        '(id:\s*"open-call"[\s\S]*?poster:\s*")[^"]*(")',
        '$1' + $publicPosterPath + '$2',
        1
    )
}
else {
    $contentSource = [regex]::Replace(
        $contentSource,
        '(id:\s*"open-call",)',
        '$1' + "`r`n    poster: `"$publicPosterPath`",",
        1
    )
}

[System.IO.File]::WriteAllText(
    $contentPath,
    $contentSource,
    $utf8
)

# ============================================================
# Replace PosterSheet with poster-aware version
# ============================================================

$componentSource = [System.IO.File]::ReadAllText(
    $componentPath,
    [System.Text.Encoding]::UTF8
)

$posterSheet = @'
function PosterSheet({
  slide,
  index,
}: {
  slide: InternHiringSlide;
  index: number;
}) {
  return (
    <article className="relative mx-auto flex min-h-[390px] w-[min(86%,560px)] flex-col overflow-hidden rounded-[24px] bg-[#fffdf8] text-[#090b1d] shadow-[0_28px_70px_rgba(0,0,0,0.28)] sm:min-h-[430px]">
      {slide.poster ? (
        <div className="relative flex min-h-[430px] flex-1 items-center justify-center bg-white">
          <img
            src={slide.poster}
            alt={`${slide.title} poster`}
            draggable={false}
            className="h-full max-h-[640px] w-full object-contain"
          />

          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3 rounded-2xl bg-black/75 px-4 py-3 text-white backdrop-blur">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-300">
                {slide.eyebrow}
              </p>
              <p className="mt-1 truncate text-sm font-black">
                {slide.title}
              </p>
            </div>

            <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-black text-black">
              {String(index + 1).padStart(2, "0")}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex min-h-[430px] flex-1 flex-col px-7 py-8 sm:px-10 sm:py-10">
          <div className="absolute right-6 top-5 text-xs font-black tracking-[0.2em] text-slate-400">
            {String(index + 1).padStart(2, "0")}
          </div>

          <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-700">
                {slide.eyebrow}
              </p>
              <p className="mt-1 text-xs font-bold text-slate-500">
                Internship opportunity
              </p>
            </div>

            <div className="rounded-full bg-[#081020] px-4 py-2 text-xs font-black text-white">
              OPEN CALL
            </div>
          </div>

          <h3 className="mt-7 max-w-[460px] font-serif text-4xl font-black leading-[0.98] tracking-[-0.035em] sm:text-5xl">
            {slide.title}
          </h3>

          <p className="mt-5 max-w-[500px] text-sm font-medium leading-6 text-slate-700 sm:text-base">
            {slide.summary}
          </p>

          <ul className="mt-6 grid gap-3">
            {slide.bullets.map((bullet) => (
              <li
                key={bullet}
                className="flex items-start gap-3 rounded-xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-800"
              >
                <span
                  aria-hidden="true"
                  className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600"
                />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>

          <div className="mt-auto border-t border-slate-200 pt-5">
            <p className="text-xs font-bold leading-5 text-slate-500">
              {slide.footer}
            </p>
          </div>
        </div>
      )}
    </article>
  );
}
'@

$pattern = '(?s)function PosterSheet\(\{.*?\n\}\r?\n\r?\nexport default function InternHiringSlider'

if ($componentSource -notmatch $pattern) {
    throw "Could not locate PosterSheet in components\InternHiringSlider.tsx."
}

$componentSource = [regex]::Replace(
    $componentSource,
    $pattern,
    $posterSheet + "`r`n`r`nexport default function InternHiringSlider",
    1
)

[System.IO.File]::WriteAllText(
    $componentPath,
    $componentSource,
    $utf8
)

Remove-Item `
    -LiteralPath (Join-Path $root ".next") `
    -Recurse `
    -Force `
    -ErrorAction SilentlyContinue

$package = Get-Content `
    -LiteralPath $packageJsonPath `
    -Raw |
    ConvertFrom-Json

Write-Host ""
Write-Host "Poster copied to:" -ForegroundColor Green
Write-Host "  $destinationPath"
Write-Host ""
Write-Host "Public URL:" -ForegroundColor Cyan
Write-Host "  $publicPosterPath"
Write-Host ""
Write-Host "Backup:" -ForegroundColor Cyan
Write-Host "  $backupRoot"
Write-Host ""
Write-Host "Running TypeScript validation..." -ForegroundColor Yellow

if ($package.scripts.PSObject.Properties.Name -contains "typecheck") {
    npm.cmd run typecheck
}
else {
    npx.cmd tsc --noEmit
}

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "TypeScript validation failed." -ForegroundColor Red
    Write-Host "Backup: $backupRoot" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "TypeScript validation passed." -ForegroundColor Green

if ($package.scripts.PSObject.Properties.Name -contains "build") {
    Write-Host ""
    Write-Host "Running production build..." -ForegroundColor Yellow

    npm.cmd run build

    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "Production build failed." -ForegroundColor Red
        Write-Host "Backup: $backupRoot" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""
Write-Host "INTERN POSTER INSTALLED" -ForegroundColor Green
Write-Host ""
Write-Host "Start the website:" -ForegroundColor Cyan
Write-Host "  npm.cmd run dev"
Write-Host ""
Write-Host "Open:" -ForegroundColor Cyan
Write-Host "  http://localhost:3000/#internships"
