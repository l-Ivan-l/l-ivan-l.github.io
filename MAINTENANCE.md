# How to update this website

Everything you'd normally want to change lives in **`content/`** as plain text
files. You edit those, run one command, and push.

You should not need to touch HTML or CSS for ordinary updates.

---

## The 30-second version

```bash
# 1. edit a file in content/
# 2. rebuild
npm run build
# 3. publish
git add .
git commit -m "Update portfolio"
git push
```

Or, while you're working:

```bash
npm run dev     # http://localhost:8000, rebuilds every time you save
                # watches content/, templates/ and build.js
```

---

## 1. How the site is put together

```
content/*.json     ← the words. This is what you edit.
templates/         ← the page shell (head, nav, footer). Rarely touched.
build.js           ← turns content + templates into pages.
assets/css/main.css← how it looks.

index.html         ← GENERATED. Do not edit.
work/index.html    ← GENERATED. Do not edit.
experience/…       ← GENERATED. Do not edit.
about/…            ← GENERATED. Do not edit.
404.html           ← GENERATED. Do not edit.
```

> **The one rule that matters:** never edit `index.html`, `work/index.html`,
> `experience/index.html`, `about/index.html` or `404.html` by hand. The next
> `npm run build` overwrites them and your edit is gone without warning. Every
> generated file says so at the top. Edit `content/` instead.

**Which file holds what:**

| File | What's in it |
|---|---|
| `content/site.json` | Your name, the domain, social links, the nav menu, the footer, JSON-LD |
| `content/home.json` | Hero headline, the pitch paragraph, the four stat boxes |
| `content/games.json` | The shipped-games grid on the home page — one entry per title |
| `content/projects.json` | The Side projects page — one entry per personal project |
| `content/experience.json` | The Experience page — one entry per job/case study |
| `content/about.json` | The About page — the code-and-art argument, the toolset grid, contact |

---

## 2. Changing words

Open the relevant file, find the text, change it, save, `npm run build`.

That's genuinely it. For example, to change the pitch on the home page, open
`content/home.json` and edit `pitch_html`.

### Which fields accept HTML — read this once

**Any field whose name ends in `_html` accepts HTML.** Everything else is plain
text. This is the whole rule, and the field name always tells you.

In an **`_html`** field you may use `<strong>`, `<em>`, `<a href="…">` and
`&nbsp;` (a space that never line-breaks — useful in things like `60&nbsp;fps`).
Because it's raw HTML, you must write `&amp;` if you want a literal `&`.

```json
"approach_html": "I built a <strong>custom pooling system</strong> at 60&nbsp;fps."
```

In every **other** field, type normal characters. Write `Tools & Pipeline`, not
`Tools &amp; Pipeline` — the build escapes it for you, and typing the entity
yourself produces a visible `&amp;` on the page.

```json
"heading": "Engines & runtime"
```

### The two mistakes that are easy to make

1. Typing `&amp;` in a plain field → the page shows `&amp;`.
2. Typing a bare `&` in an `_html` field → technically invalid HTML. Use `&amp;`.

---

## 3. Adding a side project

`content/projects.json` is the **Side projects** page — personal work only.
Anything you were paid to build belongs in `content/experience.json` (§4) as a
case study, and in `content/games.json` (§3b) as a grid tile.

Copy an existing entry inside the `projects` list. Best project first — the
order in the file is the order on the page.

```json
{
  "slug": "my-new-project",
  "draft": false,
  "title": "My New Project",
  "meta": "Unity · C# · Released 2026",
  "role": "Solo — code, art, release",
  "hook": "One line for the home page card.",
  "discipline": ["Tools & Pipeline"],
  "media": {
    "video": "/media/my-new-project.mp4",
    "poster": "/media/my-new-project-poster.jpg",
    "placeholder": "Gameplay capture coming soon"
  },
  "problem_html": "What was technically hard.",
  "approach_html": "The system you built. <strong>Name the technique.</strong>",
  "result_html": "What it produced. Numbers if you have them.",
  "metrics": [
    { "value": "340 → 60", "context": "draw calls" }
  ],
  "tags": ["Unity", "C#"],
  "links": [
    { "label": "Play it", "href": "https://…", "primary": true }
  ]
}
```

Then `npm run build`.

**Field notes:**

- `slug` — lowercase, dashes, no spaces. It becomes the link `/work/#my-new-project`.
- `discipline` — optional. Fixed vocabulary, exactly these five labels, any
  number of them per entry: `Tools & Pipeline` · `Platform & SDK` · `Gameplay`
  · `Porting` · `Personal`. Rendered as a small bordered row, visually
  distinct from the free-text `tags` below it, so a reader looking for one kind
  of evidence (tools, platform, gameplay…) can scan for it on both this page
  and Experience without reading prose. Don't invent a sixth label — if nothing
  fits, leave it off rather than stretching one to cover it.
- `media` — all of it is optional. If the video file isn't there yet, the site
  shows a tidy "coming soon" panel instead of a broken box, and the build tells
  you which file it was looking for. You can add the video later and rebuild.
- `metrics`, `tags`, `links` — optional. Leave any of them out and that row
  simply doesn't render.
