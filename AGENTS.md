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

---

# Card Pattern (service-card)

Used on category landing pages (e.g. `seguridad-industrial/`, `proteccion-incendios/extintores/`).

**Structure:**
```
a.service-card-link > div.service-card > div.service-img + div.service-body
  > div.service-icon-wrap (48px circle, white SVG icon, var(--red) bg)
  + div.service-title
  + div.service-desc
```

- `.service-img` is 180px tall — use a real image via `<img>` when available, otherwise an orange gradient with a centered white SVG.
- `.service-icon-wrap` repeats the same SVG icon at a smaller scale (20px).
- Hover lift and orange shadow are handled by `.service-card-link:hover .service-card` in CSS (no inline JS).
- Cards are laid out in a CSS grid: `grid-template-columns:repeat(5,1fr);gap:16px` (for 5 cards to fit on 1080p).
- Link the whole card to its subsite via `href`. If no subsite exists yet, point to `../contacto/`.
- Pull product info lists from `charla.md` under the matching section title.
