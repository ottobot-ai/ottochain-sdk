#!/usr/bin/env node
/**
 * Emit the std-apps genesis manifest.
 *
 * Imports the built SDK (dist/esm) and writes the manifest the ottochain
 * metagraph consumes to pre-register the standard packages at genesis.
 *
 * The manifest ships CONTENT only (schemaShape + JSON-Logic definition); the
 * chain derives schemaHash/logicHash itself. See src/ottochain/genesis-manifest.ts.
 *
 * Usage:
 *   node scripts/emit-genesis-manifest.mjs            # write to stdout
 *   node scripts/emit-genesis-manifest.mjs <out-path> # write to a file
 *
 * Requires a prior build (`pnpm run build`) so dist/esm exists. Invoked via the
 * `genesis:manifest` npm script, which builds first.
 */

import { writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distEntry = resolve(__dirname, '..', 'dist', 'esm', 'index.js');

if (!existsSync(distEntry)) {
  console.error(
    `[emit-genesis-manifest] built SDK not found at ${distEntry}\n` +
      `Run \`pnpm run build\` first (the \`genesis:manifest\` npm script does this for you).`,
  );
  process.exit(1);
}

const { buildGenesisManifest } = await import(pathToFileURL(distEntry).href);

const manifest = buildGenesisManifest();
const json = JSON.stringify(manifest, null, 2) + '\n';

const outArg = process.argv[2];
if (outArg) {
  const outPath = resolve(process.cwd(), outArg);
  writeFileSync(outPath, json);
  console.error(
    `[emit-genesis-manifest] wrote ${manifest.packages.length} package(s) to ${outPath}`,
  );
} else {
  process.stdout.write(json);
}
