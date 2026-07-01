#!/usr/bin/env node
/**
 * Fetch the OpenAPI contract(s) published as assets on an ottochain GitHub release into `openapi/`,
 * so the SDK's typed HTTP surface is pinned to a RELEASED contract (tied to the metagraph jars)
 * rather than a hand-copied file. Refresh flow:
 *
 *   pnpm fetch:openapi   # download the pinned release's spec(s) into openapi/
 *   pnpm gen:openapi     # regenerate src/generated/openapi.ts from the vendored spec
 *   git add openapi src/generated/openapi.ts && git commit
 *
 * Config + provenance live in openapi/source.json ({ repo, release, assets }). `release` is a tag
 * (e.g. "v0.7.17") to pin, or "latest". A private ottochain repo needs GITHUB_TOKEN (which also
 * raises the API rate limit for public repos).
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const openapiDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'openapi');
const sourcePath = path.join(openapiDir, 'source.json');
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';

function ghHeaders(accept) {
  const h = {
    Accept: accept,
    'User-Agent': 'ottochain-sdk-fetch-openapi',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function ghJson(url) {
  const res = await fetch(url, { headers: ghHeaders('application/vnd.github+json') });
  if (!res.ok) {
    const hint = res.status === 404 ? ' (no such release/repo, or a private repo needs GITHUB_TOKEN)' : '';
    throw new Error(`GitHub API ${res.status} ${res.statusText} for ${url}${hint}`);
  }
  return res.json();
}

async function main() {
  const source = JSON.parse(await readFile(sourcePath, 'utf8'));
  const { repo, release, assets } = source;
  if (!repo || !release || !assets || Object.keys(assets).length === 0) {
    throw new Error('openapi/source.json must set { repo, release, assets: { <releaseAsset>: <localFile> } }');
  }

  const relUrl =
    release === 'latest'
      ? `https://api.github.com/repos/${repo}/releases/latest`
      : `https://api.github.com/repos/${repo}/releases/tags/${release}`;
  const rel = await ghJson(relUrl);
  console.log(`Release ${rel.tag_name} (${repo}) — ${rel.assets.length} asset(s)`);

  const byName = new Map(rel.assets.map((a) => [a.name, a]));

  for (const [assetName, localName] of Object.entries(assets)) {
    const asset = byName.get(assetName);
    if (!asset) {
      throw new Error(
        `Release ${rel.tag_name} has no asset "${assetName}". The ottochain release must ship the ` +
          `OpenAPI contracts (ottochain >= the first release built with the openapi-artifact workflow). ` +
          `Available: ${[...byName.keys()].join(', ') || '(none)'}`,
      );
    }
    // The asset API URL + Accept: application/octet-stream serves the bytes (works for private repos;
    // it 302s to a signed URL and fetch drops the auth header on the cross-origin hop, as intended).
    const res = await fetch(asset.url, { headers: ghHeaders('application/octet-stream') });
    if (!res.ok) throw new Error(`Download "${assetName}" failed: ${res.status} ${res.statusText}`);
    const text = await res.text();
    try {
      JSON.parse(text);
    } catch {
      throw new Error(`Asset "${assetName}" is not valid JSON`);
    }
    await writeFile(path.join(openapiDir, localName), text);
    console.log(`  ✓ ${assetName} -> openapi/${localName} (${text.length} bytes)`);
  }
  console.log('Done. Next: pnpm gen:openapi, then commit openapi/ + src/generated/openapi.ts');
}

main().catch((err) => {
  console.error(`fetch-openapi: ${err.message}`);
  process.exit(1);
});
