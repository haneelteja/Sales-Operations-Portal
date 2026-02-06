# ABS Portal Clone – Next Steps

The bare clone and remote are already set up on this machine. Complete the migration as follows.

---

## Done already

- **Bare clone** created at:  
  `c:\Users\Haneel Teja\Cursor Applications\abs-portal-bare`  
  (full history from `Sales-Operations-Portal`)

- **Remote added:**  
  `abs-portal` → `https://github.com/haneelteja/Absolute_Portal.git`

- **Mirror push completed:** All branches and history are now in [Absolute_Portal](https://github.com/haneelteja/Absolute_Portal).

---

## What you need to do

### 1. ~~Create the new repository~~ ✓ Done (Absolute_Portal)

### 2. ~~Mirror push~~ ✓ Done

### 3. Optional: remove the bare clone

```powershell
cd "c:\Users\Haneel Teja\Cursor Applications"
Remove-Item -Recurse -Force abs-portal-bare
```

### 4. Clone a normal working copy for daily use

```powershell
cd "c:\Users\Haneel Teja\Cursor Applications"
git clone https://github.com/haneelteja/Absolute_Portal.git Absolute_Portal
cd Absolute_Portal
npm install
npm run build
```

### 5. Update README and validate

- In the **Absolute_Portal** folder, edit `README.md`: set the main title to **ABS Portal** (or **Absolute Portal**).
- Confirm app runs: `npm run dev`.
- When deploying: connect **Absolute_Portal** to a **new** Vercel project (do not reuse the old one).

---

For the full checklist and troubleshooting, see **ABS_PORTAL_REPO_CLONE_GUIDE.md**.
