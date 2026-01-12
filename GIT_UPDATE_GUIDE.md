# Panduan Update Repository GitHub

## Workflow Update Repository

### 1. Cek Status Perubahan
```bash
git status
```

### 2. Lihat Perubahan Detail
```bash
# Lihat perubahan yang belum di-stage
git diff

# Lihat perubahan file tertentu
git diff src/app/page.tsx
```

### 3. Add File yang Berubah

**Semua file:**
```bash
git add .
```

**File spesifik:**
```bash
git add src/app/page.tsx
git add src/components/login-form.tsx
```

**Beberapa file sekaligus:**
```bash
git add src/app/*.tsx src/components/*.tsx
```

### 4. Commit dengan Pesan yang Jelas

**Format commit message:**
```bash
# Feature baru
git commit -m "feat: Add user profile settings page"

# Bug fix
git commit -m "fix: Resolve login redirect issue"

# Update styling
git commit -m "style: Update dashboard card design"

# Documentation
git commit -m "docs: Update README with deployment guide"

# Refactor
git commit -m "refactor: Optimize database queries"

# Performance
git commit -m "perf: Add pagination to project table"

# Security
git commit -m "security: Add rate limiting to API endpoints"
```

**Commit dengan deskripsi lengkap:**
```bash
git commit -m "feat: Add Excel export functionality

- Export current view or all data
- Format dengan percentage
- Include all 30+ columns
- Dynamic filename with timestamp"
```

### 5. Push ke GitHub
```bash
# Push ke branch master
git push origin master

# Push dengan set upstream (pertama kali)
git push -u origin master
```

## Contoh Workflow Lengkap

### Scenario 1: Update 1 Feature
```bash
# 1. Edit file (misal: update login form)
# ... edit code ...

# 2. Cek perubahan
git status
git diff src/components/login-form.tsx

# 3. Add dan commit
git add src/components/login-form.tsx
git commit -m "fix: Add inactive user warning message"

# 4. Push
git push origin master
```

### Scenario 2: Update Banyak File
```bash
# 1. Edit beberapa file
# ... edit code ...

# 2. Cek semua perubahan
git status

# 3. Add semua
git add .

# 4. Commit dengan deskripsi
git commit -m "feat: Implement owner dashboard

- Add FTTH dashboard page
- Add Quick Stats Cards
- Add Issue Resume Card
- Add Upcoming RFS Card
- Sync with controller dashboard design"

# 5. Push
git push origin master
```

### Scenario 3: Hot Fix
```bash
# 1. Fix bug
# ... edit code ...

# 2. Quick commit
git add src/app/owner/ftth/page.tsx
git commit -m "hotfix: Remove duplicate site header in owner dashboard"

# 3. Push immediately
git push origin master
```

### Scenario 4: Update Documentation
```bash
# 1. Update docs
# ... edit markdown files ...

# 2. Commit docs
git add *.md
git commit -m "docs: Update authentication guide and setup instructions"

# 3. Push
git push origin master
```

## Tips & Best Practices

### Commit Message Prefixes
- `feat:` - Feature baru
- `fix:` - Bug fixes
- `docs:` - Documentation
- `style:` - Format/styling (tidak mengubah logic)
- `refactor:` - Refactoring code
- `perf:` - Performance improvements
- `test:` - Menambah/update tests
- `chore:` - Maintenance (update dependencies, dll)
- `security:` - Security fixes
- `hotfix:` - Urgent fixes

### Git Commands Berguna

**Lihat commit history:**
```bash
git log --oneline
git log --graph --oneline --all
```

**Undo changes (belum commit):**
```bash
# Undo specific file
git checkout -- src/app/page.tsx

# Undo all changes
git checkout -- .
```

**Undo commit terakhir (keep changes):**
```bash
git reset --soft HEAD~1
```

**Lihat perubahan di commit tertentu:**
```bash
git show <commit-hash>
```

**Buat branch baru untuk development:**
```bash
# Buat dan pindah ke branch baru
git checkout -b feature/new-feature

# Push branch baru
git push -u origin feature/new-feature

# Kembali ke master
git checkout master

# Merge feature branch ke master
git merge feature/new-feature
```

## Workflow dengan Branch (Recommended)

### Development Flow
```bash
# 1. Buat branch untuk feature
git checkout -b feature/export-excel

# 2. Develop & commit
git add .
git commit -m "feat: Add excel export"

# 3. Push branch
git push -u origin feature/export-excel

# 4. Create Pull Request di GitHub
# ... review code ...

# 5. Merge via GitHub UI
# ... merge pull request ...

# 6. Update local master
git checkout master
git pull origin master

# 7. Delete feature branch (optional)
git branch -d feature/export-excel
git push origin --delete feature/export-excel
```

## Troubleshooting

### Push Rejected (behind remote)
```bash
# Pull dulu
git pull origin master

# Resolve conflicts jika ada
# ... edit conflicted files ...
git add .
git commit -m "merge: Resolve conflicts"

# Push lagi
git push origin master
```

### Force Push (HATI-HATI!)
```bash
# Only use jika yakin (rewrite history)
git push -f origin master
```

### Lihat Remote URL
```bash
git remote -v
```

### Ganti Remote URL
```bash
git remote set-url origin https://github.com/username/new-repo.git
```

## Quick Reference

| Action | Command |
|--------|---------|
| Cek status | `git status` |
| Lihat perubahan | `git diff` |
| Add semua file | `git add .` |
| Add file spesifik | `git add <file>` |
| Commit | `git commit -m "message"` |
| Push | `git push origin master` |
| Pull | `git pull origin master` |
| Lihat log | `git log --oneline` |
| Undo changes | `git checkout -- .` |
| Buat branch | `git checkout -b <branch>` |

---

**Tip**: Commit sering dengan pesan yang jelas! Lebih baik banyak commit kecil daripada 1 commit besar.
