# 🧪 Manual Testing Instructions - Boss

## ⚠️ CRITICAL: Clear Browser Cache First!

Boss, kemungkinan besar masalahnya adalah **browser cache**. Next.js kadang tidak auto-reload semua changes.

---

## 🔄 Step 1: Complete Cache Clear

### **Option A: Hard Reload (Recommended)**
1. **Chrome**: 
   - Open DevTools (Cmd+Option+I)
   - Right-click on Reload button
   - Select **"Empty Cache and Hard Reload"**

2. **Alternative**: 
   ```
   Cmd + Shift + R (Force refresh)
   ```

### **Option B: Clear All Site Data**
1. Open Chrome DevTools (Cmd+Option+I)
2. Go to **Application** tab
3. Click **"Clear site data"** button
4. Refresh page (Cmd+R)

### **Option C: Incognito Window**
```
Cmd + Shift + N
```
Then navigate to: `http://localhost:3000`

---

## 🔍 Step 2: Chrome DevTools Inspection

### **A. Check Console**
```javascript
// DevTools → Console tab
// Should see NO red errors
// If there are errors, screenshot and send to me
```

### **B. Check Elements**
Open **Elements** tab and search for these:

1. **Theme Toggle (Header)**
   - Search for: `ThemeToggle` or `theme-toggle`
   - Should see dropdown button in top-right
   - HTML should look like:
   ```html
   <button ... class="...theme-toggle...">
     <svg><!-- Sun or Moon icon --></svg>
   </button>
   ```

2. **Sidebar Logo**
   - Search for: `PerMoney`
   - Should have class: `group-data-[collapsible=icon]:hidden`
   - When sidebar collapsed, this span should have `display: none`

3. **StatCard Components**
   - Search for: `StatCard` or `stat-card`
   - Should see 4 cards on dashboard
   - Each should have different color variants

4. **Sankey Chart**
   - Search for: `SankeyFlowChart` or `sankey`
   - Should be in Overview tab
   - Check if div exists (even if empty)

### **C. Check Network Tab**
```
DevTools → Network → Filter: JS
```
- Refresh page
- Look for: `page.tsx` or chunk files
- Make sure they're loading (Status: 200)
- Check if timestamps are recent

### **D. Check Computed Styles**
Right-click on elements and check computed styles:
- Theme toggle button should have proper positioning
- Sidebar text should have `display: none` when collapsed
- Cards should have elevation shadows on hover

---

## 🎯 Step 3: Feature Testing

### **Test 1: Theme Toggle**
```
1. Look at top-right corner of header
2. Should see Sun or Moon icon
3. Click it → dropdown should appear
4. Select "Dark" → app turns dark
5. Go to Settings → Appearance
6. Should show "Dark" selected
```

**If Not Working:**
- Check Console for errors
- Check Elements tab for ThemeToggle component
- Try Incognito mode

### **Test 2: Sidebar Logo**
```
1. Click hamburger menu (☰)
2. Sidebar collapses
3. Text "PerMoney" should disappear
4. Green $ icon should stay
```

**If Not Working:**
- Inspect span element with text "PerMoney"
- Check if it has class: `group-data-[collapsible=icon]:hidden`
- Check computed style when collapsed

### **Test 3: Dashboard Cards**
```
1. Go to /dashboard
2. Should see 4 cards at top
3. Cards should have colors:
   - Total Balance: Green
   - Monthly Income: Default (blue)
   - Monthly Expenses: Red
   - Net Worth: Blue/Info
4. Hover → should see shadow effect
```

**If Not Working:**
- Check Console for import errors
- Search Elements for "StatCard"
- Check if old Card components still there

### **Test 4: Sankey Chart**
```
1. Dashboard → Overview tab
2. Should see Sankey chart section
3. If no data: shows "No data available"
4. If have data: shows flow diagram
```

**If Not Working:**
- Console errors?
- Search Elements for "sankey"
- Check Network tab for component load

