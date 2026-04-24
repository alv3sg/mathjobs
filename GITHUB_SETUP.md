# GitHub Setup Instructions

Since `gh` CLI is not available, follow these manual steps to complete the GitHub setup:

## Step 1: Create GitHub Repository

1. Go to [GitHub](https://github.com) and log in
2. Click the "+" icon in the top right → "New repository"
3. Repository name: `mathjobs`
4. Description: `Restaurant staffing platform - connect restaurants with waiters for short-term jobs`
5. Choose: **Public** or **Private** (your choice)
6. **DO NOT** initialize with README, .gitignore, or license (we already have these)
7. Click "Create repository"

## Step 2: Connect Local Repo to GitHub

After creating the repo, GitHub will show you commands. Run these in your terminal:

```bash
cd /home/gabriel/Desktop/projetosPessoais/MathJobs

# Add the remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/mathjobs.git

# Verify the remote
git remote -v

# Push to GitHub
git push -u origin main
```

## Step 3: Configure Repository Secrets

After pushing, go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these secrets (you'll fill them later as you set up services):

| Secret Name | Description | When to add |
|-------------|-------------|----------------|
| `DATABASE_URL` | PostgreSQL connection string (Neon) | Before deployment |
| `AUTH_SECRET` | 32+ character random string | Before deployment |
| `UPLOADTHING_SECRET` | UploadThing secret | Before file uploads |
| `UPLOADTHING_APP_ID` | UploadThing app ID | Before file uploads |
| `RESEND_API_KEY` | Resend API key | Before email features |
| `SNYK_TOKEN` | Snyk API token (optional) | For security scans |

### Generate AUTH_SECRET:
Run this command in terminal:
```bash
openssl rand -base64 32
```

## Step 4: Enable GitHub Actions

1. Go to your repository → **Actions** tab
2. You should see the "CI Pipeline" workflow
3. It will run automatically on push/PR

## Step 5: Set Up Branch Protection (Recommended)

1. Go to **Settings** → **Branches** → **Add branch protection rule**
2. Branch name pattern: `main`
3. Enable:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass (select CI checks)
   - ✅ Require branches to be up to date before merging

## Step 6: Verify Everything Works

```bash
# Check git status
git status

# Check remote
git remote -v

# Pull latest (if needed)
git pull origin main

# Push any new changes
git push origin main
```

## Next Steps After GitHub Setup

1. ✅ GitHub repo created and code pushed
2. ⏳ Set up Neon PostgreSQL database
3. ⏳ Configure Vercel deployment
4. ⏳ Add environment variables to Vercel
5. ⏳ Run first deployment

---

**Current Status:**
- ✅ Git initialized
- ✅ Initial commit created (3ecb953)
- ✅ .gitignore configured
- ✅ CI/CD workflow created (.github/workflows/ci.yml)
- ✅ Implementation plan v2.0 saved
- ⏳ Waiting for GitHub repo creation
- ⏳ Waiting for first push

**Files ready to push:**
- `IMPLEMENTATION_PLAN.md` (updated with all agent feedback)
- `.gitignore` (includes security exclusions)
- `.github/workflows/ci.yml` (CI/CD pipeline)
