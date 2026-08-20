#!/usr/bin/env node
/* ============================================================
   Iván Almanza — portfolio site generator

   Reads  content/*.json  +  templates/base.html
   Writes index.html, work/, experience/, about/, 404.html

   Run:  npm run build      (or: node build.js)
   Dev:  npm run dev        (rebuilds on save, serves on :8000)

   No dependencies. Node built-ins only.

   TO ADD A PAGE:    see the PAGES table near the bottom of this file.
   TO CHANGE WORDS:  don't edit this file — edit content/*.json.
   ============================================================ */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const CONTENT = path.join(ROOT, 'content');
const TEMPLATES = path.join(ROOT, 'templates');
const MAX_PROJECTS = 3; // "three projects maximum, best first"

const warnings = [];
// Deduped: some content files are read by more than one page, so the same
// warning would otherwise be printed several times.
const warn = (msg) => { if (!warnings.includes(msg)) warnings.push(msg); };

/* ---------- helpers ---------- */

// Everything is escaped by default. Fields whose JSON key ends in _html are
// inserted raw, because they hold deliberate inline markup.
const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

// Items marked "draft": true are skipped everywhere, and announced at build time
// so nothing can quietly rot for a year.
const published = (arr, label) => (arr || []).filter((x) => {
  if (x && x.draft) warn(`skipped draft: ${label} "${x.title || x.slug || '?'}"`);
  return !(x && x.draft);
});

function readJSON(file) {
  const full = path.join(CONTENT, file);
  let text;
  try {
    text = fs.readFileSync(full, 'utf8');
  } catch (e) {
    throw new Error(`Cannot read content/${file} — ${e.message}`);
  }
  try {
    return JSON.parse(text.replace(/^﻿/, ''));
  } catch (e) {
    // Node's raw JSON error carries no filename, which is useless with six files.
    throw new Error(
      `content/${file} is not valid JSON.\n  ${e.message}\n` +
      '  Usual causes: a trailing comma, a missing comma, or a " inside a value ' +
      'that needs writing as \\".'
    );
  }
}

