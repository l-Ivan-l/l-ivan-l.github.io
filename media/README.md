# media/

Video and image assets, committed to the repo and served directly.

| File | What it is | Target size |
|---|---|---|
| `monster-mash.jpg` | Monster Mash card image, 16:9 | under 150 KB |
| `og-preview.jpg` | 1200×630 social preview card | under 300 KB |
| `games/<slug>.jpg` | Cover art for one home-page grid tile, 16:9 | under 125 KB |

## media/games/ — the home-page grid covers

One file per entry in `content/games.json`, named after its `slug`:
`marvel-strike-force.jpg`, `lunch-a-palooza.jpg`, and so on. 16:9, around
600×338 is plenty — the tiles are never wider than ~280 px.

**Public store key art only.** Steam capsules, App Store and Google Play
listing art, press-kit images. Never internal art, never a screenshot from a
build, never an unannounced or cancelled title. The Scopely and Digital Vault
work is under NDA; the *names* of shipped titles are public, product imagery
from inside those studios is not.

A missing cover is not a broken tile — the build renders a typographic panel
with the game's name instead, and tells you which files are still missing. The
grid works with none of them, some of them, or all of them.

Prefer art that carries the game's logo — a tile reads as a credit that way,
and the eight below all do. Tiles crop to 16:9 with `object-fit: cover`, so any
landscape ratio works, but crop to exactly 800x450 before committing so you can
see what the crop kept. Source art wider than 16:9 loses its left and right
edges to a centre crop, which is how a logo in a corner gets clipped.

### Where the current covers came from

All eight carry the game's logo. Each was re-cropped to 800x450.

| File | Source |
|---|---|
| `marvel-strike-force.jpg` | Official social share art, `assets.marvelstrikeforce.com` |
| `star-trek-fleet-command.jpg` | Publisher key art via Pocket Gamer's game page |
| `wwe-champions.jpg` | Launch key art via the Pro Wrestling wiki |
| `adventure-escape-mysteries.jpg` | Steam capsule, app 1141020 |
| `mms-adventure.jpg` | Launch key art via Pocket Gamer — delisted from both stores |
| `astrokings.jpg` | Captain Harlock collaboration key art via Inven Global |
| `lunch-a-palooza.jpg` | Steam capsule, app 1113770 |
| `running-fable.jpg` | Steam capsule, app 787920 |

Two notes for whoever revisits these. ASTROKINGS has no published base-game key
art carrying its logo that could be found — every logo-bearing image is a
crossover, so the tile uses the one where the ASTROKINGS wordmark is most
prominent. The WWE Champions art is from launch, so its roster is dated.

All eight are publisher-published marketing art, used to illustrate a shipped
credit. Nothing here came from inside a studio. If a rights holder ever objects,
delete the file — the tile falls back to its name panel and the page still works.

**Compress before committing.** GitHub Pages allows a 1 GB repo and 100 GB/month
of bandwidth — compressed clips won't come close, but raw captures will make the
site slow and bloat git history permanently.

```bash
# Silent, web-optimised, no audio track
ffmpeg -i input.mov -vcodec libx264 -crf 28 -preset slow \
       -vf "scale=1280:-2" -an -movflags +faststart output.mp4

# Poster frame
ffmpeg -i output.mp4 -vframes 1 -q:v 3 poster.jpg
```

If a clip won't get under ~5 MB, upload it to YouTube as unlisted and use the
`embed` form in `content/projects.json` instead of `video`:

```json
"media": { "embed": "https://www.youtube.com/embed/VIDEO_ID?rel=0" }
```

## Video: hosted here, or embedded

U.F.Ortnite currently uses a **YouTube embed**, so there is no video file in
this folder. `embed` is checked before `video` in `renderMedia`, so setting it
disables the self-hosted path entirely — `video`, `poster` and `placeholder`
become unreachable and can be deleted:

```json
"media": { "embed": "https://www.youtube-nocookie.com/embed/VIDEO_ID?rel=0" }
```

Use the `/embed/` URL, not a `watch?v=` or `youtu.be` link — those refuse to
frame and render a blank box. Unlisted videos embed fine; private ones don't.

To self-host instead, drop the file here and switch the entry back:

```json
"media": {
  "video": "/media/my-project.mp4",
  "poster": "/media/my-project-poster.jpg",
  "placeholder": "Gameplay capture coming soon"
}
```

A self-hosted clip renders as `<video autoplay muted loop playsinline>` — silent
ambient motion rather than a player with controls, which usually looks better in
the card. The tradeoff is that it lives in git history permanently, so keep it
under ~4 MB. Encode H.264 (`libx264`), never H.265 — HEVC fails in Firefox and
many Chrome installs, and the build hardcodes `type="video/mp4"`.

then run `npm run build`. The build swaps the placeholder panel for the video
automatically once the file exists — and tells you which files are still
missing. See [../MAINTENANCE.md](../MAINTENANCE.md) §8.
