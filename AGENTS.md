# Project

**Root:** `C:\TechnicalReport\Segulap`
**Structure:** `index.html`, `contact.html`, etc. in root · `assets/` · `assets/css/`
**Ignore:** `./template/` unless told otherwise.

---

# Behavior

- **Silent by default.** Do not explain, summarize, or narrate actions. No "I'll now...", no "Done!", no post-change commentary.
- **Ask before:** destructive changes, major structural refactors, deleting files, changing global styles/layout architecture, or anything irreversible.
- **Never ask about:** minor edits, bug fixes, adding elements within existing patterns, or anything clearly scoped by the instruction.

---

# Workflow

Before any major/structural change:

```
git add -A
git checkout -b checkpoint/<description>
git commit -m "checkpoint: <description>"
git checkout -
```

Then proceed on the original branch.

---

# Code Standards

- Production-ready, clean code only.
- Comment complex logic inline — no block explanations.
- No breaking changes without prior confirmation.

---

# Web Design Principles

**Typography**

- Use distinctive, characterful font pairings. Avoid Inter, Roboto, Arial, system-ui.
- Pair a strong display font with a refined body font.

**Color**

- Commit to a cohesive palette via CSS variables.
- Use dominant colors with sharp accents — avoid timid, even distributions.
- No purple-gradient-on-white defaults.

**Layout & Composition**

- Favor intentional asymmetry, overlap, diagonal flow, or grid-breaking elements.
- Use generous negative space OR controlled density — pick one and commit.

**Motion**

- CSS-only animations preferred for HTML. Subtle, purposeful — not decorative noise.
- One well-orchestrated page load beats scattered micro-interactions.
- Hover states and scroll-triggered reveals should feel considered.

**Atmosphere**

- Add depth: gradient meshes, noise textures, layered transparency, dramatic shadows.
- Every page should have a clear, memorable aesthetic direction — not generic.

**Anti-patterns to avoid**

- Cookie-cutter layouts
- Overused component patterns
- AI-slab aesthetics (flat cards, rounded corners everywhere, safe gradients)
