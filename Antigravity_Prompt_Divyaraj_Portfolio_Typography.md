# Antigravity Prompt — Divyaraj Chauhan Portfolio · Single-Typeface Refactor

> **Workspace context for Antigravity:** The project is a static HTML/CSS brutalist portfolio at local path `C:\Users\levol\Desktop\OLD LAPTOP ARCHIEVE\Brutalism Portfolio\New Portfolio\` and deployed at https://www.divyarajchauhan.in/. It uses a shared CSS file at `css/global.css` plus per-page inline `<style>` blocks and `<link>` Google Fonts imports. Pages: `index.html`, `ai-cinema.html`, `websites.html`, `divyaraj_resume.html`, `privacy-policy.html`, `404.html`, and brand case studies under `/brands/` (untagd.html, credes.html, giffy.html, finanvo.html, sattvik.html, etc.).
>
> The site currently uses THREE font families: `Instrument Serif` (italic headings + numbers), `Inter` (body copy), and `Space Mono` / `JetBrains Mono` (UI / labels / buttons / counters). The user wants to eliminate the mono family entirely so only TWO families ship: `Instrument Serif` and `Inter`. The user also wants NO ALL-CAPS anywhere on the site — neither via CSS `text-transform: uppercase` nor written directly in the HTML markup.

---

## STRICT SCOPE — DO NOT TOUCH

Antigravity may ONLY modify:

1. **CSS typography properties**: `font-family`, `font-weight`, `font-style`, `font-size`, `letter-spacing`, `text-transform`, `line-height` — when these need to change to support the font swap or the uppercase removal.
2. **HTML text content** — only the actual text strings, to convert ALL CAPS words/phrases to Title Case or sentence case.
3. **CSS `<link>` / `@import` tags** that load Google Fonts — to remove `Space Mono` / `JetBrains Mono` imports.

Antigravity may NOT touch:

- **Layout structure**: `display`, `grid-template-*`, `flex`, `gap`, `padding`, `margin`, `width`, `height`, `position`, `top/left/right/bottom`, `z-index`.
- **Visual design**: `background`, `background-color`, `color` (except where a hover state's text color change depends on the same rule that has `text-transform: uppercase`), `border`, `border-radius`, `box-shadow`, `filter`, `opacity`, `transform`.
- **Page structure / DOM hierarchy** — no adding or removing HTML elements, no reordering, no restructuring.
- **JavaScript** — do not touch any `.js` file or inline `<script>` block.
- **Images, videos, SVGs** — do not touch.
- **Responsive `@media` queries' structure** — only the typography rules inside them may be touched.
- **Animation keyframes** — do not touch.

If Antigravity finds itself wanting to change any layout/visual property to "make it look better after the font swap", STOP — that is out of scope. Report it as a follow-up suggestion instead.

---

## PHASE 0 — Safety net (do this first, before any edits)

1. Run `git status` in the project root. Confirm working tree is clean. If dirty, commit current state with message `chore: pre-typography-refactor snapshot` before continuing.
2. Create a backup branch: `git checkout -b typography-refactor`. All work happens on this branch.
3. Report the current commit hash. This is the rollback point if anything breaks.

---

## PHASE 1 — Remove Space Mono / JetBrains Mono / monospace from CSS

### Step 1.1 — Update the `:root` CSS variables in `css/global.css`

Find this block (around line 1–20 of `css/global.css`):

```css
:root {
    --font-serif: 'Instrument Serif', Georgia, serif;
    --font-sans:  'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    --font-mono:  'Space Mono', 'JetBrains Mono', monospace;
}
```

Change it to:

```css
:root {
    --font-serif: 'Instrument Serif', Georgia, serif;
    --font-sans:  'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    /* --font-mono removed — entire site uses only --font-serif and --font-sans */
}
```

Do NOT add a `--font-mono` alias to `--font-sans`. The variable must be GONE so that any rule still referencing it fails loudly and gets caught in Step 1.4.

### Step 1.2 — Replace every `var(--font-mono)` reference

Search the entire project for these patterns (in `css/global.css`, per-page CSS files under `css/`, and every inline `<style>` block in every HTML file):

- `var(--font-mono)`
- `'Space Mono'`
- `"Space Mono"`
- `'JetBrains Mono'`
- `"JetBrains Mono"`
- `monospace` (as a `font-family` value, NOT as a CSS keyword in other contexts — `monospace` is also a generic family keyword)

For each match, replace the entire `font-family` declaration with:

```css
font-family: var(--font-sans);
```

That means rules like:

```css
.nav-links a { font-family: var(--font-mono); font-weight: 500; ... }
```

…become:

```css
.nav-links a { font-family: var(--font-sans); font-weight: 500; ... }
```

### Step 1.3 — Adjust font-weight and letter-spacing for converted rules

Space Mono is visually heavier than Inter at the same numeric weight, and monospace fonts need wider letter-spacing than proportional fonts. After Step 1.2, the converted rules will look "thin" and "loose" because Inter at the same weight + same letter-spacing renders differently.

Apply these weight + letter-spacing recalibrations to every rule that previously used `--font-mono`:

| Original mono weight | Original letter-spacing | New Inter weight | New Inter letter-spacing |
| :--- | :--- | :--- | :--- |
| 400 (regular labels, badges, meta-tags) | 0.06em – 0.10em | **500** (medium) | **0.02em** |
| 400 (regular labels, badges, meta-tags) | 0.10em – 0.15em | **500** (medium) | **0.04em** |
| 500 (medium nav links) | any | **600** (semibold) | **0.01em** |
| 700 (bold buttons, step-num, section eyebrows) | 0.06em – 0.10em | **700** (bold) | **0.02em** |
| 700 (bold buttons, step-num, section eyebrows) | 0.10em – 0.15em | **700** (bold) | **0.04em** |

Notes:
- These recalibrations are visual approximations to keep the converted elements reading at the same "weight feel" they had under mono. Do not invent new values — use only the ones in the table above.
- For rules where the original letter-spacing was 0 or negative (rare for mono usage), leave the letter-spacing as-is.
- For rules where the original mono weight was something else (300, 600, 800, 900), map to the nearest Inter weight using the same proportional logic.

### Step 1.4 — Verify no mono references survive

After Step 1.3, run these searches across the whole project. ALL must return zero results:

```bash
grep -rn "Space Mono" .
grep -rn "JetBrains Mono" .
grep -rn "var(--font-mono)" .
grep -rn "font-family.*monospace" .  # only matches where monospace is used as a font-family value
```

If ANY result returns, fix it before moving to Phase 2. Do NOT proceed with mono references still in the codebase.

### Step 1.5 — Remove the Google Fonts `<link>` for Space Mono

Search every HTML file's `<head>` for `<link>` tags that import Space Mono or JetBrains Mono. Typical pattern:

```html
<link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
```

Delete the entire `<link>` line. Do NOT touch the `Inter` or `Instrument Serif` `<link>` tags.

If a single Google Fonts URL bundles multiple families in one request (e.g. `family=Inter:wght@400;700&family=Space+Mono:wght@400;700`), edit the URL to remove only the `Space+Mono` segment. Keep the `Inter` and `Instrument+Serif` segments intact.

### Step 1.6 — Inter weight audit

Since we are now using Inter weights 400, 500, 600, 700 (and possibly 800/900 for hero brand text already in use), verify that the Inter Google Fonts `<link>` loads ALL these weights. If the current `<link>` only loads `wght@300;400;500;700`, update it to:

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
```

