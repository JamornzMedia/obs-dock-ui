
$mainPath = "c:\Users\jamor\Documents\obs-dock-ui-main\v2.9.1\fcp_v2_assets\main.js"
$appendPath = "c:\Users\jamor\Documents\obs-dock-ui-main\v2.9.1\fcp_v2_assets\main_append.js"
$tempPath = "c:\Users\jamor\Documents\obs-dock-ui-main\v2.9.1\fcp_v2_assets\main_fixed.js"

# Read first 1861 lines of main.js (including the import line)
# Note: Get-Content returns array of lines. Index 0 to 1860 is 1861 lines.
$mainContent = Get-Content -Path $mainPath -TotalCount 1861

# Read append content
$appendContent = Get-Content -Path $appendPath

# Combine
$newContent = $mainContent + $appendContent

# Write to temp file with UTF8 encoding
$newContent | Set-Content -Path $tempPath -Encoding UTF8

# Replace original
Move-Item -Path $tempPath -Destination $mainPath -Force

# Remove append file
Remove-Item -Path $appendPath -Force

Write-Host "Fixed main.js and removed main_append.js"