// Does a root-absolute site path exist on disk?
const assetExists = (p) => fs.existsSync(path.join(ROOT, p.replace(/^\//, '')));

/* ============================================================
   TEMPLATES — the HTML lives below this line.
   ============================================================ */

function renderButton(link) {
  const cls = link.primary ? 'btn btn-primary' : 'btn';
  const ext = /^https?:\/\//.test(link.href) ? ' target="_blank" rel="noopener"' : '';
  return `<a class="${cls}" href="${esc(link.href)}"${ext}>${esc(link.label)}</a>`;
}

function renderNav(site, page) {
  return site.nav.map((item) => {
    const active = item.path === page.path;
    const attrs = active ? ' class="active" aria-current="page"' : '';
    return `      <a href="${esc(item.path)}"${attrs}>${esc(item.label)}</a>`;
  }).join('\n');
}

function renderNavMark(site, page) {
  const mark = `${esc(site.navMark.head)}<span>.</span><span class="tail">${esc(site.navMark.tail)}</span>`;
  return page.path === '/'
    ? `<div class="nav-mark">${mark}</div>`
    : `<a class="nav-mark" href="/">${mark}</a>`;
}

function renderPageHead(c) {
  const intro = c.intro_html ? `\n      <p class="section-note">${c.intro_html}</p>` : '';
  return `  <div class="page-head">
    <div class="wrap">
      <div class="eyebrow">${esc(c.eyebrow)}</div>
      <h1>${esc(c.heading)}</h1>${intro}
    </div>
  </div>`;
}

// Video if the file exists, image if it exists, embed if given, else the honest
// placeholder. A missing asset degrades — it never renders as a broken box.
function renderMedia(m, title, source) {
  if (m && m.embed) {
    return `<iframe src="${esc(m.embed)}" title="${esc(title)}" allowfullscreen loading="lazy"></iframe>`;
  }
  if (m && m.video) {
    if (assetExists(m.video)) {
      const poster = m.poster && assetExists(m.poster) ? ` poster="${esc(m.poster)}"` : '';
      return `<video autoplay muted loop playsinline${poster}>
            <source src="${esc(m.video)}" type="video/mp4">
          </video>`;
    }
    warn(`media not found: ${m.video} (${source}) — placeholder shown instead`);
  }
  if (m && m.image) {
    if (assetExists(m.image)) {
      return `<img src="${esc(m.image)}" alt="${esc(m.alt || title)}" loading="lazy">`;
    }
    warn(`media not found: ${m.image} (${source}) — placeholder shown instead`);
  }
  const note = (m && m.placeholder) || 'Capture coming soon';
  return `<div class="media-empty">
            <b>${esc(title)}</b><br>
            ${esc(note)}
          </div>`;
}

// Fixed five-tag discipline vocabulary, shared between projects.json and
// experience.json — visually distinct from the free-text tech tags so a
// reader scanning either page finds the same labels. See MAINTENANCE.md.
function renderDisciplineTags(discipline) {
  if (!discipline || !discipline.length) return '';
  const tags = discipline.map((t) => `<span class="disc-tag">${esc(t)}</span>`).join('');
  return `<div class="disc-tags">${tags}</div>`;
}

function renderProject(p) {
  const metrics = (p.metrics || []).map((m) =>
    `            <div class="metric">${esc(m.value)} <em>${esc(m.context)}</em></div>`).join('\n');
  const tags = (p.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join('');
  const links = (p.links || []).map(renderButton).join('\n            ');

  const blocks = [
    metrics ? `          <div class="metrics">\n${metrics}\n          </div>` : '',
    tags ? `          <div class="tags">${tags}</div>` : '',
    links ? `          <div class="project-links">\n            ${links}\n          </div>` : ''
  ].filter(Boolean).join('\n');

  return `      <article class="project" id="${esc(p.slug)}">
        <div class="media">
          ${renderMedia(p.media, p.title, `projects.json → ${p.slug}`)}
        </div>

        <div class="project-body">
          <div class="project-head">
            <h2>${esc(p.title)}</h2>
            <div class="project-meta">${esc(p.meta)}</div>
          </div>
          ${renderDisciplineTags(p.discipline)}
          ${p.role ? `<div class="project-role">${esc(p.role)}</div>` : ''}

          <div class="block">
            <div class="block-label">Problem</div>
            <p>${p.problem_html || ''}</p>
          </div>
          <div class="block">
            <div class="block-label">Approach</div>
            <p>${p.approach_html || ''}</p>
          </div>
          <div class="block">
            <div class="block-label">Result</div>
            <p>${p.result_html || ''}</p>
          </div>

${blocks}
        </div>
      </article>`;
}

// href points at the source page's anchor — /work/#slug for a project,
// /experience/#slug for a case study — so a teaser card works for either.
function renderTeaser(item, href) {
  const hook = item.hook ? `\n          <p class="teaser-line">${esc(item.hook)}</p>` : '';
  return `        <a class="teaser" href="${esc(href)}">
          <div class="teaser-title">${esc(item.title)}</div>
          <div class="teaser-meta">${esc(item.meta)}</div>${hook}
          ${renderDisciplineTags(item.discipline)}
        </a>`;
}

// Key art if the file is on disk, else a typographic panel on the same hatch
// background renderMedia uses — a half-populated grid still reads as deliberate
// rather than broken. Covers are public store art only; see media/README.md.
function renderGameCover(g) {
  if (g.cover && g.cover.image) {
    if (assetExists(g.cover.image)) {
      return `<img src="${esc(g.cover.image)}" alt="${esc(g.cover.alt || g.title)}" loading="lazy">`;
    }
    warn(`cover not found: ${g.cover.image} (games.json → ${g.slug}) — title panel shown instead`);
  }
  return `<div class="game-cover-fallback">${esc(g.title)}</div>`;
}

// A tile links out only when the game has a case study behind it. The rest are
// credits, not promises of a page that does not exist.
function renderGame(g) {
  const inner = `<div class="game-cover">${renderGameCover(g)}</div>
          <div class="game-body">
            <div class="game-title">${esc(g.title)}</div>
            <div class="game-meta">${esc(g.meta)}</div>
            <div class="game-role">${esc(g.role)}</div>
            ${renderDisciplineTags(g.discipline)}
          </div>`;
  return g.href
    ? `        <a class="game game-link" href="${esc(g.href)}">
          ${inner}
        </a>`
    : `        <div class="game">
          ${inner}
        </div>`;
}

function renderCase(c) {
  const paras = (c.paragraphs_html || []).map((t) => `        <p>${t}</p>`).join('\n');
  // Cross-reference to the titles named in the home grid. Deliberately absent
  // on a case whose title is embargoed — the field is optional for that reason.
  const titles = (c.titles || []).length
    ? `\n        <div class="case-titles">Titles: ${c.titles.map(esc).join(' · ')}</div>` : '';
  // Links are buttons, not media — the no-media rule on this page still holds.
  const links = (c.links || []).map(renderButton).join('\n          ');
  const linkRow = links ? `\n        <div class="case-links">\n          ${links}\n        </div>` : '';
  return `      <div class="case" id="${esc(c.slug)}">
        <h2>${esc(c.title)}</h2>
        <div class="case-meta">${esc(c.meta)}</div>${titles}
        ${renderDisciplineTags(c.discipline)}
${paras}${linkRow}
      </div>`;
}

function renderSkillCol(col) {
  const items = (col.items || []).map((i) => `            <li>${esc(i)}</li>`).join('\n');
  return `        <div class="skill-col">
          <h3>${esc(col.heading)}</h3>
          <ul>
${items}
          </ul>
        </div>`;
}

function renderStats(stats) {
  const cells = (stats || []).map((s) => {
    const num = s.dotSplit
      ? esc(s.num).replace('·', '<span class="dot">·</span>')
      : esc(s.num);
    return `        <div class="stat">
          <div class="stat-num">${num}</div>
          <div class="stat-lbl">${esc(s.lbl)}</div>
        </div>`;
  }).join('\n');
  return `      <div class="stat-row">\n${cells}\n      </div>`;
}

/* ---------- page bodies ---------- */

// A teaser item names its source page ("projects" or "experience") and a
// slug within it, so home.json can hand-curate the mix without duplicating
// case-study or project content.
const TEASER_SOURCES = {
  projects: { file: 'projects.json', field: 'projects', base: '/work/' },
  experience: { file: 'experience.json', field: 'cases', base: '/experience/' }
};

function renderHome(c, ctx) {
  const { site, projects, experience, games } = ctx;
  const pools = { projects, experience };

  const hasResume = assetExists(site.resume.href);
  if (!hasResume) {
    warn(`missing ${site.resume.href} (site.json → resume) — the Résumé button is omitted until the file exists`);
  }

  const heroLinks = [
    { ...c.hero.cta, primary: true },
    ...site.social,
    hasResume ? site.resume : null
  ].filter(Boolean);

  const teasers = (c.teaser.items || []).map(({ source, slug }) => {
    const spec = TEASER_SOURCES[source];
    const item = (pools[source][spec.field] || []).find((x) => x.slug === slug);
    if (!item) { warn(`home.json → teaser.items references missing "${slug}" in ${spec.file}`); return ''; }
    if (item.draft) { warn(`home.json → teaser.items references draft "${slug}" in ${spec.file}`); return ''; }
    return renderTeaser(item, `${spec.base}#${slug}`);
  }).filter(Boolean).join('\n');

  const currently = c.hero.currently_html
    ? `\n      <p class="hero-currently">${c.hero.currently_html}</p>` : '';

  return `  <header class="hero">
    <div class="wrap">
      <h1 class="hero-name">${esc(c.hero.name)}</h1>
      <div class="hero-role">
        ${c.hero.role.map(esc).join('<span class="sep">/</span>')}
      </div>
      <p class="hero-pitch">${c.hero.pitch_html}</p>${currently}

${renderStats(c.stats)}

      <div class="links">
        ${heroLinks.map(renderButton).join('\n        ')}
      </div>
    </div>
  </header>

  <section id="games">
    <div class="wrap">
      <div class="eyebrow">${esc(games.eyebrow)}</div>
      <h2>${esc(games.heading)}</h2>
      <p class="section-note">${games.intro_html}</p>

      <div class="game-grid">
${published(games.games, 'games.json').map(renderGame).join('\n')}
      </div>${games.note_html ? `\n      <p class="games-note">${games.note_html}</p>` : ''}
    </div>
  </section>

  <section id="work-teaser">
    <div class="wrap">
      <div class="eyebrow">${esc(c.teaser.eyebrow)}</div>
      <h2>${esc(c.teaser.heading)}</h2>
      <p class="section-note">${c.teaser.intro_html}</p>

      <div class="teaser-grid">
${teasers}
      </div>
      <div class="links">${renderButton({ ...c.teaser.cta, primary: true })}</div>
    </div>
  </section>`;
}

function renderWork(c) {
  const list = published(c.projects, 'projects.json');
  if (list.length > MAX_PROJECTS) {
    warn(`${list.length} published projects — the rule is ${MAX_PROJECTS} maximum, best first. Set "draft": true on the weakest.`);
  }
  return `${renderPageHead(c)}

  <section>
    <div class="wrap">
${list.map(renderProject).join('\n\n')}
    </div>
  </section>`;
}

function renderExperience(c) {
  const alsoShipped = c.also_shipped_html
    ? `\n\n      <p class="also-shipped">${c.also_shipped_html}</p>` : '';
  return `${renderPageHead(c)}

  <section>
    <div class="wrap">
${published(c.cases, 'experience.json').map(renderCase).join('\n\n')}${alsoShipped}
    </div>
  </section>`;
}

function renderAbout(c, ctx) {
  const { site } = ctx;
  const t = c.toolset;
  const contactLinks = [
    { label: site.email, href: `mailto:${site.email}`, primary: true },
    ...site.social
  ];

  return `${renderPageHead(c)}

  <section id="argument">
    <div class="wrap">
      ${c.argument_html.map((p) => `<p class="lede">${p}</p>`).join('\n      ')}
    </div>
  </section>

  <section id="toolset">
    <div class="wrap">
      <div class="eyebrow">${esc(t.eyebrow)}</div>
      <h2>${esc(t.heading)}</h2>
      <p class="section-note">${t.intro_html}</p>

      <div class="skill-grid">
${published(t.columns, 'about.json → toolset').map(renderSkillCol).join('\n')}
      </div>
    </div>
  </section>

  <section id="contact">
    <div class="wrap">
      <div class="contact-box">
        <h2>${esc(c.contact.heading)}</h2>
        <p>${c.contact.body_html}</p>
        <div class="links">
          ${contactLinks.map(renderButton).join('\n          ')}
        </div>
      </div>
    </div>
  </section>`;
}

function render404(c, ctx) {
  const links = ctx.site.nav
    .map((n) => renderButton({ label: n.label, href: n.path, primary: n.path === '/' }))
    .join('\n        ');
  return `  <div class="page-head">
    <div class="wrap">
      <div class="eyebrow">404</div>
      <h1>That page doesn't exist</h1>
      <p class="section-note">The link may be out of date. Everything is one click away:</p>
      <div class="links">
        ${links}
      </div>
    </div>
  </div>`;
}

/* ---------- JSON-LD (home page only) ---------- */

function renderJSONLD(site) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: site.fullName,
    alternateName: site.name,
    url: site.origin + '/',
    jobTitle: site.jsonld.jobTitle,
    email: `mailto:${site.email}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: site.location,
      addressCountry: 'MX'
    },
    knowsLanguage: site.jsonld.knowsLanguage,
    sameAs: site.social.map((s) => s.href),
    knowsAbout: site.jsonld.knowsAbout
  };
  // This is JSON inside <script>, not HTML. Escaping < is what stops a value
  // from closing the tag early; running esc() over it would corrupt the JSON.
  const json = JSON.stringify(data, null, 2).replace(/</g, '\\u003c');
  return `\n<script type="application/ld+json">\n${json}\n</script>`;
}

/* ============================================================
   PAGES — add one line here to add a page.
   ============================================================ */

const PAGES = [
  { content: 'home.json', out: 'index.html', render: renderHome, jsonld: true },
  { content: 'projects.json', out: 'work/index.html', render: renderWork },
  { content: 'experience.json', out: 'experience/index.html', render: renderExperience },
  { content: 'about.json', out: 'about/index.html', render: renderAbout },
  {
    content: 'home.json',
    out: '404.html',
    render: render404,
    page: { id: '404', path: '/404.html', title: 'Page not found', description: 'That page does not exist.' }
  }
];

/* ---------- assembly ---------- */

function buildPage(spec, site, shell, ctx) {
  const content = readJSON(spec.content);
  const page = spec.page || content.page;

  const url = site.origin + page.path;
  const title = page.titleIsFull ? page.title : `${page.title} — ${site.name}`;
  const desc = page.description || site.defaultDescription;

  const vars = {
    TITLE: esc(title),
    OG_TITLE: esc(title),
    DESCRIPTION: esc(desc),
    CANONICAL: esc(url),
    OG_IMAGE: esc(site.origin + site.ogImage),
    THEME_COLOR: esc(site.themeColor),
    PAGE_ID: esc(page.id),
    NAV_MARK: renderNavMark(site, page),
    NAV: renderNav(site, page),
    MAIN: spec.render(content, { ...ctx, site }),
    FOOTER_LEFT: esc(site.footer.left),
    FOOTER_RIGHT: esc(site.footer.right),
    JSONLD: spec.jsonld ? renderJSONLD(site) : ''
  };

  // Single pass with a replacer, so a value containing {{ is never re-scanned.
  const html = shell.replace(/\{\{([A-Z_]+)\}\}/g, (m, key) => {
    if (!(key in vars)) {
      warn(`unknown token ${m} in templates/base.html`);
      return '';
    }
    return vars[key];
  });

  return { html, path: page.path, out: spec.out };
}

// One check catches missing media, the missing résumé and every path typo.
function checkInternalLinks(pages) {
  const known = new Set(pages.map((p) => p.path));
  for (const p of pages) {
    const refs = [...p.html.matchAll(/(?:href|src)="(\/[^"#?]*)/g)].map((m) => m[1]);
    for (const ref of new Set(refs)) {
      if (known.has(ref) || assetExists(ref)) continue;
      warn(`broken internal link "${ref}" on ${p.out}`);
    }
  }
}

function build() {
  warnings.length = 0;
  const site = readJSON('site.json');

  if (site.origin.endsWith('/')) {
    throw new Error('content/site.json → "origin" must not end with a slash (use "https://example.com").');
  }

  if (!assetExists(site.ogImage)) {
    warn(`missing ${site.ogImage} (site.json → ogImage) — shared links will preview as a bare text stub on LinkedIn, X, Slack and Discord`);
  }

  const shell = fs.readFileSync(path.join(TEMPLATES, 'base.html'), 'utf8');
  const ctx = {
    projects: readJSON('projects.json'),
    experience: readJSON('experience.json'),
    games: readJSON('games.json')
  };

  const built = PAGES.map((spec) => buildPage(spec, site, shell, ctx));
  checkInternalLinks(built);

  for (const p of built) {
    const dest = path.join(ROOT, p.out);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, p.html, 'utf8'); // always utf8, never shell redirection
  }

  return { built, warnings: warnings.slice() };
}

/* ---------- entry point ---------- */

function main() {
  let result;
  try {
    result = build();
  } catch (e) {
    console.error(`\n  BUILD FAILED\n  ${e.message}\n`);
    process.exit(1);
  }

  console.log(`\n  built ${result.built.length} pages:`);
  for (const p of result.built) console.log(`    ${p.out}`);

  if (result.warnings.length) {
    console.log(`\n  warnings (${result.warnings.length}):`);
    for (const w of result.warnings) console.log(`    · ${w}`);
    console.log('\n  Warnings are informational — the site still builds and works.');
  } else {
    console.log('\n  no warnings.');
  }
  console.log('');
}

if (require.main === module) main();
module.exports = { build };
