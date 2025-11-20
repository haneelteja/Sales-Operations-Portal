# Codebase Maintenance Guide
## Aamodha Operations Portal

**Last Updated:** January 2025  
**Maintenance Schedule:** Quarterly reviews recommended

---

## Overview

This document outlines the maintenance procedures and best practices for keeping the Aamodha Operations Portal codebase clean, organized, and maintainable.

---

## Directory Structure

### SQL Files Organization

```
sql/
├── migrations/          # Applied database migrations and setup scripts
├── fixes/              # One-time fixes (archive after application)
├── utilities/          # Reusable utility scripts (checks, clears)
└── performance/        # Performance optimization scripts
```

**Guidelines:**
- **Migrations:** Keep only the final, working version of each migration
- **Fixes:** Archive or remove after successful application
- **Utilities:** Keep reusable scripts for common operations
- **Performance:** Keep optimization scripts for reference

### Documentation Organization

```
docs/
├── performance/        # Performance analysis and optimization guides
├── deployment/         # Deployment guides and procedures
├── setup/             # Setup and configuration guides
├── database/          # Database migration and schema guides
└── *.md               # General documentation (cleanup reports, reviews)
```

---

## Quarterly Cleanup Checklist

### Code Quality Review

- [ ] **Unused Imports**
  - Run ESLint to identify unused imports
  - Remove unused components and utilities
  - Check for dead code paths

- [ ] **Unused Files**
  - Identify temporary scripts in root directory
  - Remove obsolete SQL files (after archiving if needed)
  - Clean up duplicate documentation

- [ ] **Dependencies**
  - Review `package.json` for unused dependencies
  - Update outdated packages
  - Remove unused dev dependencies

### File Organization

- [ ] **SQL Files**
  - Move new SQL files to appropriate `sql/` subdirectories
  - Archive or remove old fix scripts
  - Update documentation references

- [ ] **Documentation**
  - Consolidate duplicate documentation
  - Update outdated guides
  - Move new docs to appropriate `docs/` subdirectories

### Performance Review

- [ ] **Bundle Size**
  - Check bundle size trends
  - Identify large dependencies
  - Optimize imports and code splitting

- [ ] **Database Queries**
  - Review query performance
  - Check for N+1 query problems
  - Verify indexes are being used

- [ ] **React Components**
  - Identify large components (>500 lines)
  - Check for unnecessary re-renders
  - Review memoization usage

---

## Pre-Commit Guidelines

### What to Check Before Committing

1. **No Temporary Files**
   - No `temp_*.js`, `temp_*.sh`, `temp_*.sql` files
   - No `*_backup.*` or `*_old.*` files
   - No debug/test HTML files

2. **No Dangerous Scripts**
   - No `reset_*.sql` or `drop_*.sql` files
   - No scripts that delete data without confirmation

3. **File Organization**
   - SQL files in `sql/` directory
   - Documentation in `docs/` directory
   - Scripts in appropriate directories

4. **Code Quality**
   - No unused imports
   - No console.log statements (use logger)
   - No commented-out code blocks

---

## Preventing Code Bloat

### Best Practices

1. **SQL Files**
   - Use descriptive names: `FIX_<issue>_<date>.sql`
   - Add comments explaining the purpose
   - Archive old fixes after application
   - Keep only one version of each fix

2. **Documentation**
   - Single source of truth for each topic
   - Update existing docs instead of creating new ones
   - Remove temporary status files after resolution

3. **Scripts**
   - Use `scripts/` directory for utilities
   - Document script purpose in header comments
   - Remove one-time setup scripts after use

4. **Components**
   - Split large components (>500 lines)
   - Remove unused components
   - Keep component files focused and single-purpose

---

## File Naming Conventions

### SQL Files

- **Migrations:** `YYYYMMDDHHMMSS_description.sql`
- **Fixes:** `FIX_<table>_<issue>.sql`
- **Utilities:** `CHECK_<table>_<purpose>.sql` or `CLEAR_<table>.sql`
- **Performance:** `OPTIMIZE_<table>_<metric>.sql`

### Documentation

- **Guides:** `<TOPIC>_GUIDE.md` (e.g., `DEPLOYMENT_GUIDE.md`)
- **Setup:** `<SERVICE>_SETUP.md` (e.g., `REDIS_SETUP.md`)
- **Reports:** `<TYPE>_REPORT.md` (e.g., `CLEANUP_REPORT.md`)

### Scripts

- **Utilities:** `util_<purpose>.js` or `util_<purpose>.sh`
- **Setup:** `setup_<service>.sh`
- **Never:** `temp_*`, `fix_*`, `quick_*`, `bypass_*`

---

## Automated Checks

### ESLint Configuration

Already configured to catch:
- Unused imports
- Unused variables
- Dead code paths

### Git Hooks (Recommended)

Consider adding pre-commit hooks to:
- Check for temporary files
- Verify file organization
- Run linting
- Check for dangerous SQL scripts

---

## Recovery Procedures

### Recovering Deleted Files

All files are preserved in Git history:

```bash
# Find deleted file
git log --all --full-history -- <file-path>

# Recover file
git checkout <commit-hash> -- <file-path>

# Example
git log --all --full-history -- "bypass_auth_fix.js"
git checkout <commit-hash> -- bypass_auth_fix.js
```

### Archiving Old Files

Instead of deleting, consider archiving:

```bash
# Create archive directory
mkdir -p archive/$(date +%Y-%m)

# Move files
mv old_file.sql archive/$(date +%Y-%m)/

# Add to .gitignore
echo "archive/" >> .gitignore
```

---

## Maintenance Schedule

### Monthly (Quick Review)
- Check for temporary files in root
- Review recent commits for organization
- Quick dependency check

### Quarterly (Comprehensive Review)
- Full cleanup checklist
- Performance review
- Documentation consolidation
- Dependency updates

### Annually (Major Review)
- Architecture review
- Technology stack evaluation
- Major refactoring if needed

---

## Contact & Questions

For questions about maintenance procedures or to report issues:
- Review `CODEBASE_CLEANUP_REPORT.md` for cleanup history
- Check `COMPREHENSIVE_CODEBASE_REVIEW_SUMMARY.md` for code quality standards
- Refer to `PERFORMANCE_ARCHITECTURE_ANALYSIS.md` for performance guidelines

---

**Next Review Date:** April 2025  
**Last Cleanup:** January 2025 (55 files removed)

