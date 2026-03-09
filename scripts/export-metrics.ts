/**
 * プロジェクトメトリクスを自動抽出して docs/metrics.json に出力する
 *
 * 使い方: npm run metrics
 *
 * 出力例:
 * {
 *   "loc": 58000,
 *   "locBreakdown": { "ts": 30000, "tsx": 25000, "css": 3000 },
 *   "features": 45,
 *   "apiRoutes": 47,
 *   "components": 120,
 *   "pages": 25,
 *   "commits": 312,
 *   "testFiles": 30,
 *   "scripts": 37,
 *   "version": "3.2.0",
 *   "updatedAt": "2026-03-10"
 * }
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '..');

function run(cmd: string): string {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }).trim();
  } catch {
    return '';
  }
}

function countLines(glob: string): number {
  const result = run(
    `find . -name "${glob}" -not -path "*/node_modules/*" -not -path "*/.next/*" -not -path "*/dist/*" | xargs wc -l 2>/dev/null | tail -1`,
  );
  const match = result.match(/(\d+)\s+total/);
  if (match) return parseInt(match[1], 10);
  // 単一ファイルの場合
  const single = result.match(/^\s*(\d+)/);
  return single ? parseInt(single[1], 10) : 0;
}

function countFiles(pattern: string): number {
  const result = run(
    `find . -name "${pattern}" -not -path "*/node_modules/*" -not -path "*/.next/*" | wc -l`,
  );
  return parseInt(result.trim(), 10) || 0;
}

function countDirs(dir: string): number {
  const fullPath = path.join(ROOT, dir);
  if (!fs.existsSync(fullPath)) return 0;
  const result = run(`find ${dir} -mindepth 1 -maxdepth 1 -type d | wc -l`);
  return parseInt(result.trim(), 10) || 0;
}

function countApiRoutes(): number {
  const result = run(
    `find app/api -name "route.ts" -o -name "route.tsx" 2>/dev/null | wc -l`,
  );
  return parseInt(result.trim(), 10) || 0;
}

function countPages(): number {
  const result = run(
    `find app -name "page.tsx" -not -path "*/api/*" 2>/dev/null | wc -l`,
  );
  return parseInt(result.trim(), 10) || 0;
}

function countComponents(): number {
  const result = run(`find components -name "*.tsx" 2>/dev/null | wc -l`);
  return parseInt(result.trim(), 10) || 0;
}

function countCompletedFeatures(): number {
  const taskFile = path.join(ROOT, 'docs', '04-task-breakdown.md');
  if (!fs.existsSync(taskFile)) return 0;
  const content = fs.readFileSync(taskFile, 'utf-8');
  const checked = content.match(/- \[x\]/gi);
  return checked ? checked.length : 0;
}

function countCommits(): number {
  const result = run('git rev-list --count HEAD 2>/dev/null');
  return parseInt(result, 10) || 0;
}

function getVersion(): string {
  const pkgPath = path.join(ROOT, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  return pkg.version || '0.0.0';
}

function main() {
  console.log('Exporting project metrics...');

  const tsLines = countLines('*.ts');
  const tsxLines = countLines('*.tsx');
  const cssLines = countLines('*.css');
  const totalLoc = tsLines + tsxLines + cssLines;

  const metrics = {
    loc: totalLoc,
    locBreakdown: {
      ts: tsLines,
      tsx: tsxLines,
      css: cssLines,
    },
    features: countCompletedFeatures(),
    apiRoutes: countApiRoutes(),
    pages: countPages(),
    components: countComponents(),
    commits: countCommits(),
    testFiles: countFiles('*.test.ts') + countFiles('*.test.tsx'),
    scripts: countFiles('*.ts') + countFiles('*.mjs') - countFiles('*.test.ts') - countFiles('*.test.tsx'),
    version: getVersion(),
    updatedAt: new Date().toISOString().slice(0, 10),
  };

  // scripts カウントは scripts/ ディレクトリのみに限定
  const scriptsCount = run('find scripts -type f 2>/dev/null | wc -l');
  metrics.scripts = parseInt(scriptsCount.trim(), 10) || 0;

  const outputPath = path.join(ROOT, 'docs', 'metrics.json');
  fs.writeFileSync(outputPath, JSON.stringify(metrics, null, 2) + '\n', 'utf-8');

  console.log(`Metrics written to docs/metrics.json:`);
  console.log(JSON.stringify(metrics, null, 2));
}

main();
