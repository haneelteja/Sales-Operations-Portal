# ABS Portal – Repository Clone & Migration Guide

**Objective:** Clone the existing source repository into a new repository named **ABS Portal**, with full history, structure, and configs, ready for independent development and deployment.

**Source (example):** `https://github.com/haneelteja/Sales-Operations-Portal.git`  
**Target:** New repository **ABS Portal** (same Git host or different).

---

## 1. Prerequisites

- Git installed
- Access to the **source** repository (read/clone)
- Access to create a **new** repository (e.g. GitHub/GitLab/Bitbucket) with name **ABS Portal**
- No uncommitted changes in the source repo that must be carried over (commit or stash in source first)

---

## 2. Create the New Repository (ABS Portal)

**Do not** initialize the new repo with a README, .gitignore, or license so the first push can bring full history.

### GitHub

1. GitHub → **New repository**
2. **Repository name:** `ABS-Portal` (or `ABS-Portal` / `abs-portal` per your naming)
3. **Visibility:** Private or Public
4. **Do not** check “Add a README”, “Add .gitignore”, or “Choose a license”
5. Create repository
6. Note the new repo URL, e.g. `https://github.com/<org-or-user>/ABS-Portal.git`

### GitLab / Bitbucket

- Create a new project/repo named **ABS Portal** (or `ABS-Portal`).
- Leave it empty (no README/license/.gitignore) if the UI offers that option.

---

## 3. Clone with Full History (Two Options)

Use **one** of the following. Option A is a fresh clone; Option B reuses an existing local clone.

### Option A: Fresh clone (recommended for clean separation)

Run from a **new empty directory** (not inside the existing repo):

```bash
# Clone with full history (all branches, no checkout yet to avoid sparse checkout)
git clone --bare https://github.com/haneelteja/Sales-Operations-Portal.git abs-portal-bare
cd abs-portal-bare
```

Then go to **Section 4** and use the bare repo as the source for pushing to ABS Portal.

### Option B: Use existing local clone

If you already have a full clone of the source repo:

```bash
cd /path/to/Aamodha-Operations-Portal---V1
# Ensure you have all branches and history
git fetch origin
git branch -a
```

Then go to **Section 4** and add the new remote and push from this repo.

---

## 4. Point to ABS Portal and Push (Full History + All Branches)

### If you used Option A (bare clone)

```bash
cd abs-portal-bare

# Add the new ABS Portal repo as remote (replace with your actual ABS Portal URL)
git remote add abs-portal https://github.com/<org-or-user>/ABS-Portal.git

# Push all branches and tags (mirrors history)
git push --mirror abs-portal

# Optional: delete the bare clone when done
cd ..
rm -rf abs-portal-bare
```

Then **clone a normal (non-bare) copy** of ABS Portal for daily work:

```bash
git clone https://github.com/<org-or-user>/ABS-Portal.git ABS-Portal
cd ABS-Portal
```

Skip to **Section 5**.

### If you used Option B (existing clone)

```bash
cd /path/to/Aamodha-Operations-Portal---V1

# Add new remote (do not remove origin yet if you want to keep using the old repo)
git remote add abs-portal https://github.com/<org-or-user>/ABS-Portal.git

# Push all branches
git push abs-portal --all

# Push all tags
git push abs-portal --tags
```

To make ABS Portal the **only** remote for this clone (e.g. this machine will only work with ABS Portal):

```bash
git remote remove origin
git remote rename abs-portal origin
```

For a **separate** working copy that only tracks ABS Portal, clone again:

```bash
git clone https://github.com/<org-or-user>/ABS-Portal.git ABS-Portal
cd ABS-Portal
```

---

## 5. Default Branch and Branch List

- **Default branch:** GitHub (and most hosts) will set the default from the first push. If the source default is `main`, ensure `main` was pushed; then in **ABS Portal** repo **Settings → Default branch** set it to `main` (or `master` if that was the source default).
- **Branches:** The steps above push **all** branches. Optional check in the new clone:

```bash
cd ABS-Portal
git branch -a
git status
```

---

## 6. Post-Clone Validation Checklist

Run these in the **new** ABS Portal clone.

| # | Check | Command / Action | Expected |
|---|--------|-------------------|----------|
| 1 | Dependencies install | `npm install` | No errors |
| 2 | Build | `npm run build` | Build succeeds |
| 3 | Type check | `npx tsc --noEmit` | No errors |
| 4 | Lint | `npm run lint` | No critical failures |
| 5 | Env / config | Check `.env.example` and create `.env` from it | Env present; no references to old repo name in env |
| 6 | Run app | `npm run dev` | App runs; login/navigation work |
| 7 | README title | See Section 7 | README shows "ABS Portal" |

---

## 7. Update Repository Name References (Minimal)

**Only** change what is needed for the new product name and to avoid pointing at the old repo/deployments.

