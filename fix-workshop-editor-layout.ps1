$ErrorActionPreference = "Stop"

$root = (Get-Location).Path
$pagePath = Join-Path $root "app\admin\workshops\[id]\page.tsx"

if (-not (Test-Path -LiteralPath $pagePath)) {
    throw "Cannot find app\admin\workshops\[id]\page.tsx. Run this script from the project root."
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupRoot = Join-Path $root "_backups\workshop-editor-layout-$timestamp"
$backupPath = Join-Path $backupRoot "app\admin\workshops\[id]\page.tsx"

New-Item -ItemType Directory -Path (Split-Path -Parent $backupPath) -Force | Out-Null
Copy-Item -LiteralPath $pagePath -Destination $backupPath -Force

$utf8 = New-Object System.Text.UTF8Encoding($false)
$content = [System.IO.File]::ReadAllText(
    $pagePath,
    [System.Text.Encoding]::UTF8
)

$replacements = [ordered]@{
    '    <main className="min-h-screen bg-slate-50 px-4 py-8">' =
    '    <main className="min-h-screen bg-[#f6f8fb] px-4 pb-16 pt-28 sm:px-6 lg:px-8">'

    '      <div className="mx-auto max-w-7xl space-y-6">' =
    '      <div className="mx-auto w-full max-w-[1440px] space-y-6">'

    '        <header className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm">' =
    '        <header className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">'

    '          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">' =
    '          <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-start">'

    '              <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">' =
    '              <h1 className="mt-3 max-w-4xl text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl">'

    '            <div className="flex flex-wrap gap-2">' =
    '            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">'

    '        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">' =
    '        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">'

    '        <div className="grid gap-6 xl:grid-cols-[330px_minmax(0,1fr)]">' =
    '        <div className="space-y-6">'

    '          <aside className="space-y-5 xl:sticky xl:top-5 xl:self-start">' =
    '          <aside className="grid gap-4 lg:grid-cols-2">'

    '            <section id="overview" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">' =
    '            <section id="overview" className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">'

    '            <section id="status" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">' =
    '            <section id="status" className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">'

    '          <section id="schedule" className="space-y-5">' =
    '          <section id="schedule" className="space-y-4">'

    '            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">' =
    '            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">'

    '              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">' =
    '              <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-start">'

    '                <details className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 sm:w-[390px]">' =
    '                <details className="w-full rounded-2xl border border-indigo-200 bg-indigo-50 p-4 xl:max-w-[460px]">'

    '                    <div className="grid grid-cols-3 gap-2">' =
    '                    <div className="grid gap-2 sm:grid-cols-3">'

    '                  <article key={session.id} className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">' =
    '                  <article key={session.id} className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">'

    '                    <div className="border-b border-slate-200 bg-slate-50 p-5">' =
    '                    <div className="border-b border-slate-200 bg-slate-50/80 p-4 sm:p-5">'

    '                            <h3 className="mt-3 text-2xl font-black text-slate-950">' =
    '                            <h3 className="mt-3 text-xl font-black leading-tight text-slate-950 sm:text-2xl">'

    '                    <div className="space-y-5 p-5">' =
    '                    <div className="space-y-4 p-4 sm:p-5">'

    '                          <details className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3">' =
    '                          <details className="w-full rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 sm:w-auto">'

    '                            <form action={createSubsessionAction} className="mt-4 grid min-w-[280px] gap-3 sm:min-w-[420px]">' =
    '                            <form action={createSubsessionAction} className="mt-4 grid w-full gap-3 sm:w-[520px]">'

    '                            <div key={subsession.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">' =
    '                            <div key={subsession.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">'
}

$missing = New-Object System.Collections.Generic.List[string]

foreach ($old in $replacements.Keys) {
    if (-not $content.Contains($old)) {
        $missing.Add($old)
    }
}

if ($missing.Count -gt 0) {
    Write-Host ""
    Write-Host "The workshop page does not match the expected installed version." -ForegroundColor Red
    Write-Host "No changes were written." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Missing patterns:" -ForegroundColor Yellow

    foreach ($item in $missing) {
        Write-Host "  $item"
    }

    exit 1
}

foreach ($old in $replacements.Keys) {
    $content = $content.Replace($old, $replacements[$old])
}

[System.IO.File]::WriteAllText(
    $pagePath,
    $content,
    $utf8
)

Remove-Item -LiteralPath (Join-Path $root ".next") `
    -Recurse `
    -Force `
    -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Workshop editor layout updated." -ForegroundColor Green
Write-Host "Backup:" -ForegroundColor Cyan
Write-Host "  $backupRoot"
Write-Host ""

$packageJson = Get-Content `
    -LiteralPath (Join-Path $root "package.json") `
    -Raw |
    ConvertFrom-Json

$scripts = $packageJson.scripts

Write-Host "Running TypeScript validation..." -ForegroundColor Yellow

if (
    $null -ne $scripts -and
    $scripts.PSObject.Properties.Name -contains "typecheck"
) {
    npm.cmd run typecheck
}
else {
    npx.cmd tsc --noEmit
}

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "TypeScript validation failed." -ForegroundColor Red
    Write-Host "Backup:" -ForegroundColor Yellow
    Write-Host "  $backupRoot"
    exit 1
}

Write-Host ""
Write-Host "TypeScript validation passed." -ForegroundColor Green

if (
    $null -ne $scripts -and
    $scripts.PSObject.Properties.Name -contains "build"
) {
    Write-Host ""
    Write-Host "Running production build..." -ForegroundColor Yellow

    npm.cmd run build

    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "Production build failed." -ForegroundColor Red
        Write-Host "Backup:" -ForegroundColor Yellow
        Write-Host "  $backupRoot"
        exit 1
    }
}

Write-Host ""
Write-Host "WORKSHOP EDITOR LAYOUT FIX COMPLETE" -ForegroundColor Green
Write-Host ""
Write-Host "The page now uses:" -ForegroundColor Cyan
Write-Host "  - safe spacing below the fixed navigation"
Write-Host "  - a centered full-width workspace"
Write-Host "  - overview and status panels above the schedule"
Write-Host "  - no empty sticky sidebar"
Write-Host "  - wider session and subsession editing areas"
Write-Host "  - responsive forms without fixed-width overflow"
Write-Host ""
Write-Host "Start the site with:" -ForegroundColor Yellow
Write-Host "  npm.cmd run dev"
