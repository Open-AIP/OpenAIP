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

$checks = @(
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

if ($Strict -and $total -gt 0) {
  Write-Error "Architecture checks failed in strict mode."
}
