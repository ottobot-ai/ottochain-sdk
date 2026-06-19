#!/usr/bin/env node
/**
 * Standalone runner for the std-app regression lint (src/schema/guard-lint.ts).
 *
 * Imports every OttoChain std-app FiberAppDefinition (directly from the TypeScript
 * sources, via tsx — no build step needed) and prints all lint violations grouped
 * by app, exiting non-zero if ANY violation has severity `error`.
 *
 * Usage:
 *   node scripts/lint-apps.mjs           # re-execs itself under tsx automatically
 *   npx tsx scripts/lint-apps.mjs        # equivalent
 *   node scripts/lint-apps.mjs --warn-as-error   # also fail on warnings
 *
 * This is intentionally NOT wired into the build (defineFiberApp/toProtoDefinition):
 * the lint is a regression gate, not a hard build dependency, so apps can be
 * remediated incrementally without bricking every consumer's build.
 */

import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// Bootstrap: this is an .mjs file but it imports TypeScript. If we are NOT
// already running under tsx (which installs a TS-aware ESM loader), re-exec
// ourselves through tsx so `node scripts/lint-apps.mjs` "just works".
// ---------------------------------------------------------------------------
function runningUnderTsx() {
  // tsx sets this; also covers the case where the file was imported by tsx.
  return (
    process.env.__LINT_APPS_TSX === '1' ||
    !!process.env.TSX ||
    (process.execArgv || []).some((a) => a.includes('tsx')) ||
    !!globalThis.__tsx
  );
}

if (!runningUnderTsx()) {
  const res = spawnSync(
    'npx',
    ['tsx', __filename, ...process.argv.slice(2)],
    {
      stdio: 'inherit',
      cwd: REPO_ROOT,
      env: { ...process.env, __LINT_APPS_TSX: '1' },
    },
  );
  process.exit(res.status ?? 1);
}

// ---------------------------------------------------------------------------
// Under tsx from here on — TS imports are resolvable.
// ---------------------------------------------------------------------------
const { lintFiberApp } = await import(
  pathToFileURL(resolve(REPO_ROOT, 'src/schema/guard-lint.ts')).href
);
const apps = await import(
  pathToFileURL(resolve(REPO_ROOT, 'src/apps/index.ts')).href
);

const WARN_AS_ERROR = process.argv.includes('--warn-as-error');

const APP_GROUPS = [
  'identity',
  'contracts',
  'markets',
  'governance',
  'corporate',
  'lending',
];

/** Collect every FiberAppDefinition from the app namespaces' *_DEFINITIONS maps. */
function collectDefinitions() {
  const defs = [];
  for (const g of APP_GROUPS) {
    const ns = apps[g];
    if (!ns) continue;
    const defsKey = Object.keys(ns).find((k) => k.endsWith('_DEFINITIONS'));
    const map = defsKey ? ns[defsKey] : {};
    for (const [key, def] of Object.entries(map)) {
      if (def && typeof def === 'object' && Array.isArray(def.transitions)) {
        const label =
          def.metadata && def.metadata.app && def.metadata.type
            ? `${def.metadata.app}/${def.metadata.type}`
            : `${g}.${key}`;
        defs.push({ label, def });
      }
    }
  }
  return defs;
}

const RED = (s) => `\x1b[31m${s}\x1b[0m`;
const YELLOW = (s) => `\x1b[33m${s}\x1b[0m`;
const GREEN = (s) => `\x1b[32m${s}\x1b[0m`;
const DIM = (s) => `\x1b[2m${s}\x1b[0m`;
const BOLD = (s) => `\x1b[1m${s}\x1b[0m`;

function main() {
  const defs = collectDefinitions();
  defs.sort((a, b) => a.label.localeCompare(b.label));

  let totalErrors = 0;
  let totalWarns = 0;
  const perApp = []; // { label, errors, warns, byCode }
  const codeTotals = new Map();

  console.log(BOLD(`\nOttoChain std-app regression lint — ${defs.length} definitions\n`));

  for (const { label, def } of defs) {
    const violations = lintFiberApp(def);
    const errs = violations.filter((v) => v.severity === 'error');
    const warns = violations.filter((v) => v.severity === 'warn');
    totalErrors += errs.length;
    totalWarns += warns.length;

    const byCode = new Map();
    for (const v of violations) {
      byCode.set(v.code, (byCode.get(v.code) ?? 0) + 1);
      codeTotals.set(v.code, (codeTotals.get(v.code) ?? 0) + 1);
    }
    perApp.push({ label, errors: errs.length, warns: warns.length, byCode });

    if (violations.length === 0) {
      console.log(`${GREEN('  ok ')} ${label}  ${DIM('(0)')}`);
      continue;
    }

    const head =
      `${errs.length ? RED(`${errs.length} error`) : ''}` +
      `${errs.length && warns.length ? ', ' : ''}` +
      `${warns.length ? YELLOW(`${warns.length} warn`) : ''}`;
    console.log(`${RED(' FAIL')} ${BOLD(label)}  (${head})`);
    for (const v of violations) {
      const sev = v.severity === 'error' ? RED('error') : YELLOW(' warn');
      console.log(
        `       ${sev} ${DIM(`[${v.code}]`)} ${DIM(v.transition ?? '')}\n` +
          `             ${v.path}\n` +
          `             ${v.message}`,
      );
    }
  }

  // -------------------------------------------------------------------------
  // Summary: violation counts per app (the audit cross-check).
  // -------------------------------------------------------------------------
  console.log(BOLD('\n=== Violation summary (per app) ===\n'));
  const withViolations = perApp.filter((a) => a.errors + a.warns > 0);
  const pad = Math.max(4, ...withViolations.map((a) => a.label.length));
  if (withViolations.length === 0) {
    console.log(GREEN('  All apps clean — no violations.'));
  } else {
    console.log(
      `  ${'APP'.padEnd(pad)}  ${'ERR'.padStart(4)}  ${'WARN'.padStart(4)}  CODES`,
    );
    for (const a of withViolations.sort(
      (x, y) => y.errors - x.errors || y.warns - x.warns,
    )) {
      const codeStr = [...a.byCode.entries()]
        .map(([c, n]) => `${c}×${n}`)
        .join(', ');
      console.log(
        `  ${a.label.padEnd(pad)}  ${String(a.errors).padStart(4)}  ${String(
          a.warns,
        ).padStart(4)}  ${DIM(codeStr)}`,
      );
    }
  }

  console.log(BOLD('\n=== Totals by rule ===\n'));
  for (const [code, n] of [...codeTotals.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${code.padEnd(24)} ${String(n).padStart(4)}`);
  }

  console.log(
    BOLD(
      `\nTotal: ${totalErrors ? RED(`${totalErrors} errors`) : GREEN('0 errors')}, ` +
        `${totalWarns ? YELLOW(`${totalWarns} warnings`) : '0 warnings'} ` +
        `across ${defs.length} apps.\n`,
    ),
  );

  const failed = totalErrors > 0 || (WARN_AS_ERROR && totalWarns > 0);
  process.exit(failed ? 1 : 0);
}

main();
