# l-ivan-l.github.io

Personal portfolio — Iván Almanza, Tools &amp; Pipeline Engineer.

Static site. No dependencies, no framework. Content lives in `content/*.json`
and a small Node script generates the pages.

> **Editing the site? Read [MAINTENANCE.md](MAINTENANCE.md).** It covers changing
> text, adding projects, adding pages, assets and publishing.

```
content/*.json        the words — this is what you edit
templates/base.html   the page shell (head, nav, footer)
build.js              generates the pages
dev.js                local preview server
assets/css/main.css   all styles
assets/               résumé PDF and downloadable files
media/                video, posters, social preview image
_private/             source material — GITIGNORED, never published

index.html            GENERATED — do not edit
work/  experience/  about/  404.html    GENERATED — do not edit
```

---

## 1. Build and preview

```bash
npm run build     # regenerate the pages
npm run dev       # preview on http://localhost:8000, rebuilds on save
```

No `npm install` — there are no dependencies.

## 2. Deploy

```bash
npm run build
git add .
git commit -m "Update portfolio"
git push
```

Then once, in the repo: **Settings → Pages → Source: Deploy from a branch →
`main` / `(root)`** → Save. Live in about a minute at `https://l-ivan-l.github.io`.

Always run the build before committing, or the pages won't reflect your edits.