### 7.1 README title

In the **ABS Portal** clone, edit `README.md`:

- Replace the main title (e.g. "Aamodha Elma Sync Application") with **ABS Portal** (and optional short tagline).
- Leave the rest of the doc (features, tech stack, install, env) unchanged unless you have a separate “ABS Portal” product description.

### 7.2 Optional: package.json name

If you want the npm package name to reflect the new repo:

```json
"name": "abs-portal"
```

(No other code or config changes required for the clone.)

---

## 8. CI/CD and Deployment (Avoid Old Environments)

- **Vercel:** When connecting the **ABS Portal** repo, create a **new** Vercel project (e.g. “ABS Portal”). Do **not** connect the new repo to the existing Aamodha/Sales-Operations Vercel project so the old app is not overwritten.
- **GitHub Actions:** Workflows in `.github/workflows/` are cloned as-is; they run in the **ABS Portal** repo context. No repo name is hardcoded in the provided workflows; only update if you add scripts that reference the repo URL.
- **Secrets / env:** Set **new** environment variables (and Supabase, Vercel, etc.) for the ABS Portal project; do not reuse production secrets from the old project unless intentionally sharing the same backend.

---

## 9. Common Pitfalls and Rollback

| Pitfall | Prevention / Fix |
|--------|-------------------|
| New repo initialized with README/license | Create repo **empty**; then push with `--mirror` or `--all` + `--tags`. |
| Sparse checkout / partial clone | Use `git clone --bare` for the mirror push, or a full clone; avoid sparse checkout for the initial clone-to-ABS-Portal. |
| Only one branch pushed | Use `git push abs-portal --all` and `git push abs-portal --tags`. |
| Wrong default branch in ABS Portal | Set default branch in repo Settings (e.g. `main`) after push. |
| CI/CD still deploys old app | Connect ABS Portal repo to a **new** Vercel (and other) project; do not link to the old project. |
| Accidentally overwriting origin in source clone | Use a **new** remote name (e.g. `abs-portal`) and only remove/rename origin if this clone is dedicated to ABS Portal. |

**Rollback (if you haven’t shared the new repo yet):**

- Delete the **ABS Portal** repository on the host.
- Re-create an empty **ABS Portal** repo and repeat Section 4 (and 5–8 as needed).
- The **source** repository is unchanged by adding a remote and pushing; no rollback needed there.

---

## 10. Quick Reference – Copy-Paste (Linux/macOS)

Replace `YOUR_ORG_OR_USER` and `ABS-Portal` with your actual GitHub org/user and repo name.

```bash
# 1) Bare clone source
git clone --bare https://github.com/haneelteja/Sales-Operations-Portal.git abs-portal-bare
cd abs-portal-bare

# 2) Mirror to ABS Portal (create empty repo on GitHub first)
git remote add abs-portal https://github.com/YOUR_ORG_OR_USER/ABS-Portal.git
git push --mirror abs-portal

# 3) Normal clone for work
cd ..
rm -rf abs-portal-bare
git clone https://github.com/YOUR_ORG_OR_USER/ABS-Portal.git ABS-Portal
cd ABS-Portal

# 4) Validate
npm install && npm run build && npx tsc --noEmit
```

---

## 11. Summary

- **Clone:** Full history and all branches via `--bare` clone + `--mirror` push (or `--all` + `--tags` from existing clone).
- **Remote:** New repo **ABS Portal** is the only remote for the new clone (or named `abs-portal` then renamed to `origin`).
- **No code/functional changes** during clone; only optional README title and `package.json` name for “ABS Portal”.
- **Validation:** Install, build, typecheck, lint, run app, then update README and CI/CD/deployment so ABS Portal uses its own project and env.

This guide is suitable for developer execution, DevOps handover, audit, and scripting (Section 10 can be adapted into a script).

---

## 12. Windows / PowerShell

Same steps; run in PowerShell or Git Bash. Example with a **new** folder for the bare clone:

```powershell
# 1) Bare clone (run from a folder that does NOT contain the existing repo)
git clone --bare https://github.com/haneelteja/Sales-Operations-Portal.git abs-portal-bare
cd abs-portal-bare

# 2) Add ABS Portal remote and mirror (create empty ABS Portal repo on GitHub first)
git remote add abs-portal https://github.com/YOUR_ORG_OR_USER/ABS-Portal.git
git push --mirror abs-portal

# 3) Go back and create normal clone for daily work
cd ..
Remove-Item -Recurse -Force abs-portal-bare
git clone https://github.com/YOUR_ORG_OR_USER/ABS-Portal.git ABS-Portal
cd ABS-Portal

# 4) Validate
npm install; npm run build; npx tsc --noEmit
```

Replace `YOUR_ORG_OR_USER` and `ABS-Portal` with your actual GitHub account/org and repository name.
