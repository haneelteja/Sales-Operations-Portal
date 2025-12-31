# PowerShell script to set up new GitHub repository for Aamodha-Operations-Portal---V2
# Run this script after creating the repository on GitHub

Write-Host "Setting up new repository: Aamodha-Operations-Portal---V2" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path ".git")) {
    Write-Host "Error: Not in a git repository!" -ForegroundColor Red
    exit 1
}

# Show current remote
Write-Host "Current remote:" -ForegroundColor Yellow
git remote -v
Write-Host ""

# Prompt for new repository URL
$newRepoUrl = Read-Host "Enter the new GitHub repository URL (e.g., https://github.com/haneelteja/Aamodha-Operations-Portal---V2.git)"

if ([string]::IsNullOrWhiteSpace($newRepoUrl)) {
    Write-Host "Error: Repository URL is required!" -ForegroundColor Red
    exit 1
}

# Remove old remote
Write-Host "Removing old remote..." -ForegroundColor Yellow
git remote remove origin

# Add new remote
Write-Host "Adding new remote..." -ForegroundColor Yellow
git remote add origin $newRepoUrl

# Verify remote
Write-Host "Verifying remote..." -ForegroundColor Yellow
git remote -v
Write-Host ""

# Push to new repository
Write-Host "Pushing to new repository..." -ForegroundColor Yellow
Write-Host "This will push all branches and commit history." -ForegroundColor Cyan
$confirm = Read-Host "Continue? (y/n)"

if ($confirm -eq "y" -or $confirm -eq "Y") {
    git push -u origin main
    Write-Host ""
    Write-Host "✅ Successfully set up new repository!" -ForegroundColor Green
    Write-Host "Repository URL: $newRepoUrl" -ForegroundColor Cyan
} else {
    Write-Host "Operation cancelled." -ForegroundColor Yellow
}


