param(
  [switch]$Strict
)

$ErrorActionPreference = "Stop"

$featureRoot = "features"
if (-not (Test-Path $featureRoot)) {
  Write-Error "Missing features/ directory."
}

$classification = @{
  account = "full-feature"
  admin = "route-shell"
  aip = "full-feature"
  audit = "view-only"
  chat = "full-feature"
  citizen = "route-shell"
  city = "view-only"
  dashboard = "route-shell"
  feedback = "full-feature"
  projects = "full-feature"
  shared = "route-shell"
  submissions = "full-feature"
}

$allowedRootFiles = @{
  account = @("index.ts", "README.md", "account-view.tsx", "update-password-form.tsx")
  aip = @("index.ts", "README.md", "utils.ts")
  citizen = @("index.ts", "README.md", "DASHBOARD_FIX_NOTES.md")
  projects = @("index.ts", "README.md", "GUIDE.md", "IMPLEMENTATION_STATUS.md")
}

function Has-AnyDir {
  param(
    [string]$Path,
    [string[]]$Names
  )
  foreach ($name in $Names) {
    if (Test-Path (Join-Path $Path $name)) {
      return $true
    }
  }
  return $false
}

$findings = @()
$featureDirs = Get-ChildItem $featureRoot -Directory

foreach ($dir in $featureDirs) {
  $name = $dir.Name
  $path = $dir.FullName
  $template = $classification[$name]

  if (-not $template) {
    $findings += "Unclassified feature: $name"
    continue
  }

  if (-not (Test-Path (Join-Path $path "index.ts"))) {
    $findings += "${name}: missing index.ts boundary"
  }
  if (-not (Test-Path (Join-Path $path "README.md"))) {
    $findings += "${name}: missing README.md"
  }

  $rootFiles = Get-ChildItem $path -File | Select-Object -ExpandProperty Name
  $approved = @("index.ts", "README.md")
  if ($allowedRootFiles.ContainsKey($name)) {
    $approved = $allowedRootFiles[$name]
  }
  foreach ($file in $rootFiles) {
    if ($approved -notcontains $file) {
      $findings += "${name}: uncategorized root-level file '$file'"
    }
  }

  if ($template -eq "full-feature") {
    $requiredAny = @("components", "views", "hooks", "types")
    if (-not (Has-AnyDir -Path $path -Names $requiredAny)) {
      $findings += "${name}: full-feature missing core folders (components/views/hooks/types)"
    }
  }

  if ($template -eq "view-only") {
    if (-not (Has-AnyDir -Path $path -Names @("views", "types"))) {
      $findings += "${name}: view-only missing views/types"
    }
  }

  if ($template -eq "route-shell") {
    $childDirs = Get-ChildItem $path -Directory
    if ($childDirs.Count -eq 0) {
      $findings += "${name}: route-shell has no child directories"
    }
  }
}

Write-Host "Feature structure check report"
Write-Host "=============================="
Write-Host ("Features checked: {0}" -f $featureDirs.Count)
Write-Host ("Findings: {0}" -f $findings.Count)

if ($findings.Count -gt 0) {
  $findings | ForEach-Object { Write-Host "- $_" }
}

if ($Strict -and $findings.Count -gt 0) {
  Write-Error "Feature structure checks failed in strict mode."
}
