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

test('mock UI uses Japanese copy while preserving evaluation labels', () => {
  const app = readFileSync(join(mockRoot, 'app.js'), 'utf8');
  const session = readFileSync(join(mockRoot, 'session.js'), 'utf8');
  const manifest = JSON.parse(readFileSync(join(mockRoot, 'manifest.webmanifest'), 'utf8'));

  for (const copy of ['トレーニング', '問題', '次へ', 'セッション完了', '復習', 'フォールド', 'チェック', 'コール', 'ベット', 'レイズ']) {
    assert.match(`${app}\n${session}`, new RegExp(copy, 'u'));
  }
  for (const label of ['BEST', 'GOOD', 'MISTAKE']) assert.match(app, new RegExp(label, 'u'));
  assert.equal(manifest.name, 'GTOトレーナー');
  assert.equal(manifest.short_name, 'GTOトレーナー');
  assert.equal(manifest.lang, 'ja');
});