- `primary: true` on a link makes it the filled orange button. One per project.

**Keep it to three projects.** The build warns you if there are more. A hiring
manager will not dig past three, and a weak third one drags the other two down.

### The Problem → Approach → Result shape

Keep it. It's how technical interviewers think, and it's why the cards read as
evidence rather than description. Describe the **engineering problem**, not the
game's premise — and name the technique: object pooling, spatial hashing, an ECS
refactor. The specific noun is the signal.

---

## 3b. Adding a game to the home-page grid

`content/games.json` drives the grid of shipped titles under the hero. This is
professional credits only — one tile per game you were paid to work on.

```json
{
  "slug": "my-shipped-game",
  "title": "My Shipped Game",
  "meta": "Studio · 2024 · Steam, Switch",
  "role": "What you actually did, in one line.",
  "discipline": ["Gameplay"],
  "cover": { "image": "/media/games/my-shipped-game.jpg", "alt": "My Shipped Game key art" },
  "href": "/experience/#a-case-study-slug"
}
```

- `meta` is the credit line: studio, years, platforms. Use platforms alone when
  you don't have a reliable release year — better than guessing.
- `role` is the footline, and it is the whole point of the tile. Say what you
  built, and be honest about the distance: "sole engineer on both console
  ports" and "platform tooling the game team integrates" are very different
  claims, and an interviewer will ask.
- `discipline` uses the same fixed five-label vocabulary as `projects.json` and
  `experience.json`.
- `cover` is optional in practice — the build renders a typographic panel with
  the game's name if the file isn't there. See [media/README.md](media/README.md)
  for what art is and isn't allowed.
- `href` is optional. Include it only when there is a real case study to land
  on; a tile with no `href` renders as a plain card rather than a dead link.
- `draft: true` hides a tile, same as everywhere else.

`eyebrow`, `heading`, `intro_html` and `note_html` at the top of the file are
the section's own copy. `note_html` sits under the grid — it currently carries
the honest caveat about the Scopely titles being SDK work rather than game-team
work. Don't drop it.

> **Never put an unannounced, cancelled or embargoed title in this file.**
> `content/games.json` is fetchable on the open web whether or not a tile is
> marked `draft` (§6).

---

## 4. Adding a job or case study

`content/experience.json`, same idea:

```json
{
  "draft": false,
  "slug": "what-you-built",
  "title": "What you built",
  "meta": "Company · Your role · Tech used",
  "hook": "One line for the home page card, if this case gets teased there.",
  "discipline": ["Tools & Pipeline"],
  "titles": ["A Shipped Game"],
  "paragraphs_html": [
    "The problem the team had.",
    "What you built, and <strong>what you owned</strong>.",
    "What changed as a result."
  ],
  "links": [
    { "label": "Steam page", "href": "https://store.steampowered.com/app/000000/" }
  ]
}
```

`paragraphs_html` can hold as many paragraphs as you want. `slug`, `hook` and
`discipline` work exactly as they do on a project (§3) — `slug` becomes the
link `/experience/#what-you-built`, and `discipline` uses the same fixed
five-label vocabulary shared with `projects.json`.

`titles` and `links` are both optional. `titles` renders a small cross-reference
line naming the games the case touched, matching the names in the home grid —
**leave it off entirely when the title is embargoed**, which is why
`fbx-prefab-pipeline` has none. `links` renders buttons under the case, for a
store page or anything else already public.

There's also a single `also_shipped_html` string at the top level of the file
(a sibling of `cases`, not inside it) — one line rendered after the last case.
It currently points at the home-page grid. Leave it out if there's nothing to
add.

> **This page stays text-only.** Most of the work is under NDA, so there is no
> `media` field on a case study and no way to add one. Please keep it that way —
> no screenshots, no product imagery, no internal metrics. `links` are buttons,
> not media; adding one doesn't open the door to the other.

### The home page teaser grid pulls from both files

`content/home.json` → `teaser.items` is a hand-picked list, not an automatic
"first N projects". Each entry names a source file and a slug:

```json
"items": [
  { "source": "experience", "slug": "fbx-prefab-pipeline" },
  { "source": "projects",   "slug": "ufortnite" }
]
```

`source` is `"projects"` or `"experience"`; `slug` must match a `slug` already
set in that file. This is how a case study (Experience, no `media`) and a
project (Work, has `media`) can sit side by side on the home page — the card
itself only ever uses `title`, `meta`, `hook` and `discipline`, fields both
files share. Point an item at a `draft: true` entry or a slug that doesn't
exist and the build warns you and skips that card rather than failing.

---

## 5. Changing the toolset grid

`content/about.json` → `toolset.columns`. Each column is a heading and a list:

```json
{
  "heading": "Engines & runtime",
  "items": ["Unity — deep", "Unreal Engine 5"]
}
```

Add a column and the grid reflows on its own — no CSS change needed.

---

## 6. Hiding something without deleting it

Set `"draft": true` on any project, case study or toolset column. It disappears
from the site. Set it back to `false` to publish.

Every build tells you what it skipped, so nothing gets forgotten:

