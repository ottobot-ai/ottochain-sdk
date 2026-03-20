#!/usr/bin/env node
/**
 * Converts JSON state machine files to TypeScript exports.
 * Run before TypeScript compilation.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcDir = join(__dirname, '..', 'src', 'apps');

const apps = readdirSync(srcDir, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

for (const app of apps) {
  const smDir = join(srcDir, app, 'state-machines');
  if (!existsSync(smDir)) continue;

  const jsonFiles = readdirSync(smDir).filter(f => f.endsWith('.json'));
  if (jsonFiles.length === 0) continue;

  // Generate a TypeScript file that exports all state machines
  const exports = [];
  for (const file of jsonFiles) {
    const content = readFileSync(join(smDir, file), 'utf-8');
    const json = JSON.parse(content);
    // Convert filename to camelCase variable name
    // e.g., "corporate-entity.json" -> "corporateEntityDef"
    // e.g., "governance-legislature.json" -> "govLegislatureDef" (special case)
    let varName = file
      .replace('.json', '')
      .replace(/-([a-z])/g, (_, c) => c.toUpperCase()) + 'Def';
    
    // Handle special governance- prefix -> gov
    varName = varName.replace(/^governance/, 'gov');
    
    exports.push(`export const ${varName} = ${JSON.stringify(json, null, 2)} as const;`);
  }

  const outFile = join(smDir, 'index.ts');
  const header = `/**
 * Auto-generated from JSON state machine definitions.
 * DO NOT EDIT - regenerate with: npm run prebuild
 */

`;
  writeFileSync(outFile, header + exports.join('\n\n'));
  console.log(`Generated ${outFile}`);
}

console.log('Done inlining JSON files.');
