# 🚀 GitHub Setup Guide for TrendIQ

Follow these steps to connect your TrendIQ project to GitHub.

## 📋 Prerequisites

1. **Git installed** on your computer
   - Download from: https://git-scm.com/downloads
   - Verify installation: Open PowerShell and run `git --version`

2. **GitHub account**
   - Create one at: https://github.com/signup

## 🔧 Step-by-Step Instructions

### Step 1: Initialize Git Repository

Open PowerShell in your project directory and run:

```powershell
cd "C:\Users\hp\OneDrive\Documents\Zoom\TrendIQ"
git init
```

### Step 2: Configure Git (First Time Only)

```powershell
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Step 3: Add All Files to Git

```powershell
git add .
```

### Step 4: Create Initial Commit

```powershell
git commit -m "Initial commit: TrendIQ AI Stock Prediction Platform"
```

### Step 5: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `TrendIQ`
3. Description: `AI-Powered Stock Market Prediction Platform using LSTM Neural Networks`
4. Choose **Public** or **Private**
5. **DO NOT** initialize with README (we already have one)
6. Click **Create repository**

### Step 6: Connect to GitHub

Copy the commands from GitHub (they will look like this):

```powershell
git remote add origin https://github.com/YOUR-USERNAME/TrendIQ.git
git branch -M main
git push -u origin main
```

**Replace `YOUR-USERNAME` with your actual GitHub username!**

### Step 7: Push Your Code

```powershell
git push -u origin main
```

You may be prompted to login to GitHub.

## 🎉 Done!

Your project is now on GitHub! Visit:
`https://github.com/YOUR-USERNAME/TrendIQ`

---

## 📝 Future Updates

When you make changes to your code:

```powershell
# Check what changed
git status

# Add all changes
git add .

# Commit with a message
git commit -m "Description of what you changed"

# Push to GitHub
git push
```

## 🌿 Common Git Commands

```powershell
# Check status
git status

# View commit history
git log --oneline

# Create a new branch
git checkout -b feature-name

# Switch branches
git checkout main

# Pull latest changes
git pull

# View remote URL
git remote -v
```

## 🔐 Authentication Options

### Option 1: Personal Access Token (Recommended)

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token
3. Select scopes: `repo` (full control)
4. Copy the token
5. Use it as your password when pushing

### Option 2: GitHub CLI

```powershell
# Install GitHub CLI
winget install --id GitHub.cli

# Authenticate
gh auth login
```

## 📂 Files Included in Repository

✅ Source code (Python, HTML, CSS, JS)
✅ README.md (project documentation)
✅ requirements.txt (dependencies)
✅ .gitignore (excludes unnecessary files)
❌ Virtual environments (excluded)
❌ Cache files (excluded)
❌ Large model files (optional - see note below)

## ⚠️ Note About Model Files

Model files (`.h5` and `.joblib`) can be large. If you encounter issues:

1. **Option A**: Don't commit models (users train their own)
   - Uncomment these lines in `.gitignore`:
     ```
     data/*.h5
     data/*.joblib
     ```

2. **Option B**: Use Git LFS for large files
   ```powershell
   git lfs install
   git lfs track "*.h5"
   git lfs track "*.joblib"
   ```

## 🆘 Troubleshooting

### "Permission denied" error
- Check your GitHub credentials
- Use Personal Access Token instead of password

### "Large file" warning
- Use Git LFS or exclude model files

### "Already exists" error
- The repository already has content
- Use `git pull origin main --allow-unrelated-histories` first

---

**Need help?** Check GitHub's documentation: https://docs.github.com/
