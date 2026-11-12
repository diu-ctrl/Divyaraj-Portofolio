# PROJECT MEMORY & HANDOVER SPECIFICATION
**Project:** Divyaraj Chauhan — Personal Portfolio & Creative Studio  
**Live Production URL:** [https://www.divyarajchauhan.in](https://www.divyarajchauhan.in) / [https://divyarajchauhan.in](https://divyarajchauhan.in)  
**Target Identity:** Creative Strategist · AI Filmmaker · Frontend Web Developer  
**Document Version:** 2.0 (Comprehensive Master Handover)  
**Last Updated:** November 2026  

---

## 1. EXECUTIVE SUMMARY & TECH ARCHITECTURE

### The Core Goal
A world-class, ultra-premium portfolio blending **high-fashion editorial typography**, **raw neo-brutalism**, and **cutting-edge WebGL/physics interactivity**. The site showcases multi-disciplinary work across high-scale brand campaigns, AI-generated cinema, and custom web applications.

### Technical Stack
* **Architecture:** Static HTML5 / CSS3 / Vanilla ES6+ JavaScript. No bulky JavaScript frameworks (no React, Next.js, or Vue runtime overhead). Fast, raw, and instant.
* **Styling Engine:** Pure CSS design tokens (`css/tokens.css` and `css/global.css`), modern CSS custom properties (`var(--...)`), clamp-based fluid typography, and hardware-accelerated transforms.
* **Animation & Interactions:**
  * **GSAP 3 & ScrollTrigger:** Smooth reveals, pinned timeline galleries, and scrub animations.
  * **Lenis Smooth Scroll:** Inertial momentum scrolling with deep-link hash navigation support.
  * **Three.js & Matter.js:** Interactive 2D rigid-body physics driving a 3D textured ribbon and badge (`lanyard.js`).
  * **Custom WebGL Shaders:** Custom GLSL shaders for volumetric lighting (`LightRays` on About page) and organic caustics (`dappled-light.js`).
* **Deployment & Hosting:**
  * **Hosting:** Vercel (Edge Network).
  * **Git Repository:** `https://github.com/diu-ctrl/Divyaraj-Portofolio.git` (`main` branch).
  * **Automation:** Automated Vercel production build triggers on `git push origin main`.
  * **Custom Domains:** `www.divyarajchauhan.in` and `divyarajchauhan.in`.
* **Repository Storage Setup (Dual-Mirror Environment):**
  * **Primary Workspace:** `C:\Users\levol\Desktop\Websites folder\Brutalism Portfolio\New Portfolio`
  * **Archive / Mirror Workspace:** `C:\Users\levol\OneDrive\Desktop\OLD LAPTOP ARCHIEVE\Brutalism Portfolio\New Portfolio`
  * *Rule:* Any production commit or file change must be mirrored between both locations to ensure zero drift.

---

## 2. THE DESIGN DNA: WHAT LOOKS GOOD & MUST BE MAINTAINED

### 1. Pitch Black Foundation (`#000000`)
* **Never use grey or charcoal backgrounds.** The foundation is pure `#000000`.
* Shaders, overlays, and canvas backgrounds must blend into pitch black without leaving visible washed-out borders or grey boxes.

### 2. Signature Atmosphere: Brand Spray & Film Grain
* **Brand Spray Vignette:** `images/brand-spray-bg.webp` applied with subtle opacity (`0.12` to `0.16`). It adds an atmospheric, fine-spray glow behind titles and cards without washing out text contrast.
* **Film Grain:** A delicate noise overlay (`images/film-grain.png` at `0.06` to `0.08` opacity) provides analog texture to avoid flat digital gradients.

### 3. Typography Hierarchy & Casing
* **Editorial Headlines:** `Instrument Serif Italic` (with italic slant). Used for romantic, high-impact titles (e.g., *“A Look Behind My Work”*, *“Have a story that needs telling?”*, *“Divyaraj Chauhan”*).
* **Body / Clean UI:** `Geist Sans`, `Inter`, or `Segoe UI` for clean readability, descriptions, and article copy.
* **Tech Metadata / Badges / Pills:** `Space Mono` or clean monospace.
* **Casing Rule:** Headline casing or sentence casing. Avoid all-caps yelling. Domain pills are strictly lowercase (e.g., `divyarajchauhan.in`).

### 4. Rounded Neo-Brutalist Geometry
* **Pills & Capsules:** `border-radius: 9999px` (or `100px`) for buttons, status tags, and navigation pills.
* **Cards & Containers:** Smooth modern corners (`border-radius: 20px` to `24px`).
* **Borders:** Razor-thin brutalist strokes (`1px solid rgba(255, 255, 255, 0.08)` to `rgba(255, 255, 255, 0.15)`). Never heavy, chunky borders.
* **Buttons & Hover Inversions:** Buttons invert on hover (e.g., black surface with white text flips to pure white surface with pitch-black text, or brand orange accent `#EB4604`).

### 5. Accent Color
* **Signature Burnt Orange:** `#EB4604`. Used sparingly for high-intent call-to-actions, subtle brand badges, and specific focal highlights. It is never used as an overwhelming background flood.

---

## 3. STRICT ANTI-PATTERNS: WHAT WE MUST NEVER DO ("WHAT NOT TO DO")

> [!CAUTION]
> These rules have been explicitly mandated and tested through multiple iterations. Breaking these will degrade the user experience or brand integrity.

### ❌ Rule 1: NO Blinking, Pulsing, or Glowing Dots Anywhere
* **Never** use blinking, pulsing, or glowing status dots (e.g., green "Available for work" glowing dots, orange pulsing badges, radar pings).
* All `.pulse-dot`, `.live-pulse-dot`, `.blinking-dot`, and `.reviews-pulse-dot` classes are permanently suppressed in `css/tokens.css` with `display: none !important; animation: none !important;`.
* Status pills and tags must rely on clean brutalist borders and crisp typography alone.

### ❌ Rule 2: NO Grey Shaders or Washed-Out WebGL Canvases
* When implementing WebGL shaders (e.g. `LightRays` or `DappledLight`), never let the canvas background introduce ambient grey/haze that fogs the black background.
* The shader output must fall off cleanly to transparent/alpha `0.0` or pure `#000000`. Text behind/above shaders must remain 100% legible.

### ❌ Rule 3: NO Dirty URLs or Raw Encoded Paths
* **Never** have URLs with `%20`, raw spaces, or camelCase (e.g., `/brands/Ai%20Cinema%20Lab/The%20Last%20Amber/` is strictly forbidden).
* All URLs must be kebab-case lowercase slugs (e.g., `/brands/ai-cinema-lab/the-last-amber`).
* Permanent 308 redirects are defined in `vercel.json` for legacy or mistyped paths.

### ❌ Rule 4: NO White SERP Circles / Inverted Google Dark Mode Favicons
* In Google Search Dark Mode, Google automatically detects transparent favicons with white drawings and forcibly injects an ugly solid white circular disc behind them.
* **Solution deployed:** Always use a pre-baked circular black badge with a centered white monogram (`dc-logo.png`) across all favicon sizes (`favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `favicon-48x48.png`, `apple-touch-icon.png`, `android-chrome-*.png`).

### ❌ Rule 5: NO Inconsistent or Awkward Grid Layouts
* On case studies and galleries (e.g. The Last Amber asset breakdown), never leave an awkward 3 + 1 orphan row. Keep 4 items in a clean single 4-column row or a balanced 2x2 responsive grid.

### ❌ Rule 6: NO Fragmented Deep-Links (e.g., `/contact`)
* Standalone sub-routes like `/contact` must load as full, self-contained experiences. They cannot rely on state variables initialized on `index.html`.
* `/contact` has its own copy of the Three.js and Matter.js canvas bundle, Lenis scroll handling, and responsive viewport listeners.

### ❌ Rule 7: NO Duplicate Vercel Production Deployments
* Do not run manual `vercel deploy --prod` CLI commands when pushing to GitHub `main`.
* Pushing to GitHub `main` automatically triggers Vercel's GitHub Integration deployment. Doing both creates two concurrent builds that can cause queue collisions or duplicate deployments.

### ❌ Rule 8: NO Generic Stock Gradients or Cluttered Social Cards
* Social Open Graph cards (`1200 × 630`) must be razor-sharp, brutalist, pitch-black, featuring the DC monogram, Instrument Serif italic title, lowercase domain capsule (`divyarajchauhan.in`), and no distracting neon shapes.

### ❌ Rule 9: NO Eyebrow Capsules or Eyebrow Text Anywhere
* The line, capsule, or metadata word before any section or card (e.g., `04 — REFINED FASHION`, `.hero-eyebrow`, `.brand-eyebrow`, `.case-study-badge`, `.section-eyebrow`) is strictly forbidden globally across the entire website.
* Sections and case studies must start directly and cleanly with their primary headline (e.g., `<h2>KXM Fashion</h2>`, `<h1>Brand Name</h1>`) with no clutter.
* All `.case-study-badge`, `.eyebrow-e1`, `.hero-eyebrow`, `.brand-eyebrow`, `.section-eyebrow`, etc. are permanently suppressed in `css/tokens.css`.

---

## 4. DETAILED PAGE & FEATURE BLUEPRINT

### 1. `index.html` (Master Home)
* **Hero Section:**
  * Animated blur-in headline reveal that replays smoothly on navigation.
  * High-res responsive portrait with fine spray glow.
  * Circular audio toggle and brutalist CTA pills.
* **Marquee Bar:** Smooth infinite ticker with typographic separators.
* **Pinned Work Showcase:** Horizontal / pinned vertical parallax showcase of flagship brands.
* **3D Circular Slider:** Interactive web project carousel with smooth drag/inertia.
* **Services Matrix:**
  * Desktop: Interactive expandable accordion tabs.
  * Mobile: Custom pill tabs with interactive popup modal drawer.
* **Client Reviews / Testimonials:** Grid of authentic testimonials with role tags and client verification.
* **Interactive 3D Lanyard Contact Section:**
  * Canvas element `#lanyard-canvas`.
  * Physics engine: Matter.js calculates gravity, tension, and mouse velocity.
  * Render engine: Three.js projects a double-sided realistic lanyard strap with a metal clip and a photo ID card that swings with authentic momentum.

### 2. `about.html` (The Narrative & Philosophy)
* **LightRays WebGL Volumetric Shader:**
  * Full-width WebGL canvas rendering light rays from the top center.
  * Tuned for zero grey haze: light fades completely into `#000000`.
* **Stats Counter Section:**
  * Big impact metrics (`34+`, `3+`, `2K+`).
  * Strict styling: Numbers and `+` symbols are pure `#ffffff` (not dark grey), labels in muted silver.
* **Experience & Philosophy Breakdown:** Multi-column grid covering Growth, Cinema, and Code.

### 3. `brands/` (Case Studies Ecosystem)
* **Dedicated Case Studies:**
  * `brands/ai-cinema-lab/the-last-amber/index.html`: AI Cinema flagship case study. Includes custom video player, sound design credits, 4-image grid row, and spray vignette footer.
  * `brands/aspire.html`, `credes.html`, `esfi.html`, `finanvo.html`, `giffy.html`, `gujarat-tigers.html`, `hashlite.html`, `highrocks.html`, `sattvik.html`, `scuff.html`, `shelf.html`, `shift.html`, `untagd.html`, `white-horse.html`.
* **Universal Standard Across All Brand Pages:**
  * Header navigation with brutalist "Back to Portfolio" and "Hire Me" pill buttons.
  * Clean typography hierarchy: Brand name as top h1, eyebrow capsule above.
  * Video embed frames with rounded corners (`20px`) and custom inline video captions.

### 4. `contact.html` (Direct Route)
* Standalone page mirroring the interactive contact canvas from `index.html`.
* Auto-focuses on booking links (Coffee Chat, Email, WhatsApp) and live lanyard interaction.

---

## 5. REPOSITORY DIRECTORY STRUCTURE

```
New Portfolio/
│
├── index.html                   # Master Landing Page (Hero, Showcase, Services, Lanyard)
├── about.html                   # About Page (LightRays WebGL, Metrics, Philosophy)
├── contact.html                 # Standalone Contact Deep-Link
├── work.html                    # All Projects Archive
├── websites.html                # Web Development Portfolio
├── ai-cinema.html               # AI Cinema Reel & Commercials
├── divyaraj-resume.html         # Interactive Web Resume
├── divyaraj-resume.pdf          # Downloadable PDF Resume
├── privacy-policy.html          # Clean Legal & Privacy Terms
├── 404.html                     # Custom Brutalist 404 Error Page
├── vercel.json                  # Routing, 308 Clean Redirects, Caching Rules
├── site.webmanifest             # PWA Web Manifest
├── sitemap.xml                  # SEO Sitemap
├── robots.txt                   # Search Engine Directives
│
├── brands/                      # Dedicated Brand Case Studies
│   ├── ai-cinema-lab/
│   │   └── the-last-amber/      # Flagship The Last Amber Case Study
│   ├── aspire.html
│   ├── credes.html
│   ├── esfi.html
│   ├── finanvo.html
│   ├── giffy.html
│   ├── gujarat-tigers.html
│   ├── hashlite.html
│   ├── highrocks.html
│   ├── sattvik.html
│   ├── scuff.html
│   ├── shelf.html
│   ├── shift.html
│   ├── untagd.html
│   └── white-horse.html
│
├── css/                         # Global & Component Stylesheets
│   ├── tokens.css               # Design Tokens, Variables, Global Dot Suppression
│   ├── global.css               # Base Typography, Layouts, Navigation, Footer
│   ├── hero.css                 # Hero Animation & Interactive Canvas Rules
│   ├── work.css                 # Project Showcases & Media Grids
│   ├── LightRays.css            # Volumetric Shader Canvas Styles
│   └── loading-transition.css   # Smooth Page Transition Rules
│
├── js/                          # Interactive Logic & Physics Engines
│   ├── lanyard.js               # Three.js + Matter.js 3D Physics ID Badge
│   ├── dappled-light.js         # Caustic Lighting Shader
│   ├── hero-gallery.js          # Pinned Gallery & 3D WebGL Interactions
│   ├── brand-media-blur.js      # Dynamic Poster/Video Blur-In Transitions
│   └── main.js                  # Global Nav, Lenis Scroll, Video Observers
│
├── images/                      # Optimized Visual Assets
│   ├── brand-spray-bg.webp      # Core Signature Spray Texture
│   ├── film-grain.png           # Brutalist Analog Film Grain
│   ├── dc-share-card-v4.png     # Official OpenGraph & Social Card (1200x630)
│   ├── dc-logo.png              # White DC Monogram Logo
│   └── favicon-*.png            # Circular Black Badge Favicons Suite
│
└── videos/                      # High-Impact Video Showcases & Commercials
```

---

## 6. OPERATIONAL PROTOCOLS & DEPLOYMENT WORKFLOW

### Step 1: Making Changes
1. Apply edits to the Primary Workspace:
   `C:\Users\levol\Desktop\Websites folder\Brutalism Portfolio\New Portfolio`
2. Sync all modifications to the OneDrive Mirror Workspace:
   `C:\Users\levol\OneDrive\Desktop\OLD LAPTOP ARCHIEVE\Brutalism Portfolio\New Portfolio`

### Step 2: Quality & Human-Eye Verification
* Verify against pitch black `#000000` (ensure no accidental grey clipping).
* Ensure zero blinking/pulsing dots are introduced.
* Verify typography casing (lowercase domain pills, sentence/title case elsewhere).
* Check mobile viewport responsiveness (especially navigation pills and modal overlays).

### Step 3: Git Commit & Production Push
```bash
cd "C:\Users\levol\Desktop\Websites folder\Brutalism Portfolio\New Portfolio"
git status
git add -A
git commit -m "feat(scope): concise description of changes"
git push origin main
```

### Step 4: Vercel Verification
* Vercel will automatically build the new commit from GitHub `main`.
* If a domain alias needs to be verified or refreshed:
```bash
npx vercel alias set <deployment-url> www.divyarajchauhan.in
npx vercel alias set <deployment-url> divyarajchauhan.in
```
* Verify live response via HTTP `200 OK`.

---

## 7. STRATEGIC BRAINSTORMING & FUTURE ROADMAP

When brainstorming next-level upgrades or expanding features with an AI agent or design partner, prioritize these high-impact directions:

1. **Shader Performance & Memory Cleanup:**
   * Ensure WebGL contexts on `about.html` (LightRays) and `index.html` (Lanyard) dispose of geometries and textures when scrolled far out of view to preserve GPU cycles on low-end mobile devices.
2. **Interactive Sound Design / Micro-Audio:**
   * Add an optional, ultra-subtle mechanical tactile audio click (sub-20ms) on brutalist pill button hovers, toggled via a persistent audio mute button.
3. **Dynamic Case Study Template:**
   * Unify the remaining legacy brand pages into the elevated format used on `the-last-amber` (4-column asset breakdowns, spray footer vignettes, and unified brutalist pill navigation).
4. **Interactive 3D Badge Customization:**
   * Allow users to drag the Lanyard ID card vigorously and fling it with inertia, or flip the card to reveal easter-egg technical stats or a QR code.
5. **SEO & Structured Data Mastery:**
   * Maintain JSON-LD structured schemas on all pages for `Person`, `CreativeWork`, and `VideoObject` to maximize rich snippet rankings on Google and Bing.
