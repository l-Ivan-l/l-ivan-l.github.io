#!/usr/bin/env node
/* ============================================================
   Local preview server. Run:  npm run dev

   Builds the site, serves it at http://localhost:8000, and
   rebuilds whenever a file in content/ or templates/ is saved.
   Refresh the browser to see changes.

   You never need to read or edit this file — it is convenience
   only. The site itself is built by build.js.
   ============================================================ */

'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const BUILD = require.resolve('./build.js');

const ROOT = __dirname;
const PORT = 8000;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.pdf': 'application/pdf',
  '.woff2': 'font/woff2'
};

// build.js is re-required on every rebuild, not captured once at startup.
// Node caches modules, so a long-running server would otherwise keep generating
// pages from whatever build.js looked like when it was launched — quietly
// writing stale HTML over good output every time a content file was saved.
function rebuild(label) {
  try {
    delete require.cache[BUILD];
    const { warnings } = require('./build.js').build();
    const note = warnings.length ? ` (${warnings.length} warning${warnings.length > 1 ? 's' : ''})` : '';
    console.log(`  ${label} — rebuilt${note}`);
  } catch (e) {
    console.error(`\n  BUILD FAILED\n  ${e.message}\n`);
  }
}

rebuild('start');

http.createServer((req, res) => {
  // Strip the query string, then map a directory URL to its index.html.
  let rel = decodeURIComponent(req.url.split('?')[0]);
  if (rel.endsWith('/')) rel += 'index.html';

  const file = path.join(ROOT, rel);

  // Never serve anything outside the repo.
  if (!file.startsWith(ROOT)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  fs.readFile(file, (err, data) => {
    if (err) {
      // Mirror GitHub Pages: unknown paths get 404.html.
      fs.readFile(path.join(ROOT, '404.html'), (e2, page) => {
        res.writeHead(404, { 'Content-Type': TYPES['.html'] });
        res.end(e2 ? 'Not found' : page);
      });
      return;
    }
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log(`\n  serving  http://localhost:${PORT}`);
  console.log('  watching content/, templates/ and build.js — Ctrl+C to stop\n');
});

// Debounced, because editors fire several change events per save.
let timer = null;
const queue = (label) => {
  clearTimeout(timer);
  timer = setTimeout(() => rebuild(label), 120);
};

for (const dir of ['content', 'templates']) {
  fs.watch(path.join(ROOT, dir), { recursive: true }, (_, filename) => {
    queue(`${dir}/${filename}`);
  });
}

// Watch the repo root rather than the file itself: editors that save by writing
// a temp file and renaming it over the original break a single-file watch.
// Filtered to build.js, so the pages the build writes here can't retrigger it.
fs.watch(ROOT, (_, filename) => {
  if (filename === 'build.js') queue('build.js');
});
