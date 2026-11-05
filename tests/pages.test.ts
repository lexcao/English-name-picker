import { test } from 'node:test';
import assert from 'node:assert/strict';
// @ts-ignore plain ESM build script
import { pages, render, sitemap, ORIGIN, YEAR_FROM } from '../scripts/build-pages.mjs';
const meta = { years: [1880, 1952], url: 'https://www.ssa.gov/' };
const row = (name: string, rank: number) => ({ name, gender: 'female', occurrences: 1000 - rank, rank });
const load = (y: number, s: string) => [row(s === 'male' ? 'Adam' : 'Anna', 1), row('Bea', 2), row(`Q${y}`, 3)];
test('generates girls, boys, A–Z, every year and the hub', () => {
  const all = pages(load, meta);
  assert.equal(all.length, 2 + 26 + (1952 - YEAR_FROM + 1) + 1);
  assert.ok(all.some((p: any) => p.path === 'names/year/1950/'));
});
test('pages use only SSA rows and absolute canonical', () => {
  const all = pages(load, meta), p = all.find((x: any) => x.path === 'names/year/1951/');
  const html = render(p, all, meta);
  assert.match(html, /<link rel="canonical" href="https:\/\/lexcao\.io\/English-name-picker\/names\/year\/1951\/">/);
  assert.match(html, /hreflang="zh"/); assert.match(html, /Q1951/); assert.match(html, /href="..\/..\/..\/#\/choose"/);
});
test('sitemap lists the tool root and every page', () => {
  const all = pages(load, meta), xml = sitemap(all);
  assert.equal(xml.match(/<loc>/g)!.length, all.length + 1);
  assert.ok(xml.includes(`<loc>${ORIGIN}</loc>`));
});
