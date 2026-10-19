
@echo off
setlocal
cd /d "%~dp0"

set "ZIPFILE=%~dp0..\Fintech.zip"

echo ========================================
echo       Fintech Project ZIP Backup
echo ========================================
echo.

where git >nul 2>&1
if errorlevel 1 (
    echo ERROR: Git is not installed or not in PATH.
    exit /b 1
)

git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
    echo ERROR: This folder is not a Git repository.
    exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
 "$ErrorActionPreference = 'Stop';" ^
 "$root = (Get-Location).Path;" ^
 "$output = [IO.Path]::GetFullPath((Join-Path $root '..\Fintech.zip'));" ^
 "$files = @(git -C $root -c core.quotepath=false ls-files --cached --others --exclude-standard);" ^
 "if ($LASTEXITCODE -ne 0) { throw 'Unable to list Git files.' };" ^
 "$files = @($files | Where-Object { $_ -and (Test-Path -LiteralPath (Join-Path $root $_) -PathType Leaf) });" ^
 "if ($files.Count -eq 0) { throw 'No project files found to archive.' };" ^
 "Add-Type -AssemblyName System.IO.Compression;" ^
 "Add-Type -AssemblyName System.IO.Compression.FileSystem;" ^
 "$temp = $output + '.tmp';" ^
 "try {" ^
 " if (Test-Path -LiteralPath $temp) { Remove-Item -LiteralPath $temp -Force };" ^
 " $stream = [IO.File]::Open($temp, [IO.FileMode]::CreateNew);" ^
 " try {" ^
 "  $archive = [IO.Compression.ZipArchive]::new($stream, [IO.Compression.ZipArchiveMode]::Create);" ^
 "  try {" ^
 "   foreach ($file in $files) {" ^
 "    $full = [IO.Path]::GetFullPath((Join-Path $root $file));" ^
 "    if (-not $full.StartsWith($root + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { continue };" ^
 "    $entry = $file.Replace('\','/');" ^
 "    [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $full, $entry, [IO.Compression.CompressionLevel]::Optimal) | Out-Null;" ^
 "   }" ^
 "  } finally { $archive.Dispose() }" ^
 " } finally { $stream.Dispose() };" ^
 " Move-Item -LiteralPath $temp -Destination $output -Force;" ^
 " Write-Host ('Files archived: ' + $files.Count);" ^
 " Write-Host ('ZIP created: ' + $output)" ^
 "} catch { if (Test-Path -LiteralPath $temp) { Remove-Item -LiteralPath $temp -Force }; throw }"

if errorlevel 1 (
    echo.
    echo ERROR: ZIP creation failed.
    exit /b 1
)

echo.
echo Backup completed successfully.
pause