Do NOT remove weights that were already loaded — only ADD missing ones. The site already uses 300/400/500/600/700/800/900 across various elements per the audit, so all 7 weights must be available.

---

## PHASE 2 — Remove all CSS `text-transform: uppercase` rules

### Step 2.1 — Find every `text-transform: uppercase` declaration

Search the entire project (all `.css` files AND all inline `<style>` blocks in HTML files):

```bash
grep -rn "text-transform:\s*uppercase" .
grep -rn "text-transform: uppercase" .
```

Both forms (with and without space after colon) must be caught. List every match.

### Step 2.2 — Remove or neutralize each rule

For each match found in Step 2.1, apply one of these strategies in priority order:

1. **Preferred:** Delete the entire `text-transform: uppercase;` line. Leave the rest of the rule untouched.
2. **If deletion would leave the rule block empty** (e.g. the rule only contained `text-transform: uppercase`), then change it to `text-transform: none;` to keep the rule block valid.
3. **If the rule is inside a `:hover`, `:focus`, or `:active` pseudo-class** and is the only property, delete the entire pseudo-class block.

Do NOT touch any other property in the same rule. If a rule has `text-transform: uppercase; color: red; font-weight: 700;`, only the `text-transform` line gets deleted. `color` and `font-weight` stay exactly as they are.

