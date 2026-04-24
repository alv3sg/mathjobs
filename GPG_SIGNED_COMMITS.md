# GPG Signed Commits Setup Guide

**Created:** April 24, 2026  
**Author:** DevSecOps Agent  
**Purpose:** Verify commit authenticity and prevent impersonation

---

## Why Sign Commits?

### Benefits:
- ✅ **Authenticity:** Verifies YOU made the commit
- ✅ **Integrity:** Ensures commit wasn't tampered with
- ✅ **Non-repudiation:** You can't deny making the commit
- ✅ **Trust:** Others can verify your commits are legitimate

### When Needed:
- Open source projects (often required)
- Team environments (verify contributor identity)
- Sensitive codebases (prove who changed what)
- Compliance requirements (audit trails)

---

## Step 1: Check for Existing GPG Keys

```bash
# List existing GPG keys
gpg --list-secret-keys --keyid-format LONG

# If you see output like:
# sec   rsa4096/ABC123DEF4567890 2026-04-24 [SC]
# uid   [ultimate] Gabriel <gabriel.alves.rosario@gmail.com>
# 
# You already have a key! Note the ID (ABC123DEF4567890)
```

---

## Step 2: Generate New GPG Key (If Needed)

```bash
# Generate a new GPG key
gpg --full-generate-key

# Follow prompts:
# 1. Select key type: RSA and RSA (default)
# 2. Key size: 4096 (recommended)
# 3. Expiration: 0 (no expiration) or set a date
# 4. Real name: Gabriel
# 5. Email: gabriel.alves.rosario@gmail.com
# 6. Comment: (optional) MathJobs Dev
# 7. Passphrase: Choose a STRONG passphrase!

# Example output:
# pub   rsa4096 2026-04-24 [SC]
#       ABC123DEF4567890ABC123DEF4567890
# uid   Gabriel <gabriel.alves.rosario@gmail.com>
# sub   rsa4096 2026-04-24 [E]
```

---

## Step 3: Get Your Key ID

```bash
# List keys to find your key ID
gpg --list-secret-keys --keyid-format LONG

# Look for line like:
# sec   rsa4096/ABC123DEF4567890 2026-04-24 [SC]
#                     ^^^^^^^^^^^^^^^^
#                     This is your KEY ID

# Copy the key ID (e.g., ABC123DEF4567890)
```

---

## Step 4: Configure Git to Use GPG

```bash
# Set your key ID (replace with YOUR key ID)
git config --global user.signingkey ABC123DEF4567890

# Enable auto-signing for all commits
git config --global commit.gpgsign true

# Tell git which GPG program to use
git config --global gpg.program gpg

# Verify configuration
git config --global --list | grep gpg
```

---

## Step 5: Export Public Key for GitHub

```bash
# Export your public key (replace with YOUR key ID)
gpg --armor --export ABC123DEF4567890

# Copy the ENTIRE output (including BEGIN/END lines):
# -----BEGIN PGP PUBLIC KEY BLOCK-----
# mQINBF...
# ... (many lines) ...
# -----END PGP PUBLIC KEY BLOCK-----

# 1. Go to GitHub.com → Settings → SSH and GPG keys
# 2. Click "New GPG key"
# 3. Paste the entire block
# 4. Click "Add GPG key"
```

---

## Step 6: Configure GPG_TTY (Important!)

```bash
# GPG needs to know your terminal for passphrase input
export GPG_TTY=$(tty)

# Make it permanent (add to ~/.bashrc)
echo "export GPG_TTY=$(tty)" >> ~/.bashrc

# For fish shell users:
echo "set -gx GPG_TTY (tty)" >> ~/.config/fish/config.fish
```

---

## Step 7: Test Signed Commit

```bash
# Navigate to project
cd /home/gabriel/Desktop/projetosPessoais/MathJobs

# Make a small change
echo "# Test signed commit" >> TEST_SIGNED_COMMIT.md

# Stage and commit (will prompt for GPG passphrase)
git add TEST_SIGNED_COMMIT.md
git commit -S -m "test: verify GPG signed commit"

# You'll be prompted for your GPG passphrase
# Enter it to sign the commit

# Verify the commit is signed
git log --show-signature -1

# Look for: "Good signature from Gabriel <gabriel.alves.rosario@gmail.com>"
```

---

## Step 8: Verify Signed Commits on GitHub

After pushing:
1. Go to your GitHub repository
2. Click on "Commits"
3. Look for the **"Verified"** badge next to your commit
4. Click the badge to see signature details

---

## Common Issues & Fixes

### Issue: "error: gpg failed to sign the data"
```bash
# Cause: GPG_TTY not set or wrong passphrase
# Fix 1: Set GPG_TTY
export GPG_TTY=$(tty)

# Fix 2: Test GPG separately
echo "test" | gpg --clearsign

# Fix 3: Check if gpg-agent is running
gpgconf --kill gpg-agent
gpgconf --launch gpg-agent
```

### Issue: "no secret key"
```bash
# Cause: Wrong key ID or key not found
# Fix: List keys again
gpg --list-secret-keys --keyid-format LONG

# Ensure git config matches
git config --global user.signingkey YOUR_CORRECT_KEY_ID
```

### Issue: Passphrase prompt not appearing
```bash
# Cause: PINEntry program not installed
# Fix (Ubuntu/Debian):
sudo apt-get install pinentry-gtk-2  # or pinentry-qt

# Or use curses-based:
sudo apt-get install pinentry-curses
```

---

## Using GPG with Askpass (Our Current Setup)

Since we have `~/.askpass` for sudo, you might want to handle GPG passphrase similarly:

```bash
# Option 1: Use GPG agent (recommended)
# GPG agent caches your passphrase for a period
# No need to re-enter for every commit

# Option 2: Preload passphrase (NOT RECOMMENDED - security risk!)
# Similar to askpass, but for GPG
# Create ~/.gnupg/gpg-agent.conf:
echo "pinentry-program /usr/bin/pinentry-curses" >> ~/.gnupg/gpg-agent.conf
echo "default-cache-ttl 3600" >> ~/.gnupg/gpg-agent.conf
```

---

## Disable Commit Signing (If Needed)

```bash
# Temporarily disable for one commit
git commit -m "message" --no-gpg-sign

# Permanently disable
git config --global --unset commit.gpgsign

# Re-enable
git config --global commit.gpgsign true
```

---

## Team Policy for MathJobs

### Current Status: **OPTIONAL**
- GPG signing is NOT required (yet)
- Branch protection is enabled (more important for now)

### Future: **MAY BECOME REQUIRED**
If we decide to enforce signed commits:
```bash
# GitHub: Settings → Branches → Branch protection rule
# ☑ Require signed commits
```

---

## Verification Commands

```bash
# Check if commit is signed
git log --show-signature

# Verify specific commit
git verify-commit COMMIT_HASH

# List all signed commits
git log --pretty=format:"%h %G? %an %s" | grep "^[^ ]* G"
# G = Good signature
# B = Bad signature
# U = Unknown signature
# N = No signature
```

---

## Resources

- [GitHub: Signing commits](https://docs.github.com/en/authentication/managing-commit-signature-verification/signing-commits)
- [GPG Documentation](https://gnupg.org/documentation/)
- [Git GPG Config](https://git-scm.com/docs/git-config#Documentation/git-config.txt-commit.gpgsign)

---

**Note:** For MathJobs project, GPG signing is **optional but recommended**. Focus on the pre-commit hooks and secret scanning first! 🛡️
