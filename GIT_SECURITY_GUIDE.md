# Git Security Guide for MathJobs Team

**Created:** April 24, 2026  
**Author:** DevSecOps Agent  
**Purpose:** Prevent secret leaks and secure git workflow

---

## 🚨 CRITICAL RULES (Never Break These!)

### 1. NEVER Commit These Files
```bash
# Environment files (contain secrets!)
.env
.env.local
.env.development
.env.production
.env.*.local

# Credentials
*.pem
*.key
*.cert
id_rsa*
id_ed25519*

# API tokens
*.token
*_secret*
*_key*
```

### 2. ALWAYS Check Before Committing
```bash
# See what you're about to commit
git status

# Review changes (look for secrets!)
git diff --staged

# Check if any env files snuck in
git ls-files | grep -E '\.env|secret|key|token|\.pem'
```

---

## 🔒 Pre-Commit Hooks (AUTOMATIC SCANNING)

We've installed these security hooks that **automatically block** commits with secrets:

### Installed Scanners:
| Tool | What it Catches | Action |
|------|----------------|--------|
| **TruffleHog** | API keys, passwords, tokens | Blocks commit |
| **GitLeaks** | Hardcoded secrets | Blocks commit |
| **detect-secrets** | Credential patterns | Blocks commit |

### How It Works:
```bash
# When you try to commit:
git commit -m "my changes"

# Pre-commit hook automatically runs:
# 1. TruffleHog scans all staged files
# 2. GitLeaks checks for patterns
# 3. detect-secrets validates
# 4. If ANY secret found → COMMIT BLOCKED!

# Fix: Remove the secret, then commit again
```

### Bypass (EMERGENCY ONLY!):
```bash
# ONLY if you're sure it's a false positive:
git commit -m "message" --no-verify

# ⚠️ This skips ALL hooks - use with extreme caution!
```

---

## 📋 Environment Variables Best Practices

### DO:
```bash
# ✅ Use .env.local (already in .gitignore)
echo "DATABASE_URL=..." >> .env.local

# ✅ Use .env.example (safe to commit)
cat > .env.example << 'EOF'
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
AUTH_SECRET=your-32-char-secret-here
EOF

# ✅ Use Vercel/GitHub secrets for production
# Set in: Vercel Dashboard → Settings → Environment Variables
# Set in: GitHub → Settings → Secrets and variables → Actions
```

### DON'T:
```bash
# ❌ Never commit real secrets
git add .env.local  # BLOCKED by pre-commit hook!

# ❌ Never hardcode in source code
const apiKey = "sk_live_1234567890";  // ❌ DON'T!

# ❌ Never print secrets to logs
console.log("My secret:", process.env.API_KEY);  // ❌!
```

---

## 🔍 How to Check for Secrets

### Before Pushing (Manual Scan):
```bash
# Scan entire repo for secrets
trufflehog filesystem . --only-verified

# Scan specific files
gitleaks detect --source . --verbose

# Check staged files
detect-secrets scan --baseline .secrets.baseline
```

### GitHub Secret Scanning (AUTOMATIC):
- ✅ **Enabled** on our repo (github.com/alv3sg/mathjobs)
- If secret detected in push → **Email alert sent**
- If push protection enabled → **Push blocked**

---

## 🚨 IF YOU ACCIDENTALLY COMMIT A SECRET

### Immediate Actions (Within 5 Minutes!):
```bash
# 1. REVOKE the secret immediately
# - GitHub token: Settings → Developer settings → Personal access tokens → Delete
# - API key: Go to service dashboard → Revoke key
# - Database password: Change it!

# 2. Remove from git history (use BFG Repo-Cleaner)
java -jar bfg.jar --delete-files *.env
java -jar bfg.jar --replace-text secrets.txt

# 3. Force push (rewrites history!)
git push origin main --force

# 4. Notify team immediately
echo "SECURITY INCIDENT: Secret exposed and revoked. History rewritten."
```

### Prevention:
- Pre-commit hooks now **block** secrets automatically
- GitHub scanning **alerts** if something slips through
- Team must **rotate secrets** regularly (every 90 days)

---

## 🔐 SSH Keys vs Password (Recommendation)

### Current Setup (Askpass Helper):
```bash
# We created ~/.askpass with sudo password
# Location: ~/.askpass
# Permissions: 700 (only you can read/execute)

# ⚠️ Security concern: Password stored in plaintext!
# DevSecOps recommendation: Switch to SSH keys
```

### Better Approach (SSH Keys):
```bash
# 1. Generate SSH key
ssh-keygen -t ed25519 -C "gabriel.alves.rosario@gmail.com"

# 2. Add to GitHub
# Settings → SSH and GPG keys → New SSH key
# Paste content of ~/.ssh/id_ed25519.pub

# 3. Switch repo to SSH
cd /home/gabriel/Desktop/projetosPessoais/MathJobs
git remote set-url origin git@github.com:alv3sg/mathjobs.git

# 4. Remove askpass (no longer needed!)
rm ~/.askpass  # After verifying SSH works
```

---

## 📝 Signed Commits (GPG)

### Why Sign Commits?
- ✅ Verifies **you really made the commit**
- ✅ Prevents **impersonation**
- ✅ Required for some open-source projects

### Setup (See GPG_SIGNED_COMMITS.md for details):
```bash
# 1. Generate GPG key
gpg --full-generate-key
# Select: RSA and RSA, 4096 bits, no expiration

# 2. Add to GitHub
# Settings → SSH and GPG keys → New GPG key
# gpg --armor --export YOUR_KEY_ID

# 3. Configure git
git config --global user.signingkey YOUR_KEY_ID
git config --global commit.gpgsign true

# 4. Tell git which GPG program to use
git config --global gpg.program gpg

# 5. Set GPG_TTY so gpg knows the terminal
export GPG_TTY=$(tty)
echo "export GPG_TTY=$(tty)" >> ~/.bashrc
```

---

## 🛡️ Branch Protection (ENABLED!)

Our `main` branch has these protections:
- ✅ **No direct pushes** - Must use Pull Requests
- ✅ **Require PR reviews** - At least 1 reviewer
- ✅ **Status checks required** - CI pipeline must pass
- ✅ **No force push** - History cannot be rewritten

### How to Contribute:
```bash
# 1. Create feature branch
git checkout -b feature/awesome-feature

# 2. Make changes, commit
git add .
git commit -m "feat: add awesome feature"

# 3. Push branch
git push origin feature/awesome-feature

# 4. Create Pull Request on GitHub
# 5. Wait for review + CI checks
# 6. Merge to main (after approval)
```

---

## 📊 Security Checklist (Before Each Commit)

- [ ] No `.env*.local` files staged
- [ ] No API keys/tokens in code
- [ ] No passwords in plain text
- [ ] Pre-commit hooks passed
- [ ] Changes reviewed with `git diff --staged`
- [ ] Commit message is descriptive
- [ ] No large binary files (>500KB) committed

---

## 🆘 Emergency Contacts

If you discover a security breach:
1. **Immediately revoke** the exposed secret
2. **Run `git log`** to see what was exposed
3. **Use BFG** to clean history (see "Accidental Commit" section)
4. **Force push** to rewrite history
5. **Notify team** via Slack/email
6. **Document incident** in AGENTS.md

---

## 📚 Additional Resources

- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [TruffleHog Documentation](https://github.com/trufflesecurity/trufflehog)
- [GitLeaks Guide](https://github.com/gitleaks/gitleaks)
- [Pre-commit Hooks](https://pre-commit.com/)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)

---

**Remember:** Security is everyone's responsibility! When in doubt, ask the DevSecOps agent. 🛡️