### Step 2.3 — Verify zero `uppercase` rules remain

Run:

```bash
grep -rn "text-transform:\s*uppercase" .
grep -rn "text-transform: uppercase" .
```

Both must return zero results. If any match remains, fix it before moving to Phase 3.

---

## PHASE 3 — Convert HTML-written ALL CAPS text to normal case

Now that CSS no longer enforces uppercase, you must convert every word or phrase that was WRITTEN IN ALL CAPS directly in the HTML markup. Otherwise the text will still display in all caps even though the CSS no longer forces it.

### Step 3.1 — Conversion rules (READ CAREFULLY — this is the most error-prone phase)

Apply these rules to every ALL CAPS word/phrase found in HTML markup. The rules are ordered by priority — apply the first matching rule.

#### Rule A — Multi-word phrases / labels / titles / buttons

Convert to **Title Case** (first letter of each major word capitalized, minor words like "and", "or", "to", "the", "a", "of", "for" stay lowercase UNLESS they are the first word).

Examples:
- `WATCH FILM` → `Watch Film`
- `START A PROJECT ↗` → `Start a Project ↗`
- `VIEW FULL PROCESS →` → `View Full Process →`
- `VIEW CASE STUDY →` → `View Case Study →`
- `BACK TO PORTFOLIO` → `Back to Portfolio`
- `BACK TO TOP ↑` → `Back to Top ↑`
- `SYSTEM STATUS` → `System Status`
- `CORE RESPONSIBILITIES` → `Core Responsibilities`
- `WORK EXPERIENCE` → `Work Experience`
- `CORE SKILLS` → `Core Skills`
- `AI & CINEMATOGRAPHY TOOLS` → `AI & Cinematography Tools` (note: `AI` stays uppercase — see Rule C)
- `THE CHALLENGE` → `The Challenge`
- `THE HUMAN LAYER & SOLUTION` → `The Human Layer & Solution`
- `THE TOOL STACK` → `The Tool Stack`
- `KEY OUTCOME` → `Key Outcome`
- `CASE STUDY` → `Case Study`
- `EXPLORE MORE BRAND COLLABORATIONS` → `Explore More Brand Collaborations`
- `LIVE PRODUCTION` → `Live Production`
- `FEATURED BUILD` → `Featured Build`

#### Rule B — Brand names written in ALL CAPS

Convert to **Title Case** (treat the brand as a proper noun).

Examples:
- `UNTAGD` → `Untagd`
- `CREDES TECHLABS` → `Credes Techlabs`
- `GIFFY` → `Giffy`
- `FINANVO` → `Finanvo`
- `SATTVIK` → `Sattvik`
- `GUJARAT TIGERS` → `Gujarat Tigers`
- `ASPIRE` → `Aspire`
- `ESFI` → `Esfi`
- `HASHLITE` → `Hashlite`
- `HIGHROCKS` → `Highrocks`
- `SCUFF` → `Scuff`
- `SHELF` → `Shelf`
- `SHIFT` → `Shift`
- `WHITE HORSE` → `White Horse`

