#!/usr/bin/env node
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const node = process.execPath;
const jobs = [
  { name: 'Course coverage scout', command: node, args: ['scripts/team/course-coverage.mjs'] },
  { name: 'Bilingual lesson integrity', command: node, args: ['scripts/team/lesson-integrity.mjs'] },
  { name: 'Sections and responsive system', command: node, args: ['scripts/team/section-system.mjs'] },
  { name: 'Arcade systems auditor', command: node, args: ['scripts/team/arcade-system.mjs'] },
  { name: 'Book asset auditor', command: 'npm', args: ['run', 'materials:check'] },
  { name: 'Quality and content QA', command: 'npm', args: ['run', 'quality:check'] },
  { name: 'Production build', command: 'npm', args: ['run', 'build'] },
  { name: 'Diff hygiene', command: 'git', args: ['diff', '--check'] },
];

function run(job) {
  return new Promise(resolve => {
    const child = spawn(job.command, job.args, { cwd: root, env: process.env, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8').on('data', chunk => { stdout += chunk; });
    child.stderr.setEncoding('utf8').on('data', chunk => { stderr += chunk; });
    child.on('error', error => resolve({ ...job, code: 1, stdout, stderr: `${stderr}${error.message}` }));
    child.on('close', code => resolve({ ...job, code: code ?? 1, stdout, stderr }));
  });
}

console.log(`Free local project team · ${jobs.length} specialists running independent checks in parallel.\n`);
const results = await Promise.all(jobs.map(run));
for (const result of results) {
  console.log(`\n=== ${result.code === 0 ? 'PASS' : 'FAIL'} · ${result.name} ===`);
  if (result.stdout.trim()) console.log(result.stdout.trimEnd());
  if (result.stderr.trim()) console.log(result.stderr.trimEnd());
}
const failed = results.filter(result => result.code !== 0);
const coverage = results.find(result => result.name === 'Course coverage scout');
const blockers = coverage?.stdout.match(/^\s*BLOCKER.*$/gmu) || [];
console.log('\n=== Team summary ===');
console.log(`${jobs.length - failed.length}/${jobs.length} checks completed successfully.`);
if (blockers.length) {
  console.log(`Roadmap blockers (reported, not fabricated as passed): ${blockers.join(' | ')}`);
}
if (failed.length) {
  console.error(`Failed specialists: ${failed.map(result => result.name).join(', ')}`);
  process.exitCode = 1;
} else {
  console.log('No-cost automation passed. Coverage gaps above still need verified source materials before those levels can be authored.');
}
