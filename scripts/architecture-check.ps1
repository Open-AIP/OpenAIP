param(
  [switch]$Strict
)

$ErrorActionPreference = "Stop"

function Find-Matches {
  param(
    [string]$Pattern,
    [string[]]$Paths
  )
  $results = @()
  foreach ($p in $Paths) {
    if (Test-Path $p) {
      $m = rg -n --no-heading --color never $Pattern $p 2>$null
      if ($LASTEXITCODE -eq 0 -and $m) {
        $results += $m
      }
    }
  }
  return $results
}

$repoRoot = Get-Location

function Get-FeatureImportViolations {
  $violations = @()
  $files = Get-ChildItem -Path "features" -Recurse -File -Include *.ts,*.tsx
  foreach ($file in $files) {
    $relative = Resolve-Path -Relative $file.FullName
    $normalized = $relative -replace '^[.\\]+', '' -replace '\\', '/'
    $sourceFeature = ($normalized -split '/')[1]
    if (-not $sourceFeature) { continue }
    $lines = Get-Content $file.FullName
    for ($i = 0; $i -lt $lines.Count; $i++) {
      $line = $lines[$i]
      if ($line -match '@/features/([^/"'']+)') {
        $targetFeature = $Matches[1]
        if ($targetFeature -and $targetFeature -ne $sourceFeature -and $targetFeature -ne "shared") {
          $violations += "{0}:{1}: cross-feature import ({2} -> {3})" -f $normalized, ($i + 1), $sourceFeature, $targetFeature
        }
      }
    }
  }
  return $violations
}

$checks = @(
  @{
    Name = "lib imports features"
    Pattern = "from\s+`"@/features/"
    Paths = @("lib")
  },
  @{
    Name = "features import fixtures directly"
    Pattern = "from\s+`"@/mocks/fixtures/"
    Paths = @("features")
  },
  @{
    Name = "shared role string contracts"
    Pattern = "role:\s*string"
    Paths = @("types/index.d.ts", "features/account/account-view.tsx")
  },
  @{
    Name = "legacy LGU gate literals"
    Pattern = "userRole\s*(!==|===)\s*`"(city|barangay)`""
    Paths = @(
      "app/(lgu)",
      "app/admin",
      "lib/supabase/proxy.ts",
      "components/login-form.tsx"
    )
  },
  @{
    Name = "hardcoded scope IDs in auth/data access paths"
    Pattern = "\b(lgu_(city|barangay|municipality)_[a-zA-Z0-9_]+|city_001|municipality_001)\b"
    Paths = @(
      "app/(lgu)",
      "features/feedback",
      "lib/repos/feedback",
      "lib/domain/actor-context.ts"
    )
  },
  @{
    Name = "pipeline enum literal duplication outside contracts"
    Pattern = "type\s+Pipeline(Stage|Status)\w*\s*=\s*`""
    Paths = @("lib/types", "features")
  },
  @{
    Name = "path-derived auth scope inference"
    Pattern = "pathname\.startsWith\(`"/(barangay|city|municipality)`"\)"
    Paths = @(
      "features/shared/providers",
      "lib/repos",
      "lib/domain"
    )
  }
)

$total = 0
$report = @()

foreach ($check in $checks) {
  $hits = Find-Matches -Pattern $check.Pattern -Paths $check.Paths
  $count = $hits.Count
  $total += $count
  $report += [pscustomobject]@{
    Name = $check.Name
    Count = $count
    Hits = $hits
  }
}

$crossFeatureViolations = Get-FeatureImportViolations
$report += [pscustomobject]@{
  Name = "cross-feature imports"
  Count = $crossFeatureViolations.Count
  Hits = $crossFeatureViolations
}
$total += $crossFeatureViolations.Count

$mapperPurityHits = Find-Matches -Pattern "from\s+`"react`"|use(State|Effect|Memo|Callback|Reducer)\s*\(" -Paths @("lib/mappers")
$report += [pscustomobject]@{
  Name = "mapper purity violations"
  Count = $mapperPurityHits.Count
  Hits = $mapperPurityHits
}
$total += $mapperPurityHits.Count

Write-Host "Architecture check report"
Write-Host "========================="
foreach ($r in $report) {
  Write-Host ("- {0}: {1}" -f $r.Name, $r.Count)
}
Write-Host ("Total findings: {0}" -f $total)

foreach ($r in $report) {
  if ($r.Count -gt 0) {
    Write-Host ""
    Write-Host ("[{0}]" -f $r.Name)
    $r.Hits | Select-Object -First 40 | ForEach-Object { Write-Host $_ }
  }
}

$municipalityRoutePath = "app/(lgu)/municipality"
$municipalityRouteCount = 0
if (Test-Path $municipalityRoutePath) {
  $municipalityRouteCount = 1
}
Write-Host ("- deferred municipality route rollout: {0}" -f $municipalityRouteCount)
$total += $municipalityRouteCount

if ($municipalityRouteCount -gt 0) {
  Write-Host ""
  Write-Host "[deferred municipality route rollout]"
  Write-Host ("Found deferred path: {0}" -f $municipalityRoutePath)
}

if ($Strict -and $total -gt 0) {
  Write-Error "Architecture checks failed in strict mode."
}