If a brand has a known stylized capitalization that differs from Title Case (e.g. `iPhone`, `eBay`), flag it in the report for the user to confirm — do NOT guess.

#### Rule C — Legitimate standalone acronyms — KEEP UPPERCASE

These are NOT "all caps styling" — they are how acronyms are conventionally written. Leave them uppercase as standalone tokens AND inside phrases.

List of acronyms to KEEP uppercase (extend this list if you find others following the same pattern of 2–5 letter technical abbreviations):

- `AI` (artificial intelligence)
- `POV` (point of view)
- `EV` (electric vehicle)
- `HUD` (heads-up display)
- `EVA` (extravehicular activity)
- `FPS` (frames per second)
- `4K`, `1080P`, `8K` (resolutions)
- `UI`, `UX` (user interface / experience)
- `B2B`, `B2C` (business models)
- `API`, `GQL`, `SQL` (tech terms)
- `BMW`, `DB5` (car model codes)
- `SaaS`, `PaaS`, `IaaS` (cloud models, if present)
- `HTML`, `CSS`, `JS`, `JSON`, `XML` (web tech, if present)

So `AI & CINEMATOGRAPHY TOOLS` becomes `AI & Cinematography Tools` (Rule A + Rule C). The `AI` stays uppercase because of Rule C. The rest follows Rule A.

#### Rule D — Coordinates and data strings

Convert place names and labels to Title Case. Keep numeric portions, compass letters, and units exactly as-is.

Examples:
- `AHMEDABAD, INDIA // 23.0225° N, 72.5714° E` → `Ahmedabad, India // 23.0225° N, 72.5714° E`
  (Place names → Title Case. Coordinates `N` / `E` → KEEP uppercase because they are compass abbreviations, same logic as Rule C.)
- `AVAILABILITY: OPEN FOR COMMERCIAL & FILM INQUIRIES` → `Availability: Open for Commercial & Film Inquiries`
- `SYSTEM STATUS: ALL REELS OPTIMIZED` → `System Status: All Reels Optimized`
- `DISCIPLINE` → `Discipline`
- `EXPERIENCE` → `Experience`
- `AI FILMS DIRECTED` → `AI Films Directed` (Rule A + Rule C)
- `PROJECTS COMPLETED` → `Projects Completed`

#### Rule E — Step counters

Convert the word `STEP` to `Step`. Keep the numeric portion exactly as-is.

Examples:
- `STEP 01` → `Step 01`
- `STEP 02` → `Step 02`
- `STEP 03` → `Step 03`
- `01 / 04` → `01 / 04` (no change — already numeric)

#### Rule F — Status pills

- `PRESENT` → `Present`
- `CURRENT` → `Current`
- `LINK COPIED — SHARE DIRECTLY!` → `Link Copied — Share Directly!`

#### Rule G — Contact links

- `LINKEDIN` → `LinkedIn` (brand stylization — has camelCase)
- `TWITTER` → `Twitter`
- `WHATSAPP` → `WhatsApp` (brand stylization — has camelCase)
- `EMAIL` → `Email`
- `PORTFOLIO` → `Portfolio`

#### Rule H — Quote attributions

- `DIVYARAJ CHAUHAN` → `Divyaraj Chauhan` (proper noun — person name)
- `DIVYARAJ CHAUHAN — AI JUNIOR CREATOR` → `Divyaraj Chauhan — AI Junior Creator` (Rule A + Rule C: `AI` stays uppercase, rest becomes Title Case)

#### Rule I — Section eyebrows (lead-ins)

The `//` prefix stays. Convert the rest per Rule A.

- `// SELECTED WORKS` → `// Selected Works`
- `// BRAND COLLABORATIONS` → `// Brand Collaborations`
- `// ABOUT` → `// About`
- `CORE FOCUS AREAS` → `Core Focus Areas`
- `THE ASSIGNMENT` → `The Assignment`
- `TOOL ECOSYSTEM` → `Tool Ecosystem`

#### Rule J — Pricing/package labels