```
· skipped draft: projects.json "[ Project title ]"
```

> **Draft is not private.** This is a public repository, so `content/projects.json`
> is readable by anyone at `https://l-ivan-l.github.io/content/projects.json`,
> draft entries included. It only hides things from the *page*. Don't put
> anything confidential — client names, unannounced titles, salary, personal
> details — in a draft entry.

---

## 7. Adding a whole new page

Say you want a **Tools** page. Four small edits:

**1.** Create `content/tools.json` — copy `experience.json` and change the words:

```json
{
  "page": {
    "id": "tools",
    "path": "/tools/",
    "title": "Tools",
    "description": "One sentence for Google and link previews."
  },
  "eyebrow": "Tools",
  "heading": "Editor tooling I've built",
  "intro_html": "Before and after, with numbers.",
  "cases": [ … ]
}
```

**2.** In `build.js`, copy the `renderExperience` function, rename it
`renderTools`, and change which content it reads if the shape differs.

**3.** In `build.js`, add one line to the `PAGES` table (it's near the bottom,
under a big comment banner):

```js
{ content: 'tools.json', out: 'tools/index.html', render: renderTools },
```

**4.** In `content/site.json`, add one line to `nav`:

```json
{ "label": "Tools", "path": "/tools/" }
```

Then `npm run build`. The nav, the highlight for the current page, the head
tags, the footer and the mobile layout all come for free.

### Adding a section to an existing page

Add the content to that page's JSON file, then add a few lines to that page's
render function in `build.js`. The render functions all live together under the
`TEMPLATES — the HTML lives below this line` banner.

---

## 8. Images, video and the résumé

Put files in `media/` (screenshots, video, the social preview) or `assets/`
(the résumé PDF), then reference them from the JSON with a leading slash:
`/media/my-video.mp4`.

**Compress video before committing** — see `media/README.md` for the ffmpeg
commands. Git keeps every version of a binary file forever, so a raw capture
bloats the repository permanently.

### The résumé

The button on the home page **only appears once
`assets/Ivan_Almanza_Resume.pdf` actually exists.** Until then the build
reminds you it's missing rather than shipping a dead link.

> Publish a **redacted** copy — no phone number, no street address. The working
> copies in `_private/` are not publishable as they are.

### The social preview image

`media/og-preview.jpg`, 1200×630. Without it, every link you share on LinkedIn,
X, Slack or Discord renders as a bare text stub. The build warns until it's
there.

---

## 9. Changing the domain

One line. `content/site.json`:

```json
"origin": "https://ivanalmanza.dev"
```

No trailing slash — the build stops and tells you if you add one. That single
value feeds the canonical URL, both social-preview URLs and the structured data
on every page.

You'll also need to create a `CNAME` file and point DNS — see `README.md`.

---

## 10. Running the build

```bash
npm run build     # generate the pages once
npm run dev       # generate + serve on :8000 + rebuild whenever you save
```

No `npm install`. There are no dependencies — `build.js` uses only what comes
with Node.

### Reading the output

```
built 5 pages:
  index.html
  work/index.html
  ...

warnings (3):
  · missing /media/og-preview.jpg (site.json → ogImage) — shared links will preview as a bare text stub
  · media not found: /media/ufortnite.mp4 (projects.json → ufortnite) — placeholder shown instead
  · skipped draft: projects.json "[ Project title ]"
```

**Warnings are informational.** The site still builds and works. They're a
to-do list of missing assets, not errors.

**A build that fails** stops with `BUILD FAILED` and one message. Almost always
it's a JSON typo, and it names the file:

```
BUILD FAILED
content/projects.json is not valid JSON.
  Unexpected token } in JSON at position 1847
  Usual causes: a trailing comma, a missing comma, or a " inside a value that needs writing as \".
```

The usual culprit is a **trailing comma** — a comma after the last item in a
list or object. JSON doesn't allow it.

---

## 11. Publishing

```bash
npm run build
git add .
git commit -m "Add new project"
git push
```

Live in about a minute. **Always rebuild before committing** — otherwise you
push changed content with unchanged pages, and the site won't show your edit.

To see exactly what would go public before you commit:

```bash
git add -An --dry-run .
```

Worth doing whenever you've added files. `_private/` and the Claude files are
ignored and never publish, but every other committed file is fetchable on the
open web whether or not any page links to it.

---

## 12. Quick reference

| I want to… | Edit |
|---|---|
| Change the pitch or a stat | `content/home.json` |
| Add or edit a side project | `content/projects.json` |
| Add a game to the home grid | `content/games.json` |
| Add a job / case study | `content/experience.json` |
| Change the toolset lists | `content/about.json` |
| Change contact wording | `content/about.json` → `contact` |
| Rename a nav item | `content/site.json` → `nav` |
| Change social links | `content/site.json` → `social` |
| Change the domain | `content/site.json` → `origin` |
| Hide something temporarily | add `"draft": true` to it |
| Change colours or spacing | `assets/css/main.css` |
| Change the head tags or nav markup | `templates/base.html` |
| Add a new page | `content/` + `PAGES` table in `build.js` |
