param(
  [switch]$Strict
)

$ErrorActionPreference = "Stop"

$findings = @()

function Is-RouteGroup([string]$segment) {
  return $segment.StartsWith("(") -and $segment.EndsWith(")")
}

function Is-DynamicSegment([string]$segment) {
  return $segment.StartsWith("[") -and $segment.EndsWith("]")
}

function IsKebabCase([string]$name) {
  return $name -match "^[a-z0-9-]+$"
}

$appDirs = Get-ChildItem "app" -Directory -Recurse
foreach ($dir in $appDirs) {
  $segment = $dir.Name
  if (Is-RouteGroup $segment) { continue }
  if (Is-DynamicSegment $segment) { continue }
  if (-not (IsKebabCase $segment)) {
    $findings += "Route segment is not kebab-case: $($dir.FullName)"
  }
}

$submittalsMatches = rg --files app | rg "submittals" | ForEach-Object { $_.Trim() }
$allowedSubmittals = "app\(lgu)\city\(authenticated)\aips\submittals\page.tsx"
foreach ($path in $submittalsMatches) {
  if ($path -ne $allowedSubmittals) {
    $findings += "Unexpected deprecated `submittals` path: $path"
  }
}

$targetedKebabDirs = @(
  "features/submissions/views",
  "features/projects/shared/add-information",
  "features/dashboard/barangay/views",
  "features/aip/components"
)

foreach ($dir in $targetedKebabDirs) {
  if (-not (Test-Path $dir)) { continue }
  $files = Get-ChildItem $dir -File -Include *.ts,*.tsx
  foreach ($file in $files) {
    $base = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
    if (-not (IsKebabCase $base)) {
      $findings += "Targeted file is not kebab-case: $($file.FullName)"
    }
  }
}

Write-Host "Naming check report"
Write-Host "==================="
Write-Host ("Findings: {0}" -f $findings.Count)

if ($findings.Count -gt 0) {
  $findings | ForEach-Object { Write-Host "- $_" }
}

if ($Strict -and $findings.Count -gt 0) {
  Write-Error "Naming checks failed in strict mode."
}
