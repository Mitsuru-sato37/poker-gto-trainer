import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const mockRoot = join(process.cwd(), 'mock');

test('PWA manifest defines an installable standalone app shell', () => {
  const manifest = JSON.parse(readFileSync(join(mockRoot, 'manifest.webmanifest'), 'utf8'));
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.start_url, './');
  assert.equal(manifest.icons.length, 2);
  assert.ok(manifest.icons.every((icon: { src: string }) => readFileSync(join(mockRoot, icon.src.replace('./', '')), 'utf8').includes('<svg')));
});

test('PWA service worker caches the complete browser shell', () => {
  const serviceWorker = readFileSync(join(mockRoot, 'sw.js'), 'utf8');
  for (const asset of ['./index.html', './styles.css', './app.js', './session.js', './history.js', './data/problems.js', './data/production.js']) {
    assert.match(serviceWorker, new RegExp(asset.replaceAll('.', '\\.'), 'u'));
  }
  assert.match(serviceWorker, /skipWaiting/);
  assert.match(serviceWorker, /clients\.claim/);
});