Apply Rule A. E.g. `STARTER PACKAGE` → `Starter Package`, `PRO PACKAGE` → `Pro Package`. Keep any acronym suffix uppercase per Rule C.

#### Rule K — Video overlay badges (these have mixed content)

Apply Rule A + Rule C + Rule D.

- `POV COCKPIT · HYPER-SUV` → `POV Cockpit · Hyper-SUV` (POV = Rule C, HYPER-SUV is a compound adjective → Title Case, SUV is an acronym → keep uppercase)
- `AD FILM · KUWAIT` → `Ad Film · Kuwait`
- `BEAT-SYNCED · TULASI — SUMEDH K` → `Beat-Synced · Tulasi — Sumedh K`
- `21:9 ULTRAWIDE · MASTER CRAFTSMAN` → `21:9 Ultrawide · Master Craftsman`
- `21:9 ULTRAWIDE · MOUNTAIN TRADITIONS` → `21:9 Ultrawide · Mountain Traditions`
- `STUDIO SHOWCASE · AERODYNAMICS` → `Studio Showcase · Aerodynamics`
- `16:9 WIDESCREEN · UNTAGD` → `16:9 Widescreen · Untagd` (Rule B for the brand)

#### Rule L — Resume / privacy-policy specific

Apply Rule A + Rule C.
- `EMAIL`, `PHONE`, `LOCATION`, `PORTFOLIO` labels → `Email`, `Phone`, `Location`, `Portfolio`
- `PRODUCTION SPEED`, `CLIENT RETENTION` highlight labels → `Production Speed`, `Client Retention`
- `EDUCATION`, `CERTIFICATIONS` → `Education`, `Certifications`
- `FEATURE`, `CLIENT`, `STACK`, `OUTCOME` (table headers) → `Feature`, `Client`, `Stack`, `Outcome`
- `TECH STACK`, `TIMELINE`, `DELIVERABLE` meta-labels → `Tech Stack`, `Timeline`, `Deliverable`

### Step 3.2 — Conversion execution order

Process files in this order to minimize cross-page regressions:

1. `css/global.css` — no HTML edits, skip.
2. `index.html` — homepage (highest visibility).
3. `ai-cinema.html`
4. `websites.html`
5. `divyaraj_resume.html`
6. `privacy-policy.html`
7. `404.html`
8. Every file in `brands/` subfolder (untagd.html, credes.html, giffy.html, finanvo.html, sattvik.html, and any others).

For each file:
1. Read the entire file.
2. Identify every ALL CAPS word/phrase (use the regex `[A-Z]{2,}` to find candidates, then manually verify each match is a legitimate ALL CAPS stylization vs. an acronym per Rule C).
3. Apply Rules A–L to each match.
4. Save the file.
5. Move to the next file.

### Step 3.3 — Don't touch these (acronym-safe list)

These strings contain uppercase letters that should NOT be converted:

- Any single-token technical acronym from Rule C: `AI`, `POV`, `EV`, `HUD`, `EVA`, `FPS`, `4K`, `1080P`, `UI`, `UX`, `B2B`, `B2C`, `API`, `GQL`, `SQL`, `HTML`, `CSS`, `JS`, `JSON`, `XML`, `SaaS`, `PaaS`, `IaaS`, `BMW`, `DB5`, `SUV`, `8K`, `BMW x KITH` (brand collab).
- Compass directions in coordinate strings: `N`, `S`, `E`, `W`, `NE`, `NW`, `SE`, `SW`.
- File extensions when used as standalone tokens: `.html`, `.css`, `.js` (rare in user-facing copy).
- The first-person pronoun `I` (always uppercase per English convention).
- The word `OK` if it appears (legitimate acronym).

### Step 3.4 — Verify after each file

After saving each HTML file, run a quick sanity grep on just that file:

```bash
grep -E "[A-Z]{4,}" <file>.html
```

This finds runs of 4+ consecutive uppercase letters — likely ALL CAPS stylization that was missed. Acronyms of ≤3 letters (AI, POV, FPS) won't match this regex, so they won't show up as false positives. Investigate every match. If it's a missed stylization, convert it. If it's a legitimate acronym extension, leave it.

