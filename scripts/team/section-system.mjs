#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const app = await readFile(new URL('../../src/App.jsx', import.meta.url), 'utf8');
const styles = await readFile(new URL('../../src/styles.css', import.meta.url), 'utf8');
let checks = 0;
const check = (condition, message) => { checks += 1; assert.ok(condition, message); };
const block = (source, start, end) => {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from + start.length);
  check(from >= 0 && to > from, `Could not find code section: ${start}`);
  return source.slice(from, to);
};

const navSource = block(app, 'const navGroups = [', 'const mobileNavItems = [');
const mobileSource = block(app, 'const mobileNavItems = [', 'function readSaved()');
const routerSource = block(app, '  function page() {', '  const sidebarProps =');
const navIds = [...navSource.matchAll(/id:\s*'([^']+)'/gu)].map(match => match[1]);
const mobileIds = [...mobileSource.matchAll(/id:\s*'([^']+)'/gu)].map(match => match[1]);
const routedIds = new Set([...routerSource.matchAll(/active\s*===\s*'([^']+)'/gu)].map(match => match[1]));
const uniqueNavIds = [...new Set(navIds)];

for (const id of uniqueNavIds) {
  if (id === 'home') continue; // Home is the router's intentional fallback.
  check(routedIds.has(id), `Navigation section "${id}" has no corresponding page route`);
}
for (const id of mobileIds) check(uniqueNavIds.includes(id), `Mobile shortcut "${id}" is absent from the main navigation`);
check(app.includes("if (active === 'profile') return <ProfilePage"), 'Profile entry must resolve to a profile screen');
check(/dir="rtl"/u.test(app) && /dir="ltr"/u.test(app), 'App must explicitly isolate both Arabic RTL and Spanish LTR content');
const breakpoints = [...styles.matchAll(/@media\s*\(max-width:\s*(\d+)px\)/gu)].map(match => Number(match[1]));
check(breakpoints.some(width => width <= 760), 'Styles need a tablet/mobile responsive breakpoint');
check(breakpoints.some(width => width <= 420), 'Styles need a narrow-phone breakpoint');

console.log(`Section system passed: ${checks} checks · ${uniqueNavIds.length} main sections · ${mobileIds.length} mobile shortcuts · responsive breakpoints ${[...new Set(breakpoints)].sort((a, b) => b - a).map(width => `${width}px`).join(', ')}`);
