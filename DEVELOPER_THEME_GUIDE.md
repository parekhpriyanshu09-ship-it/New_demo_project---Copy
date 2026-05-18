# Patrak Theme - Developer Quick Reference

## 🎨 Brand Colors Quick Reference

### Hex Values
```
Primary Dark:    #0d3d56  (use for: main brand, headers, dark backgrounds)
Primary Accent:  #006896  (use for: highlights, borders, hover states)
Light Tint:      #e8f0f7  (use for: subtle backgrounds, borders)
```

### Tailwind CSS Classes

#### Text Colors
```
text-brand-dark          → #0d3d56
text-brand-accent        → #006896
text-brand-dark/60       → 60% opacity dark
text-brand-dark/40       → 40% opacity dark
```

#### Background Colors
```
bg-brand-dark            → #0d3d56
bg-brand-accent          → #006896
bg-brand-light           → #e8f0f7
bg-brand-lighter         → #f0f5f9
```

#### Border Colors
```
border-brand-dark        → #0d3d56
border-brand-accent      → #006896
border-brand-accent/30   → 30% opacity accent
```

### Gradient Classes
```
from-brand-dark to-brand-accent     → Main gradient
from-brand-light to-brand-lighter   → Subtle gradient
```

---

## 📋 Component Usage Examples

### New Button (with brand gradient)
```jsx
<button className="bg-gradient-to-r from-brand-dark to-brand-accent text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all">
  Click me
</button>
```

### New Card with Brand Styling
```jsx
<div className="bg-white dark:bg-brand-dark border border-brand-accent/30 rounded-xl p-4 hover:border-brand-accent/60 transition-colors">
  <h3 className="text-brand-dark dark:text-white">Title</h3>
</div>
```

### New Input with Brand Focus
```jsx
<input 
  className="border border-brand-accent/30 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 rounded-lg px-3 py-2"
  placeholder="Type something..."
/>
```

### New Navigation Item
```jsx
<a 
  href="#" 
  className="text-brand-dark hover:text-brand-accent dark:text-white dark:hover:text-brand-accent transition-colors"
>
  Nav Item
</a>
```

---

## 🎯 When to Use Which Color

### Use `brand-dark` (#0d3d56)
- ✓ Navbar and sidebar backgrounds
- ✓ Primary button backgrounds
- ✓ Main heading text
- ✓ Active/selected states
- ✓ Timeline connectors
- ✓ Form labels

### Use `brand-accent` (#006896)
- ✓ Hover states
- ✓ Borders (especially for focus/active)
- ✓ Icons that need attention
- ✓ Link text and underlines
- ✓ Focus ring colors
- ✓ Loading indicators
- ✓ Badge backgrounds

### Use `brand-light` (#e8f0f7)
- ✓ Subtle background fills
- ✓ Disabled state backgrounds
- ✓ Hover backgrounds (with opacity)
- ✓ Divider lines
- ✓ Light section separators

---

## 🌙 Dark Mode Support

Always pair light and dark classes:
```jsx
className="
  bg-white dark:bg-brand-dark
  text-brand-dark dark:text-white
  border-brand-accent/30 dark:border-brand-accent/40
  hover:bg-brand-light dark:hover:bg-brand-dark/80
"
```

---

## ⚡ Quick Copy-Paste Snippets

### Gradient Button
```jsx
className="bg-gradient-to-r from-brand-dark to-brand-accent text-white px-4 py-2 rounded-lg hover:shadow-brand transition-all"
```

### Outlined Button
```jsx
className="border-2 border-brand-accent text-brand-accent hover:bg-brand-accent hover:text-white px-4 py-2 rounded-lg transition-all"
```

### Card Premium
```jsx
className="card-premium bg-white dark:bg-brand-dark/80 border-brand-accent/30 hover:border-brand-accent/60"
```

### Glass Effect
```jsx
className="glass bg-white/70 dark:bg-brand-dark/15 backdrop-blur-md border border-brand-accent/20"
```

### Input Field
```jsx
className="w-full px-4 py-2 rounded-lg border border-brand-accent/30 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/15 bg-white dark:bg-brand-dark/60 text-brand-dark dark:text-white"
```

### Badge/Pill
```jsx
className="px-3 py-1 rounded-full bg-brand-light text-brand-dark dark:bg-brand-dark/50 dark:text-brand-accent text-xs font-semibold"
```

---

## 🔄 CSS Variables (for dynamic styling)

### Light Mode Variables
```css
--brand-dark: #0d3d56;
--brand-accent: #006896;
--brand-light: #e8f0f7;
--primary: #0d3d56;
--accent: #006896;
--background: #f5f7fa;
```

### Dark Mode Variables
```css
--brand-dark: #0d3d56;
--brand-accent: #006896;
--background: #0f1729;
--foreground: #e8eef6;
--card: #1a2332;
```

### Using Variables in CSS
```css
.my-element {
  color: var(--brand-accent);
  background: var(--background);
  border: 1px solid var(--brand-accent);
}
```

---

## ❌ Avoid These

- ❌ Don't use `slate-*`, `blue-*`, `purple-*`, `indigo-*`, or `neutral-*` colors
- ❌ Don't hardcode hex colors (use CSS variables instead)
- ❌ Don't forget dark mode classes
- ❌ Don't forget to use opacity classes for subtle backgrounds
- ❌ Don't use multiple shades of brand color without purpose

---

## ✅ Do Use These

- ✅ Use `brand-dark`, `brand-accent`, `brand-light` classes
- ✅ Use CSS variables for dynamic styling
- ✅ Always include dark mode support
- ✅ Use opacity classes (e.g., `/30`, `/60`) for layering
- ✅ Use consistent border radius (12-16px)
- ✅ Use smooth transitions (0.3s)

---

## 📞 Common Issues & Solutions

### Issue: Colors not updating
**Solution**: Clear browser cache and rebuild. Check you're using `brand-*` classes not `blue-*` or `slate-*`.

### Issue: Dark mode not working
**Solution**: Ensure dark mode classes are paired with light mode classes. Example:
```jsx
// ✅ Correct
className="bg-white dark:bg-brand-dark"

// ❌ Wrong
className="dark:bg-brand-dark"  // Missing light mode
```

### Issue: Text not readable
**Solution**: Check contrast ratios. Use `text-brand-dark` for light backgrounds, `text-white` or `text-brand-accent` for dark backgrounds.

---

**Last Updated**: May 2026
**Version**: 1.0 - Government Dashboard Theme