After processing ALL HTML files, run project-wide:

```bash
grep -rE "[A-Z]{4,}" --include="*.html" .
```

Every match must be either:
- A legitimate acronym per Rule C (e.g. `1080P`, `BMW`, `KITH`, `EVA`).
- A coordinate compass abbreviation (`NW`, `NE`).
- A flag-for-user-review brand name where the official stylization is unknown.

Report any ambiguous matches in the final report. Do NOT guess.

---

## PHASE 4 — Verification & report

### Step 4.1 — Final grep audit

Run all of these and report the output of each. All should return ZERO results (or only the documented acronym exceptions):

```bash
# No mono font references anywhere
grep -rn "Space Mono" .
grep -rn "JetBrains Mono" .
grep -rn "var(--font-mono)" .
grep -rE "font-family:\s*[^;]*monospace" .

# No CSS uppercase rules anywhere
grep -rn "text-transform:\s*uppercase" .

# No ALL CAPS phrases ≥4 letters in HTML (acronyms allowed)
grep -rE "[A-Z]{4,}" --include="*.html" .
```

### Step 4.2 — Visual sanity check (report what you see)

Open each page in a browser locally and confirm:
1. **Layout is unchanged** — no grid/flexbox breakage, no element overflow, no width shift caused by the new font metrics.
2. **Hierarchy is preserved** — headings still look like headings (Inter 700 + larger size), body still looks like body (Inter 400 + 16px), labels still look like labels (Inter 500 + small size + slight tracking).
3. **No text is cut off** — labels that were tight (e.g. `CORE RESPONSIBILITIES` in a narrow sidebar) may now render slightly wider because Inter is proportional while Space Mono was monospace (each glyph same width). Check sidebar boxes, meta boxes, stat labels, table headers. If any overflow, report it — do NOT fix it by shrinking font-size (that's a layout fix, out of scope). Flag for the user.
4. **No all-caps text appears** — every page reads in normal case. Acronyms (AI, FPS, 4K) and brand-name acronyms are fine.
5. **No font-weight jarring** — buttons shouldn't look too thin (Inter 400 looks much thinner than Space Mono 400). If any element looks visually lighter than before, that means Step 1.3's weight recalibration was missed on that rule — go back and apply it.

### Step 4.3 — Final report

Report back with:

1. **Phase 0**: The pre-refactor commit hash (rollback point).
2. **Phase 1**: The list of CSS files modified, the count of `var(--font-mono)` references replaced, the count of Google Fonts `<link>` tags cleaned, and the final Inter weights loaded.
3. **Phase 2**: The count of `text-transform: uppercase` rules removed.
4. **Phase 3**: Per-HTML-file list of ALL CAPS → Title Case conversions made (one bullet per file, e.g. "index.html: 14 conversions including SYSTEM STATUS → System Status, AVAILABILITY → Availability, etc.").
5. **Phase 4.1**: The output of every grep command. All must be zero (or document the acronym exceptions).
6. **Phase 4.2**: A one-paragraph visual sanity report per page — what looks the same, what looks slightly different (but not broken), what (if anything) is flagged for the user to look at.
7. **Acronym exceptions list**: Every Rule C acronym you encountered, so the user can verify the list is exhaustive.
8. **Ambiguous brand-name list**: Any brand name where you weren't sure if Title Case is the official stylization. User will confirm.
9. **Layout flags**: Any element where the new font caused overflow / cutoff / shift. User will decide whether to allow a layout fix in a follow-up task.

### Step 4.4 — Commit

After all phases are complete and Phase 4.1 greps return zero, commit:

```bash
git add .
git commit -m "refactor: consolidate typography to Instrument Serif + Inter only; remove mono family; remove all text-transform: uppercase; convert HTML ALL CAPS to Title Case"
```

Do NOT push to main yet. Stay on the `typography-refactor` branch. User will review the local preview, then merge to main and push.
