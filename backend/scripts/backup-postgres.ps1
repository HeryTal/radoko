param(
  [string]$OutputDirectory = $env:BACKUP_DIR
)

$ErrorActionPreference = 'Stop'
if (-not $env:DATABASE_URL) {
  throw 'Set DATABASE_URL before creating a backup.'
}

$match = [regex]::Match(
  $env:DATABASE_URL,
  '^(?:postgres|postgresql)://(?<user>[^:]+):(?<password>[^@]+)@(?<host>[^:/?]+)(?::(?<port>\d+))?/(?<database>[^?]+)(?:\?(?<query>.*))?$'
)
if (-not $match.Success) {
  throw 'DATABASE_URL must be a PostgreSQL URL with username, password, host and database.'
}

if (-not $OutputDirectory) {
  $OutputDirectory = Join-Path $PSScriptRoot '..\backups'
}
$OutputDirectory = [System.IO.Path]::GetFullPath($OutputDirectory)
New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null

$env:PGHOST = [System.Uri]::UnescapeDataString($match.Groups['host'].Value)
$env:PGPORT = if ($match.Groups['port'].Success) { $match.Groups['port'].Value } else { '5432' }
$env:PGUSER = [System.Uri]::UnescapeDataString($match.Groups['user'].Value)
$env:PGPASSWORD = [System.Uri]::UnescapeDataString($match.Groups['password'].Value)
$env:PGDATABASE = [System.Uri]::UnescapeDataString($match.Groups['database'].Value)
$sslMatch = [regex]::Match($match.Groups['query'].Value, '(?:^|&)sslmode=([^&]+)')
$env:PGSSLMODE = if ($sslMatch.Success) { [System.Uri]::UnescapeDataString($sslMatch.Groups[1].Value) } else { 'prefer' }

try {
  $pgDump = Get-Command pg_dump -ErrorAction Stop
  $fileName = 'radoko-{0}.dump' -f (Get-Date -Format 'yyyyMMdd-HHmmss')
  $backupPath = Join-Path $OutputDirectory $fileName
  & $pgDump.Source --format=custom --no-owner --file $backupPath
  if ($LASTEXITCODE -ne 0) {
    throw "pg_dump failed with exit code $LASTEXITCODE."
  }
  Write-Output "Backup created: $backupPath"
} finally {
  Remove-Item Env:PGHOST, Env:PGPORT, Env:PGUSER, Env:PGPASSWORD, Env:PGDATABASE, Env:PGSSLMODE -ErrorAction SilentlyContinue
}