---

## 🐛 Step 4: Common Issues & Fixes

### **Issue: Nothing Changed**
**Cause**: Browser cache
**Fix**:
```bash
# Terminal
cd /Users/p/Project/v0-permoney
rm -rf .next
npm run dev

# Browser
Hard reload (Cmd+Shift+R)
Or use Incognito (Cmd+Shift+N)
```

### **Issue: Console Errors**
**Cause**: Import errors or runtime errors
**Fix**: Screenshot console and send to me

### **Issue: Components Not Found**
**Cause**: File not imported properly
**Fix**: Check if these files exist:
```bash
ls -la src/components/ui/enhanced/
ls -la src/components/charts/
ls -la src/app/(app)/layout.tsx
ls -la src/components/app-sidebar.tsx
```

### **Issue: Old UI Still Showing**
**Cause**: Hot reload failed
**Fix**:
1. Stop server (Ctrl+C)
2. Delete cache: `rm -rf .next`
3. Restart: `npm run dev`
4. Hard reload browser

---

## 📸 Step 5: Screenshot Requests

Boss, tolong screenshot ini dan kirim ke saya:

### **Screenshot 1: Full Dashboard**
- Show full dashboard page
- Include header with theme toggle
- Show all 4 cards

### **Screenshot 2: Chrome DevTools Console**
- Show any errors (red text)
- Or "No errors" if clean

### **Screenshot 3: Elements Tab**
- Search for "ThemeToggle"
- Show HTML structure

### **Screenshot 4: Sidebar (Both States)**
- Screenshot 1: Expanded
- Screenshot 2: Collapsed

### **Screenshot 5: Network Tab**
- Show loaded JS chunks
- Highlight recent timestamps

---

## 🔬 Step 6: DevTools Commands

Paste these in Console tab to check:

```javascript
// Check if ThemeToggle component exists
document.querySelector('[data-theme-toggle]') || 
document.querySelector('.theme-toggle') ||
console.log('ThemeToggle not found')

// Check if StatCard exists
document.querySelectorAll('[class*="stat-card"]').length + ' StatCards found'

// Check if Sankey exists
document.querySelector('[class*="sankey"]') ? 
  'Sankey found' : 
  'Sankey not found'

// Check sidebar state
document.querySelector('[data-state]')?.getAttribute('data-state')

// Check current theme
document.documentElement.getAttribute('class') || 
localStorage.getItem('theme')
```

---

## 🎯 Expected Results

### **✅ Should See:**
1. Theme toggle button in header (top-right)
2. Sidebar logo hides when collapsed
3. 4 colorful cards on dashboard
4. Sankey chart in Overview tab (or "No data")
5. Consistent spacing (not too tight, not too loose)
6. Hover effects on cards
7. Zero console errors

### **❌ Should NOT See:**
1. Console errors (red text)
2. Sidebar logo overlapping
3. Plain white/gray cards (should have colors)
4. Missing theme toggle
5. Layout breaking
6. Horizontal scrollbar

---

## 🆘 If Still Not Working

Send me these:

1. **Console screenshot** (all errors)
2. **Elements screenshot** (search "ThemeToggle")
3. **Network screenshot** (JS files)
4. **Full page screenshot**
5. **Terminal output** (npm run dev)

Then run:
```bash
cd /Users/p/Project/v0-permoney

# Check file modifications
git status

# Check if files exist
ls -la src/app/\(app\)/layout.tsx
ls -la src/components/app-sidebar.tsx
ls -la src/app/\(app\)/dashboard/page.tsx
ls -la src/components/ui/enhanced/stat-card.tsx
ls -la src/components/charts/sankey-flow-chart.tsx

# Check file contents
head -30 src/app/\(app\)/layout.tsx
```

Send output ke saya!

---

**Boss, please follow steps above dan kasih tahu hasilnya! 🚀**
